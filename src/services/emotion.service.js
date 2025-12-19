// src/services/emotion.service.js
import { prisma } from "../db.config.js";

export const getEmotions = async () => {
  // DB에서 감정 목록 조회
  // - 선택 컬럼을 최소화해서 응답 가볍게
  // - 정렬 고정(테스트/화면에서 순서 안정적)
  const rows = await prisma.emotion.findMany({
    select: {
      id: true,
      emotion_name: true,
    },
    orderBy: { id: "asc" },
  });

  // 프론트 친화 형태로 변환
  return rows.map((e) => ({
    id: e.id,
    name: e.emotion_name,
  }));
};
