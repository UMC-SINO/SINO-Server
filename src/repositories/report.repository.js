import { prisma } from "../db.config.js";

export async function getEmotionCountsAndAiEmotionCountsByUserAndRange({
  userId,
  startDate,
  endDate,
}) {
  // 1) postIds
  const posts = await prisma.post.findMany({
    where: {
      user_id: userId,
      is_deleted: false,
      created_at: {
        gte: startDate,
        lt: endDate,
      },
    },
    select: { id: true },
  });

  const postIds = posts.map((p) => p.id);

  if (postIds.length === 0) {
    return { postIds: [], emotionCounts: {}, aiEmotionCounts: {} };
  }

  // 2) emotion 테이블의 emotion_name 카운트
  const emotionGrouped = await prisma.emotion.groupBy({
    by: ["emotion_name"],
    where: {
      post_id: { in: postIds },
    },
    _count: { _all: true },
  });

  const emotionCounts = {};
  for (const row of emotionGrouped) {
    emotionCounts[String(row.emotion_name)] = row._count._all;
  }

  // 3) aiAnalysis ids (post_id in postIds)
  const analyses = await prisma.aiAnalysis.findMany({
    where: {
      post_id: { in: postIds },
    },
    select: { id: true },
  });

  const analysisIds = analyses.map((a) => a.id);

  if (analysisIds.length === 0) {
    return { postIds, emotionCounts, aiEmotionCounts: {} };
  }

  /**
   * 4) aiAnalyzedEmotion 집계
   * 스키마 기준: aiAnalyzedEmotion은 emotion_name(enum)을 직접 들고 있음
   * => emotion 테이블로 id 매핑할 필요 없음
   */
  const aiGroupedByEmotionName = await prisma.aiAnalyzedEmotion.groupBy({
    by: ["emotion_name"],
    where: {
      analysis_id: { in: analysisIds },
    },
    _count: { _all: true },
  });

  const aiEmotionCounts = {};
  for (const g of aiGroupedByEmotionName) {
    aiEmotionCounts[String(g.emotion_name)] = g._count._all;
  }

  return { postIds, emotionCounts, aiEmotionCounts };
}

export async function getModifiedEmotionBundlesByUserAndRange({
  userId,
  startDate,
  endDate,
}) {
  // 1) postIds
  const posts = await prisma.post.findMany({
    where: {
      user_id: userId,
      is_deleted: false,
      created_at: {
        gte: startDate,
        lt: endDate,
      },
    },
    select: { id: true },
  });

  const postIds = posts.map((p) => p.id);
  if (postIds.length === 0) return [];

  // 2) modified=true emotion rows (+ post.oneLine)
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
          oneLine: {
            select: { content: true },
          },
        },
      },
    }
  });

  // postId별로 묶기 (oneLine은 중복 방지 위해 Set 사용)
  const byPost = new Map(); 
  // postId -> {postId, oneLineSet, modifiedTrueEmotions[], modifiedFalseEmotions[]}

  for (const row of modifiedTrueRows) {
    const postId = row.post_id;

    if (!byPost.has(postId)) {
      byPost.set(postId, {
        postId,
        oneLineSet: new Set(),
        modifiedTrueEmotions: [],
        modifiedFalseEmotions: [],
      });
    }

    const bucket = byPost.get(postId);
    bucket.modifiedTrueEmotions.push(String(row.emotion_name));

    const oneLines = row.post?.oneLine ?? [];
    for (const ol of oneLines) {
      bucket.oneLineSet.add(ol.content);
    }
  }

  const modifiedPostIds = Array.from(byPost.keys());
  if (modifiedPostIds.length === 0) return [];

  // 3) 위 post들에 대해 modified=false emotion rows
  const modifiedFalseRows = await prisma.emotion.findMany({
    where: {
      post_id: { in: modifiedPostIds },
      modified: false,
    },
    select: {
      post_id: true,
      emotion_name: true,
    },
  });

  for (const row of modifiedFalseRows) {
    const bucket = byPost.get(row.post_id);
    if (!bucket) continue;
    bucket.modifiedFalseEmotions.push(String(row.emotion_name));
  }

  // 4) 결과 정리
  const result = Array.from(byPost.values()).map((b) => ({
    postId: b.postId,
    oneLineContents: Array.from(b.oneLineSet),
    modifiedTrueEmotions: b.modifiedTrueEmotions,
    modifiedFalseEmotions: b.modifiedFalseEmotions,
  }));

  // 최신 postId 먼저
  result.sort((a, b) => b.postId - a.postId);

  return result;
}
