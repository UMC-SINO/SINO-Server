import { findByUserId } from "../repositories/user.repository.js";
import { getReportAggregatesByUserAndRange } from "../repositories/report.repository.js";
import { UserNotFoundError, InvalidUserIdError } from "../errors/user.error.js";

function parseId(id) {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

export const generateYearlyReport = async (userId, year) => {
  const userIdNum = parseId(userId);
  if (!userIdNum) {
    throw new InvalidUserIdError({ userId });
  }

  const user = await findByUserId(userIdNum);
  if (!user) {
    throw new UserNotFoundError({ userId: userIdNum });
  }

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year + 1, 0, 1);

  const {
    postIds,
    emotionCounts,
    emotionPercentages,
    aiEmotionPercentages,
    modifiedBundles,
  } = await getReportAggregatesByUserAndRange({
    userId: userIdNum,
    startDate,
    endDate,
  });

  return {
    postIds,
    emotionCounts, // ✅ 추가
    emotionPercentages,
    aiEmotionPercentages,
    modifiedEmotionBundles: modifiedBundles, // 기존 응답 키 유지
  };
};

export const generateMonthlyReport = async (userId, year, month) => {
  const userIdNum = parseId(userId);
  if (!userIdNum) {
    throw new InvalidUserIdError({ userId });
  }

  const user = await findByUserId(userIdNum);
  if (!user) {
    throw new UserNotFoundError({ userId: userIdNum });
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const {
    postIds,
    emotionCounts,
    emotionPercentages,
    aiEmotionPercentages,
    modifiedBundles,
  } = await getReportAggregatesByUserAndRange({
    userId: userIdNum,
    startDate,
    endDate,
  });

  return {
    postIds,
    emotionCounts, // ✅ 추가
    emotionPercentages,
    aiEmotionPercentages,
    modifiedEmotionBundles: modifiedBundles, // 기존 응답 키 유지
  };
};
