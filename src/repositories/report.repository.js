// src/repositories/report.repository.js
import { prisma } from "../db.config.js";

const EMOTIONS = [
  "Boredom",
  "Worried",
  "Smile",
  "Joyful",
  "Happy",
  "Angry",
  "Shameful",
  "Unrest",
  "Afraid",
  "Sad",
];

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/**
 * countsMap: { [emotionName]: count }
 * total: 전체 count
 * => 10개 enum 모두 포함, 총합 100% 형태로 반환
 */
function countsToPercentages(countsMap, total) {
  const out = {};
  for (const e of EMOTIONS) out[e] = 0;

  if (!total || total <= 0) return out;

  for (const e of EMOTIONS) {
    const c = Number(countsMap[e] ?? 0);
    out[e] = round2((c / total) * 100);
  }

  return out;
}

/**
 * 요구사항:
 * - userId의 posts 중 [startDate, endDate) date 범위
 * - emotion 테이블의 emotion_name 빈도 -> 100% 비율 + (추가) emotionCounts도 같이 반환
 * - aiAnalysis->aiAnalyzedEmotion도 emotion_name 빈도 -> 100% 비율
 * - modified=true emotion이 있는 post들에 대해 oneLine.content와 묶어서 반환
 */
export async function getReportAggregatesByUserAndRange({
  userId,
  startDate,
  endDate,
}) {
  // 1) 기간 내 postIds
  const posts = await prisma.post.findMany({
    where: {
      user_id: userId,
      is_deleted: false,
      date: { gte: startDate, lt: endDate },
    },
    select: { id: true },
  });

  const postIds = posts.map((p) => p.id);

  if (postIds.length === 0) {
    return {
      postIds: [],
      emotionCounts: Object.fromEntries(EMOTIONS.map((e) => [e, 0])),
      emotionPercentages: countsToPercentages({}, 0),
      aiEmotionPercentages: countsToPercentages({}, 0),
      modifiedBundles: [],
    };
  }

  /**
   * 2) emotion 빈도 -> counts + percentage
   */
  const emotionGrouped = await prisma.emotion.groupBy({
    by: ["emotion_name"],
    where: { post_id: { in: postIds } },
    _count: { _all: true },
  });

  // ✅ 10개 enum 모두 0으로 초기화된 counts
  const emotionCounts = Object.fromEntries(EMOTIONS.map((e) => [e, 0]));
  let emotionTotal = 0;

  for (const row of emotionGrouped) {
    const key = String(row.emotion_name);
    const cnt = row._count._all;

    if (Object.prototype.hasOwnProperty.call(emotionCounts, key)) {
      emotionCounts[key] += cnt;
      emotionTotal += cnt;
    }
  }

  const emotionPercentages = countsToPercentages(emotionCounts, emotionTotal);

  /**
   * 3) aiAnalyzedEmotion 빈도 -> percentage
   * - post -> aiAnalysis(id) 찾고
   * - aiAnalyzedEmotion에서 analysis_id in (...) 그룹바이 카운트
   */
  const analyses = await prisma.aiAnalysis.findMany({
    where: { post_id: { in: postIds } },
    select: { id: true },
  });

  const analysisIds = analyses.map((a) => a.id);

  let aiEmotionPercentages = countsToPercentages({}, 0);

  if (analysisIds.length > 0) {
    const aiGrouped = await prisma.aiAnalyzedEmotion.groupBy({
      by: ["emotion_name"],
      where: { analysis_id: { in: analysisIds } },
      _count: { _all: true },
    });

    const aiCounts = {};
    let aiTotal = 0;

    for (const row of aiGrouped) {
      const key = String(row.emotion_name);
      const cnt = row._count._all;
      aiCounts[key] = (aiCounts[key] ?? 0) + cnt;
      aiTotal += cnt;
    }

    aiEmotionPercentages = countsToPercentages(aiCounts, aiTotal);
  }

  /**
   * 4) modified=true emotion이 있는 post들 -> oneLine.content와 묶어서 반환
   */
  const modifiedTrueRows = await prisma.emotion.findMany({
    where: {
      post_id: { in: postIds },
      modified: true,
    },
    select: {
      post_id: true,
      emotion_name: true,
      post: {
        select: {
          oneLine: { select: { content: true } },
        },
      },
    },
  });

  const byPost = new Map();

  for (const row of modifiedTrueRows) {
    const postId = row.post_id;

    if (!byPost.has(postId)) {
      byPost.set(postId, {
        postId,
        oneLineSet: new Set(),
        modifiedTrueEmotions: [],
      });
    }

    const bucket = byPost.get(postId);
    bucket.modifiedTrueEmotions.push(String(row.emotion_name));

    const oneLines = row.post?.oneLine ?? [];
    for (const ol of oneLines) {
      bucket.oneLineSet.add(ol.content);
    }
  }

  const modifiedBundles = Array.from(byPost.values())
    .map((b) => ({
      postId: b.postId,
      oneLineContents: Array.from(b.oneLineSet),
      modifiedTrueEmotions: b.modifiedTrueEmotions,
    }))
    .sort((a, b) => b.postId - a.postId);

  return {
    postIds,
    emotionCounts, // ✅ 추가됨
    emotionPercentages,
    aiEmotionPercentages,
    modifiedBundles,
  };
}
