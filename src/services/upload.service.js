// S3 presign / delete 같은 비즈니스 로직
// presigned url 발급

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { buildS3Key } from "../utils/s3key.js";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

export const createPresignedUpload = async ({
  type,        // "profile" | "post"
  userId,      // profile일 때 필요
  postId,      // post일 때 필요
  contentType, // "image/jpeg" 등
}) => {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("S3_BUCKET_MISSING");
  if (!process.env.AWS_REGION) throw new Error("AWS_REGION_MISSING");

  if (!contentType?.startsWith("image/")) {
    throw new Error("CONTENT_TYPE_MUST_BE_IMAGE");
  }

  const key = buildS3Key({ type, userId, postId, contentType });

  // presigned URL 만료(초)
  const expiresIn = 300;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn });

  // public-read 버킷 정책이 이미 있으니, 업로드 후 접근 URL은 이렇게 보면 됨
  const publicUrl = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return { key, uploadUrl, publicUrl, expiresIn };
};
