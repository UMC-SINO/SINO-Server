import { prisma } from "../db.config.js";

export const findById = async (postId) => {
  return prisma.post.findUnique({
    where: { id: postId },
    select: {
      // post 본문(필요한 것만 골라 담아라: 지금은 예시로 꽤 넣음)
      id: true,
      user_id: true,
      date: true,
      title: true,
      content: true,
      photo_url: true,
      created_at: true,
      book_mark: true,
      signal_noise: true,
      is_deleted: true,
      deleted_at: true,

      // aiAnalyzedEmotion.emotion_name (aiAnalysis 경유)
      aiAnalysis: {
        select: {
          id: true,
          post_id: true,
          signal_noise_result: true,
          created_at: true,
          aiAnalyzedEmotion: {
            select: {
              emotion_name: true,
              percentage: true, // 필요 없으면 빼
            },
            orderBy: { id: "asc" },
          },
        },
      },

      // emotion.emotion_name (유저/시스템 감정)
      emotion: {
        select: {
          emotion_name: true,
          modified: true, // 필요 없으면 빼
        },
        orderBy: { id: "asc" },
      },
    },
  });
};

export const updateBookmark = async (postId, nextValue) => {
  return prisma.post.update({
    where: { id: postId },
    data: { book_mark: nextValue },
  });
};

export const deletePostById = async (postId) => {
  return prisma.post.update({
    where: { id: postId, is_deleted: false, deleted_at: null },
    data: { is_deleted: true, deleted_at: new Date() },
  });
};

export const getSignalPostByYear = async (userId, startDate, endDate) => {
  return await prisma.post.findMany({
    where: {
      user_id: userId, // Service에서 이미 파싱된 userId
      created_at: {
        gte: startDate, // Service에서 넘겨준 시작일
        lt: endDate, // Service에서 넘겨준 종료일
      },
      is_deleted: false,
      signal_noise: "signal",
    },
    take: 16,
    orderBy: {
      created_at: "desc",
    },
  });
};

export const getNoisePostByYear = async (userId, startDate, endDate) => {
  return await prisma.post.findMany({
    where: {
      user_id: userId, // Service에서 이미 파싱된 userId
      created_at: {
        gte: startDate, // Service에서 넘겨준 시작일
        lt: endDate, // Service에서 넘겨준 종료일
      },
      is_deleted: false,
      signal_noise: "noise",
    },
    take: 16,
    orderBy: {
      created_at: "desc",
    },
  });
};

export const getSignalPostByMonth = async (userId, startDate, endDate) => {
  return await prisma.post.findMany({
    where: {
      user_id: userId, // Service에서 이미 파싱된 userId
      created_at: {
        gte: startDate, // Service에서 넘겨준 시작일
        lt: endDate, // Service에서 넘겨준 종료일
      },
      is_deleted: false,
      signal_noise: "signal",
    },
    take: 16,
    orderBy: {
      created_at: "desc",
    },
  });
};

export const getNoisePostByMonth = async (userId, startDate, endDate) => {
  return await prisma.post.findMany({
    where: {
      user_id: userId, // Service에서 이미 파싱된 userId
      created_at: {
        gte: startDate, // Service에서 넘겨준 시작일
        lt: endDate, // Service에서 넘겨준 종료일
      },
      is_deleted: false,
      signal_noise: "noise",
    },
    take: 16,
    orderBy: {
      created_at: "desc",
    },
  });
};

// 3. 북마크 검색
export const getSignalPostByBookmark = async (userId) => {
  return prisma.post.findMany({
    where: {
      user_id: parseInt(userId),
      book_mark: true,
      is_deleted: false,
      signal_noise: "signal",
    },
    take: 16,
    orderBy: { created_at: "desc" },
  });
};

export const getNoisePostByBookmark = async (userId) => {
  return prisma.post.findMany({
    where: {
      user_id: parseInt(userId),
      book_mark: true,
      is_deleted: false,
      signal_noise: "noise",
    },
    take: 16,
    orderBy: { created_at: "desc" },
  });
};

export const createOneline = async (postId, onelineContent) => {
  return prisma.oneLine.create({
    data: {
      post_id: postId,
      content: onelineContent,
    },
  });
};

export const updatingEmotion = async (postId, emotionNames) => {
  const pid = Number(postId);
  if (!Number.isInteger(pid) || pid <= 0) {
    throw new Error("Invalid postId");
  }

  // 방어: emotionNames 정리(문자열만, trim, 중복 제거)
  const uniqueNames = Array.from(
    new Set(
      (emotionNames ?? [])
        .filter((v) => typeof v === "string")
        .map((v) => v.trim())
        .filter((v) => v.length > 0)
    )
  );

  return prisma.$transaction(async (tx) => {
    // 1) 해당 post_id의 "변동사항" (modified=true) 전부 삭제
    await tx.emotion.deleteMany({
      where: { post_id: pid, modified: true },
    });

    // 2) 원본(modified=false)으로 이미 존재하는 emotion_name 목록 가져오기
    const baseRows = await tx.emotion.findMany({
      where: { post_id: pid, modified: false },
      select: { emotion_name: true },
    });

    const baseNameSet = new Set(baseRows.map((r) => r.emotion_name));

    // 3) 새로 넣으려는 감정 중, 원본에 이미 있으면 제외
    const toInsert = uniqueNames
      .filter((name) => !baseNameSet.has(name))
      .map((name) => ({
        post_id: pid,
        emotion_name: name,
        modified: true,
      }));

    // 4) 남은 것만 생성 (없으면 createMany 스킵)
    if (toInsert.length > 0) {
      await tx.emotion.createMany({
        data: toInsert,
        // Prisma 버전에 따라 지원되는 경우 안전망
        // skipDuplicates: true,
      });
    }

    // 5) 결과 반환
    return tx.emotion.findMany({
      where: { post_id: pid },
      orderBy: { id: "asc" },
    });
  });
};
