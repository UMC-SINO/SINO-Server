// src/controllers/postCreate.controller.js
import multer from "multer";
import { createPost } from "../services/postCreate.service.js";

const upload = multer({ storage: multer.memoryStorage() });

// photo 0~1개
export const createPostUploadMiddleware = upload.single("photo");

export const handleCreatePost = async (req, res) => {

  const userId = req.session?.user?.id;
  if (!userId) {
    return res.status(401).error({
      errorCode: "AUTH_001",
      reason: "로그인이 필요합니다.",
      data: null,
    });
  }

  const { date, title, content, emotions } = req.body ?? {};

  const result = await createPost({
    userId,
    date,
    title,
    content,
    emotionsJson: emotions,
    photoFile: req.file ?? null,
  });

  return res.success({
    postId: result.postId,
    photo_url: result.photo_url ?? null,
  });
};
