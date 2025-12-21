// src/controllers/emotion.controller.js
import { StatusCodes } from "http-status-codes";
import { Prisma } from "@prisma/client";
import { getEmotions } from "../services/emotion.service.js";


export const handleGetEmotions = async (req, res) => {
  try {
    const emotions = await getEmotions();
    return res.status(StatusCodes.OK).success(emotions);
  } catch (err) {

    // 1) DB 연결 자체가 안됨 (예: P1001)
    if (err instanceof Prisma.PrismaClientInitializationError) {
      return res.status(StatusCodes.SERVICE_UNAVAILABLE).error({
        errorCode: "DB_INIT_FAILED",
        reason: "Prisma Client 초기화/DB 연결에 실패했습니다.",
        data: { message: err.message },
      });
    }

    // 2) Prisma Known Request Error (쿼리/스키마/제약 관련)
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).error({
        errorCode: `PRISMA_${err.code}`,
        reason: "DB 요청 처리 중 Prisma 에러가 발생했습니다.",
        data: {
          code: err.code,
          meta: err.meta ?? null,
          message: err.message,
        },
      });
    }

    // 3) Prisma Validation Error (잘못된 쿼리 파라미터/형식 등)
    if (err instanceof Prisma.PrismaClientValidationError) {
      return res.status(StatusCodes.BAD_REQUEST).error({
        errorCode: "PRISMA_VALIDATION_ERROR",
        reason: "요청 처리 중 Prisma 검증 오류가 발생했습니다.",
        data: { message: err.message },
      });
    }

    // 4) 그 외 일반 서버 오류
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).error({
      errorCode: "EMOTION_LIST_FAILED",
      reason: "감정 목록 조회에 실패했습니다.",
      data: { message: err?.message ?? String(err) },
    });
  }
};
