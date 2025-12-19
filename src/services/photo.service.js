// src/services/photo.service.js
import { prisma } from "../db.config.js";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { buildS3Key } from "../utils/s3key.js";

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.S3_BUCKET;
const ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

const allowedContentTypes = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

const toPublicUrl = (key) => {
  // public bucket policy로 GetObject가 열려있다는 전제
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
};

const extractKeyFromPublicUrl = (publicUrl) => {
  // https://bucket.s3.region.amazonaws.com/posts/1/uuid.jpg -> posts/1/uuid.jpg
  try {
    const u = new URL(publicUrl);
    return u.pathname.replace(/^\//, "");
  } catch {
    return null;
  }
};

const deleteS3ObjectBestEffort = async (key) => {
  if (!key) return;
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );
  } catch (e) {
    // 삭제 실패는 치명적 실패로 보지 않음(로그만 남김)
    console.warn("[S3] delete object failed (ignored):", { key, message: e?.message });
  }
};

const uploadToS3 = async ({ key, buffer, contentType }) => {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return toPublicUrl(key);
};

const normalizeUploadOrders = ({ upload_orders, fileCount }) => {
  // upload_orders가 없으면 1..N 자동 부여 (슬롯 UI면 보통 프론트가 보내지만, 방어코드)
  if (upload_orders == null) {
    return Array.from({ length: fileCount }, (_, i) => i + 1);
  }

  // multer는 form-data에서 같은 키가 여러 번 오면 배열이 되거나 단일이면 string이 될 수 있음
  const arr = Array.isArray(upload_orders) ? upload_orders : [upload_orders];
  const orders = arr.map((x) => Number(x));

  if (orders.length !== fileCount) {
    const err = new Error("upload_orders 개수가 파일 개수와 일치해야 합니다.");
    err.code = "UPLOAD_ORDERS_COUNT_MISMATCH";
    err.data = { fileCount, uploadOrdersCount: orders.length };
    throw err;
  }

  for (const o of orders) {
    if (!Number.isInteger(o)) {
      const err = new Error("upload_order는 정수여야 합니다.");
      err.code = "INVALID_UPLOAD_ORDER_TYPE";
      err.data = { received: o };
      throw err;
    }
    if (o < 1 || o > 4) {
      const err = new Error("upload_order는 1~4만 가능합니다.");
      err.code = "INVALID_UPLOAD_ORDER_RANGE";
      err.data = { received: o };
      throw err;
    }
  }

  const unique = new Set(orders);
  if (unique.size !== orders.length) {
    const err = new Error("upload_order가 중복되었습니다.");
    err.code = "DUPLICATE_UPLOAD_ORDER";
    err.data = { orders };
    throw err;
  }

  return orders;
};

/**
 * Save 버튼 1번으로: (파일들) -> S3 업로드 -> DB(photo) 전체 교체 저장
 * - 기존 사진은 전부 삭제하고 새로 저장
 * - 기존 S3 파일도 best-effort로 삭제
 */
export const replacePostPhotosWithFiles = async ({ postId, files, upload_orders }) => {
  // 0) postId 검증
  if (!Number.isInteger(postId) || postId <= 0) {
    const err = new Error("postId가 올바르지 않습니다.");
    err.code = "INVALID_POST_ID";
    err.data = { postId };
    throw err;
  }

  // 1) files 검증
  if (!Array.isArray(files) || files.length === 0) {
    const err = new Error("업로드할 사진이 없습니다.");
    err.code = "NO_FILES";
    throw err;
  }

  if (files.length > 4) {
    const err = new Error("사진은 최대 4장까지 가능합니다.");
    err.code = "PHOTO_MAX_LIMIT";
    err.data = { receivedCount: files.length };
    throw err;
  }

  for (const f of files) {
    const ct = f?.mimetype;
    if (!allowedContentTypes.has(ct)) {
      const err = new Error("지원하지 않는 파일 타입입니다.");
      err.code = "UNSUPPORTED_CONTENT_TYPE";
      err.data = { mimetype: ct };
      throw err;
    }
  }

  // 2) upload_orders 정규화 + 검증
  const orders = normalizeUploadOrders({ upload_orders, fileCount: files.length });

  // 3) post 존재 확인
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    const err = new Error("존재하지 않는 postId 입니다.");
    err.code = "POST_NOT_FOUND";
    err.data = { postId };
    throw err;
  }

  // 4) 기존 사진 조회(나중에 S3 삭제용)
  const prevPhotos = await prisma.photo.findMany({
    where: { post_id: postId },
    select: { url: true, upload_order: true },
  });

  // 5) 먼저 S3 업로드(전부 성공하면 DB 반영)
  const uploaded = []; // { key, url, uploadOrder }
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadOrder = orders[i];

      const key = buildS3Key({
        type: "post",
        postId,
        contentType: file.mimetype,
      });

      const publicUrl = await uploadToS3({
        key,
        buffer: file.buffer,
        contentType: file.mimetype,
      });

      uploaded.push({ key, url: publicUrl, uploadOrder });
    }
  } catch (e) {
    // 업로드 일부 성공했을 수 있으니, 새로 업로드한 것들 롤백(best-effort)
    await Promise.all(uploaded.map((x) => deleteS3ObjectBestEffort(x.key)));

    const err = new Error("S3 업로드에 실패했습니다.");
    err.code = "S3_UPLOAD_FAILED";
    err.data = { message: e?.message ?? "unknown" };
    throw err;
  }

  // 6) DB 반영(트랜잭션): 기존 DB photo 전체 삭제 -> 새로 생성
  try {
    await prisma.$transaction(async (tx) => {
      await tx.photo.deleteMany({
        where: { post_id: postId },
      });

      for (const it of uploaded) {
        await tx.photo.create({
          data: {
            post_id: postId,
            url: it.url,
            upload_order: it.uploadOrder,
            is_picked: false,
          },
        });
      }
    });
  } catch (e) {
    // DB 실패 시: 새로 올린 S3 파일들 삭제(best-effort)
    await Promise.all(uploaded.map((x) => deleteS3ObjectBestEffort(x.key)));

    const err = new Error("DB 저장에 실패했습니다.");
    err.code = "DB_WRITE_FAILED";
    err.data = { message: e?.message ?? "unknown" };
    throw err;
  }

  // 7) 기존 S3 파일 삭제(best-effort)
  await Promise.all(
    prevPhotos.map((p) => deleteS3ObjectBestEffort(extractKeyFromPublicUrl(p.url)))
  );

  // 8) 반환
  const photos = await prisma.photo.findMany({
    where: { post_id: postId },
    orderBy: { upload_order: "asc" },
  });

  return {
    postId,
    photos,
  };
};
