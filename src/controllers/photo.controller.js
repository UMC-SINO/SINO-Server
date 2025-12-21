// src/controllers/photo.controller.js



import multer from "multer";
import { StatusCodes } from "http-status-codes";
import { Prisma } from "@prisma/client";
import { replacePostPhotosWithFiles } from "../services/photo.service.js";

// 메모리에 파일 올려서 바로 S3로 보냄(디스크 저장 X)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 4,
    fileSize: 10 * 1024 * 1024, // 10MB (원하면 조정)
  },
});

// index.js에서 이 미들웨어를 route에 붙일 수 있게 export
export const postPhotosUploadMiddleware = upload.array("photos", 4);

export const handleUploadPostPhotos = async (req, res) => {
  try {
    const postId = Number(req.params.postId);

    // 1) postId 검증
    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).error({
        errorCode: "INVALID_POST_ID",
        reason: "postId가 올바르지 않습니다.",
        data: { received: req.params.postId },
      });
    }

    // 2) files 검증
    const files = req.files;
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).error({
        errorCode: "NO_FILES",
        reason: "업로드할 사진이 없습니다.",
        data: null,
      });
    }

    if (files.length > 4) {
      return res.status(StatusCodes.BAD_REQUEST).error({
        errorCode: "PHOTO_MAX_LIMIT",
        reason: "사진은 최대 4장까지 가능합니다.",
        data: { receivedCount: files.length },
      });
    }

    // 3) upload_orders 받기(슬롯 UI니까 프론트가 보낸다고 가정)
    // form-data에서 upload_orders가 배열/단일 둘 다 가능하니 service에서 정규화
    const upload_orders = req.body?.upload_orders;

    // 4) 서비스 호출 (S3 업로드 + DB 전체 교체)
    const result = await replacePostPhotosWithFiles({
      postId,
      files,
      upload_orders,
    });

    return res.status(StatusCodes.OK).success(result);
  } catch (e) {
    // 서비스에서 의도적으로 던진 에러 (code 포함)
    if (e?.code) {
      const code = e.code;
      const reason = e.message ?? "unknown";

      // 상태코드 맵핑 (명확하게 보여주기)
      if (code === "POST_NOT_FOUND") {
        return res.status(StatusCodes.NOT_FOUND).error({
          errorCode: code,
          reason,
          data: e.data ?? null,
        });
      }

      if (code === "S3_UPLOAD_FAILED") {
        return res.status(StatusCodes.BAD_GATEWAY).error({
          errorCode: code,
          reason,
          data: e.data ?? null,
        });
      }

      if (code === "DB_WRITE_FAILED") {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).error({
          errorCode: code,
          reason,
          data: e.data ?? null,
        });
      }

      // 나머지는 대부분 요청값 문제
      return res.status(StatusCodes.BAD_REQUEST).error({
        errorCode: code,
        reason,
        data: e.data ?? null,
      });
    }

    // Prisma 예외 분기(점수용)
    if (e instanceof Prisma.PrismaClientInitializationError) {
      return res.status(StatusCodes.SERVICE_UNAVAILABLE).error({
        errorCode: "DB_INIT_FAILED",
        reason: "DB 연결/초기화에 실패했습니다.",
        data: { message: e.message },
      });
    }

    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).error({
        errorCode: `PRISMA_${e.code}`,
        reason: "DB 요청 처리 중 Prisma 에러가 발생했습니다.",
        data: { code: e.code, meta: e.meta ?? null, message: e.message },
      });
    }

    if (e instanceof Prisma.PrismaClientValidationError) {
      return res.status(StatusCodes.BAD_REQUEST).error({
        errorCode: "PRISMA_VALIDATION_ERROR",
        reason: "DB 요청 파라미터/형식이 올바르지 않습니다.",
        data: { message: e.message },
      });
    }

    // multer 파일 제한 에러(점수용)
    if (e?.code === "LIMIT_FILE_SIZE") {
      return res.status(StatusCodes.BAD_REQUEST).error({
        errorCode: "FILE_TOO_LARGE",
        reason: "파일 용량 제한을 초과했습니다.",
        data: { limit: "10MB" },
      });
    }

    if (e?.code === "LIMIT_FILE_COUNT") {
      return res.status(StatusCodes.BAD_REQUEST).error({
        errorCode: "TOO_MANY_FILES",
        reason: "파일 개수가 너무 많습니다(최대 4장).",
        data: null,
      });
    }

    // 그 외
    console.error("[handleUploadPostPhotos] unexpected error:", e);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).error({
      errorCode: "PHOTO_UPLOAD_FAILED",
      reason: "사진 업로드 처리 중 알 수 없는 오류가 발생했습니다.",
      data: { where: "handleUploadPostPhotos", message: e?.message ?? "unknown" },
    });
  }
};
