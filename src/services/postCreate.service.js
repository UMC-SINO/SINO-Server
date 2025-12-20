// src/services/postCreate.service.js
import {prisma} from "../db.config.js";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { buildS3Key } from "../utils/s3key.js";
import {
  PostCreateValidationError,
  S3ConfigMissingError,
  S3UploadFailedError,
} from "../errors/postCreate.error.js";

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.S3_BUCKET;

const assertS3Env = () => {
  const missing = [];
  if (!process.env.AWS_REGION) missing.push("AWS_REGION");
  if (!process.env.S3_BUCKET) missing.push("S3_BUCKET");
  if (!process.env.AWS_ACCESS_KEY_ID) missing.push("AWS_ACCESS_KEY_ID");
  if (!process.env.AWS_SECRET_ACCESS_KEY) missing.push("AWS_SECRET_ACCESS_KEY");
  if (missing.length) throw new S3ConfigMissingError(missing);
};

const s3 = new S3Client({ region: REGION });

const toPublicUrl = (key) => `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

const deleteS3BestEffort = async (key) => {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (e) {
    console.warn("[S3] delete failed (ignored):", { key, message: e?.message });
  }
};

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

const parseAndValidateEmotions = (emotionsJson) => {
  let emotions;
  try {
    emotions = JSON.parse(emotionsJson);
  } catch {
    throw new PostCreateValidationError({
      errorCode: "POST_001",
      reason: "emotions는 JSON 배열 문자열이어야 합니다.",
      data: { received: emotionsJson },
    });
  }

  if (!Array.isArray(emotions)) {
    throw new PostCreateValidationError({
      errorCode: "POST_002",
      reason: "emotions는 배열이어야 합니다.",
      data: { receivedType: typeof emotions },
    });
  }

  if (emotions.length < 1 || emotions.length > 5) {
    throw new PostCreateValidationError({
      errorCode: "POST_003",
      reason: "emotions는 1~5개여야 합니다.",
      data: { length: emotions.length },
    });
  }

  // 중복 제거
  const unique = new Set(emotions);
  if (unique.size !== emotions.length) {
    throw new PostCreateValidationError({
      errorCode: "POST_004",
      reason: "emotions에 중복 값이 있습니다.",
      data: { emotions },
    });
  }

  for (const e of emotions) {
    if (typeof e !== "string") {
      throw new PostCreateValidationError({
        errorCode: "POST_005",
        reason: "emotion_name은 문자열이어야 합니다.",
        data: { invalid: e },
      });
    }
    if (!ALLOWED_EMOTIONS.has(e)) {
      throw new PostCreateValidationError({
        errorCode: "POST_006",
        reason: "허용되지 않은 emotion_name 입니다.",
        data: { invalid: e, allowed: Array.from(ALLOWED_EMOTIONS) },
      });
    }
  }

  return emotions;
};

const parseAndValidateDate = (dateStr) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) {
    throw new PostCreateValidationError({
      errorCode: "POST_007",
      reason: "date 형식이 올바르지 않습니다.",
      data: { received: dateStr },
    });
  }
  return d;
};

const uploadOnePhotoToS3 = async ({ userId, postId, file }) => {
  try {
    const key = buildS3Key({
      type: "post",
      userId, 
      postId,
      contentType: file.mimetype,
    });

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    return { key, url: toPublicUrl(key) };
  } catch (e) {
    const err = new S3UploadFailedError("S3 업로드에 실패했습니다.", {
      message: e?.message ?? "unknown",
      code: e?.code,
    });
    throw err;
  }
};

export const createPost = async ({ userId, date, title, content, emotionsJson, photoFile }) => {
  // 기본 검증
  if (!content || typeof content !== "string") {
    throw new PostCreateValidationError({
      errorCode: "POST_008",
      reason: "content는 필수입니다.",
    });
  }
  if (!date) {
    throw new PostCreateValidationError({
      errorCode: "POST_009",
      reason: "date는 필수입니다.",
    });
  }
  if (!emotionsJson) {
    throw new PostCreateValidationError({
      errorCode: "POST_010",
      reason: "emotions는 필수입니다.",
    });
  }

  // 파싱/검증
  const d = parseAndValidateDate(date);
  const emotions = parseAndValidateEmotions(emotionsJson);

  // photo가 있으면 S3 설정 체크
  if (photoFile) assertS3Env();

  // 1) post 먼저 생성해서 postId 확보
  const created = await prisma.post.create({
    data: {
      user_id: userId,
      date: d,
      title: title ?? null,
      content,
      photo_url: null,
    },
    select: { id: true },
  });

  let uploadedKey = null;
  let photoUrl = null;

  try {
    // 2) 사진 있으면 S3 업로드 후 post.photo_url 업데이트
    if (photoFile) {
      const uploaded = await uploadOnePhotoToS3({
        userId,
        postId: created.id,
        file: photoFile,
      });

      uploadedKey = uploaded.key;
      photoUrl = uploaded.url;

      await prisma.post.update({
        where: { id: created.id },
        data: { photo_url: photoUrl },
      });
    }

    // 3) emotion 여러 개 insert
    await prisma.emotion.createMany({
      data: emotions.map((name) => ({
        post_id: created.id,
        emotion_name: name,
        modified: false,
      })),
    });

    return { postId: created.id, photo_url: photoUrl };
  } catch (e) {
    if (uploadedKey) await deleteS3BestEffort(uploadedKey);
    throw e;
  }
};
