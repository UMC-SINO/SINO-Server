// src/controllers/postUpdate.controller.js
import multer from "multer";
import { updatePostWithOptionalPhotoAndEmotions } from "../services/postUpdate.service.js";
import {
  PostUpdateValidationError,
  PostNotFoundError,
} from "../errors/postUpdate.error.js";

// 메모리에 파일 올려서 바로 S3로 업로드(디스크 저장 X)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, 
});

// photo: 0~1개
export const updatePostUploadMiddleware = upload.single("photo");

/**
 * PATCH /api/posts/:postId
 * multipart/form-data
 * - title?: string | null
 * - content?: string (빈문자 허용. "안바꾸려면 key 자체를 안보냄")
 * - date?: string | null (DATETIME)
 * - emotions?: string  (예: ["Happy","Worried"] JSON 문자열) | undefined(미변경)
 * - removePhoto?: "true" | "false" | undefined (photo_url 제거 플래그)
 * - photo?: File 
 */
export const handleUpdatePost = async (req, res) => {
  const postId = Number(req.params.postId);
  if (!Number.isInteger(postId) || postId <= 0) {
    throw new PostUpdateValidationError({ postId }, "postId가 올바르지 않습니다.");
  }


  const userId = req.session?.user?.id;
    if (!userId) throw new UserNotFoundError(null, "로그인이 필요합니다.");

  // multipart에서 값이 "존재"하는지 여부가 핵심
  // - key가 아예 없으면 undefined (미변경)
  // - key가 있으면 string 또는 빈문자("") 또는 "null" 같은 값이 올 수 있음
  const { title, content, date, emotions, removePhoto } = req.body ?? {};
  const file = req.file ?? null;

  const parsed = {
    title: title === undefined ? undefined : (title === "null" ? null : title),
    date: date === undefined ? undefined : (date === "null" ? null : date),
    content: content === undefined ? undefined : content, // 빈문자 허용
    emotions: undefined,
    removePhoto: removePhoto === "true",
  };

  if (emotions !== undefined) {
    // emotions는 JSON 문자열로 받기로 했음: '["Happy","Sad"]'
    try {
      const arr = JSON.parse(emotions);
      if (!Array.isArray(arr)) {
        throw new Error("emotions는 배열이어야 합니다.");
      }
      parsed.emotions = arr;
    } catch (e) {
      throw new PostUpdateValidationError(
        { emotions },
        "emotions는 JSON 배열 문자열이어야 합니다. 예: [\"Happy\",\"Sad\"]"
      );
    }
  }

  const result = await updatePostWithOptionalPhotoAndEmotions({
    postId,
    sessionUser: req.session?.user,
    body: req.body,               
    file,                         
  });

  return res.success(result);
};
