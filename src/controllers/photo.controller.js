import { StatusCodes } from "http-status-codes";
import { addPostPhoto } from "../services/photo.service.js";

export const handleAddPostPhoto = async (req, res) => {
  const postId = Number(req.params.postId);
  const { url, upload_order } = req.body;

  if (!postId || Number.isNaN(postId)) {
    return res.status(StatusCodes.BAD_REQUEST).error({
      errorCode: "INVALID_POST_ID",
      reason: "postId가 올바르지 않습니다.",
    });
  }

  if (!url || typeof url !== "string") {
    return res.status(StatusCodes.BAD_REQUEST).error({
      errorCode: "INVALID_URL",
      reason: "url이 필요합니다.",
    });
  }

  const order = Number(upload_order);
  if (!order || Number.isNaN(order)) {
    return res.status(StatusCodes.BAD_REQUEST).error({
      errorCode: "INVALID_UPLOAD_ORDER",
      reason: "upload_order는 숫자여야 합니다.",
    });
  }

  const saved = await addPostPhoto({ postId, url, uploadOrder: order });

  return res.status(StatusCodes.OK).success(saved);
};
