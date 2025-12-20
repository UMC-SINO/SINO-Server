// src/services/postUpdate.service.js
import { prisma } from "../db.config.js";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { buildS3Key } from "../utils/s3key.js";
import {
  PostForbiddenError,
  PostNotFoundError,
  PostUpdateValidationError,
  S3UploadFailedError,
} from "../errors/postUpdate.error.js";

// ERD ENUM 그대로
const ALLOWED_EMOTIONS = new Set([
  "Boredom",
  "Worried",
  "Smile",
  "Joyful",
  "Happy",
  "Angry",
  "Shameful",
  "Unrest",
  "Afraid",
  "Sad",
]);

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.S3_BUCKET;

const s3 = new S3Client({ region: REGION });

const toPublicUrl = (key) => `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

const extractKeyFromPublicUrl = (url) => {
  if (!url) return null;
  // https://bucket.s3.region.amazonaws.com/posts/1/uuid.jpg -> posts/1/uuid.jpg
  const marker = `.amazonaws.com/`;
  const idx = url.indexOf(marker);
  if (idx < 0) return null;
  return url.slice(idx + marker.length);
};

const deleteS3ObjectBestEffort = async (key) => {
  if (!key) return;
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (e) {
    console.warn("[S3] delete object failed (ignored):", { key, message: e?.message });
  }
};

const uploadToS3 = async ({ key, buffer, contentType }) => {
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    return toPublicUrl(key);
  } catch (e) {
    throw new S3UploadFailedError("S3 업로드에 실패했습니다.", {
      where: "uploadToS3",
      message: e?.message ?? "unknown",
    });
  }
};


// - undefined(키 없음) => 업데이트 안 함
// - "" 또는 "null" => null로 저장
// - 그 외 문자열 => 그대로 사용
const normalizeNullable = (v) => {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== "string") return v;
  const trimmed = v.trim();
  if (trimmed === "" || trimmed.toLowerCase() === "null") return null;
  return v;
};

const parseDateOrNull = (v) => {
  const normalized = normalizeNullable(v);
  if (normalized === undefined) return undefined; // no update
  if (normalized === null) return null; // set null
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) {
    throw new PostUpdateValidationError({ date: v }, "date 형식이 올바르지 않습니다.");
  }
  return d;
};

const parseEmotions = (v) => {
  const normalized = normalizeNullable(v);

  if (normalized === undefined) return undefined; // no update
  if (normalized === null) return []; // clear all

  let arr;
  try {
    arr = JSON.parse(normalized);
  } catch {
    throw new PostUpdateValidationError({ emotions: v }, "emotions는 JSON 문자열 배열이어야 합니다.");
  }

  if (!Array.isArray(arr)) {
    throw new PostUpdateValidationError({ emotions: v }, "emotions는 배열이어야 합니다.");
  }

  // 길이 제한
  if (arr.length > 5) {
    throw new PostUpdateValidationError({ emotionsCount: arr.length }, "emotions는 최대 5개까지 가능합니다.");
  }

  for (const e of arr) {
    if (typeof e !== "string" || !ALLOWED_EMOTIONS.has(e)) {
      throw new PostUpdateValidationError(
        { emotion: e, allowed: Array.from(ALLOWED_EMOTIONS) },
        "emotions에 허용되지 않은 값이 포함되어 있습니다."
      );
    }
  }

  // 중복 제거
  return Array.from(new Set(arr));
};

export const updatePostWithOptionalPhotoAndEmotions = async ({
  postId,
  sessionUser,
  body,
  file, // multer single file
}) => {
  // 1) 로그인 유저 식별 
  const sessionUserId = sessionUser?.id;
  const sessionUserName = sessionUser?.name;

  let userId = sessionUserId;
  if (!userId) {
    if (!sessionUserName) {
      throw new PostUpdateValidationError(null, "세션 사용자 정보가 없습니다.");
    }
    const u = await prisma.user.findUnique({ where: { name: sessionUserName }, select: { id: true } });
    if (!u) throw new PostUpdateValidationError({ name: sessionUserName }, "세션 사용자 정보를 찾을 수 없습니다.");
    userId = u.id;
  }

  // 2) 게시글 존재/권한 확인
  const existing = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, user_id: true, photo_url: true },
  });
  if (!existing) throw new PostNotFoundError(postId);
  if (existing.user_id !== userId) throw new PostForbiddenError(postId);

  // 3) 입력 파싱
  const title = normalizeNullable(body?.title);
  const content = normalizeNullable(body?.content);
  const date = parseDateOrNull(body?.date);

  const emotionsRaw = body?.emotions;
  const emotions = parseEmotions(emotionsRaw);

  const removePhoto =
    String(body?.removePhoto ?? "").toLowerCase() === "true" ||
    String(body?.removePhoto ?? "") === "1";

  // 4) 업데이트 데이터 구성 (undefined는 업데이트 안 함)
  const updateData = {};
  if (title !== undefined) updateData.title = title; // null 가능
  if (date !== undefined) updateData.date = date; // null 가능

  if (content !== undefined) {
    if (content === null) {
      throw new PostUpdateValidationError({ content }, "content는 null로 설정할 수 없습니다.");
    }
    updateData.content = content;
  }

  // 5) 사진 처리
  // - file 있으면 업로드 후 photo_url 교체
  // - removePhoto=true면 photo_url null
  // - 둘 다 오면: file 우선(or 정책 선택) 
  let newPhotoUrl;
  let uploadedKey;

  if (removePhoto) {
    updateData.photo_url = null;
  } else if (file) {
    if (!BUCKET || !REGION) {
      throw new PostUpdateValidationError(
        { AWS_REGION: REGION, S3_BUCKET: BUCKET },
        "S3 환경변수가 설정되지 않았습니다."
      );
    }
    const key = buildS3Key({
      type: "post",
      postId,
      contentType: file.mimetype,
    });
    uploadedKey = key;
    newPhotoUrl = await uploadToS3({
      key,
      buffer: file.buffer,
      contentType: file.mimetype,
    });
    updateData.photo_url = newPhotoUrl;
  }

  // 6) 트랜잭션: post 업데이트 + (emotions 제공 시) emotion 전체 교체
  try {
    const result = await prisma.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) {
        await tx.post.update({
          where: { id: postId },
          data: updateData,
        });
      }

      if (emotions !== undefined) {
        // emotions가 들어오면 전체 교체(0개면 삭제만)
        await tx.emotion.deleteMany({ where: { post_id: postId } });

        if (emotions.length > 0) {
          await tx.emotion.createMany({
            data: emotions.map((name) => ({
              post_id: postId,
              emotion_name: name,
              modified: false,
            })),
          });
        }
      }

      return { postId };
    });

    // DB 반영 성공 후: 이전 사진 S3 삭제(best-effort)
    // - 새 사진 업로드된 경우: 기존 photo_url이 S3 키라면 삭제 시도
    // - removePhoto인 경우도 기존 파일 삭제 시도
    if ((file && newPhotoUrl) || removePhoto) {
      const prevKey = extractKeyFromPublicUrl(existing.photo_url);
      await deleteS3ObjectBestEffort(prevKey);
    }

    return result;
  } catch (e) {
    // DB 실패 시: 방금 업로드한 새 파일 삭제(best-effort)
    if (uploadedKey) await deleteS3ObjectBestEffort(uploadedKey);
    throw e;
  }
};
