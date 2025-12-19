// src/utils/s3key.js
import { v4 as uuidv4 } from "uuid";

const extFromContentType = (contentType) => {
  const map = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return map[contentType];
};

export const buildS3Key = ({ type, userId, postId, contentType }) => {
  const ext = extFromContentType(contentType);
  if (!ext) {
    const err = new Error("지원하지 않는 contentType 입니다.");
    err.code = "UNSUPPORTED_CONTENT_TYPE";
    err.data = { contentType };
    throw err;
  }

  const id = uuidv4();

  if (type === "profile") {
    if (!userId) {
      const err = new Error("userId가 필요합니다.");
      err.code = "USER_ID_REQUIRED";
      throw err;
    }
    return `users/${userId}/profile-${id}.${ext}`;
  }

  if (type === "post") {
    if (!postId) {
      const err = new Error("postId가 필요합니다.");
      err.code = "POST_ID_REQUIRED";
      throw err;
    }
    return `posts/${postId}/${id}.${ext}`;
  }

  const err = new Error("type 값이 올바르지 않습니다.");
  err.code = "INVALID_TYPE";
  err.data = { type };
  throw err;
};
