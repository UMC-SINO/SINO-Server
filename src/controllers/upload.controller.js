// HTTP 요청/응답 처리

import { StatusCodes } from "http-status-codes";
import { createPresignedUpload } from "../services/upload.service.js";

export const handleCreatePresignedUrl = async (req, res) => {
  try {
    const { type, userId, postId, contentType } = req.body;

    const data = await createPresignedUpload({ type, userId, postId, contentType });

    return res.status(StatusCodes.OK).success(data);
  } catch (e) {
    return res.status(StatusCodes.BAD_REQUEST).error({
      errorCode: "UPLOAD_PRESIGN_FAILED",
      reason: e?.message ?? "unknown",
    });
  }
};
