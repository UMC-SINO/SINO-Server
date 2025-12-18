// key 생성 규칙

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
    throw new Error("UNSUPPORTED_CONTENT_TYPE");
  }

  const id = uuidv4();

  if (type === "profile") {
    if (!userId) throw new Error("USER_ID_REQUIRED");
    return `users/${userId}/profile-${id}.${ext}`;
  }

  if (type === "post") {
    if (!postId) throw new Error("POST_ID_REQUIRED");
    return `posts/${postId}/${id}.${ext}`;
  }

  throw new Error("INVALID_TYPE");
};
