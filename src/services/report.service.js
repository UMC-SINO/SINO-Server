import { findByUserId } from "../repositories/user.repository.js";
import {
  getEmotionCountsAndAiEmotionCountsByUserAndRange,
  getModifiedEmotionBundlesByUserAndRange,
} from "../repositories/report.repository.js";
import { UserNotFoundError, InvalidUserIdError } from "../errors/user.error.js";

function parseId(postId) {
  const n = Number(postId);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

export const generateYearlyReport = async (userId, year) => {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year + 1, 0, 1);
  const userIdNum = parseId(userId);
  if (!userIdNum) {
    throw new InvalidUserIdError({ userId });
  }
  const user = await findByUserId(userId);
  if (!user) {
    throw new UserNotFoundError({ userId });
  }
  const { postIds, emotionCounts, aiEmotionCounts } =
    await getEmotionCountsAndAiEmotionCountsByUserAndRange({
      userId: userIdNum,
      startDate,
      endDate,
    });
  const modifiedEmotionBundles = await getModifiedEmotionBundlesByUserAndRange({
    userId: userIdNum,
    startDate,
    endDate,
  });

  return {
    postIds,
    emotionCounts,
    aiEmotionCounts,
    modifiedEmotionBundles,
  };
};

export const generateMonthlyReport = async (userId, year, month) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);
  const userIdNum = parseId(userId);
  if (!userIdNum) {
    throw new InvalidUserIdError({ userId });
  }
  const user = await findByUserId(userId);
  if (!user) {
    throw new UserNotFoundError({ userId });
  }
  const { postIds, emotionCounts, aiEmotionCounts } =
    await getEmotionCountsAndAiEmotionCountsByUserAndRange({
      userId: userIdNum,
      startDate,
      endDate,
    });
  const modifiedEmotionBundles = await getModifiedEmotionBundlesByUserAndRange({
    userId: userIdNum,
    startDate,
    endDate,
  });

  return {
    postIds,
    emotionCounts,
    aiEmotionCounts,
    modifiedEmotionBundles,
  };
};
