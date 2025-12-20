import { prisma } from "../db.config.js";

export const findById = async (postId) => {
  return prisma.post.findUnique({
    where: { id: postId },
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
  })
};

export const getSignalPostByYear = async (userId, startDate, endDate) => {
    return await prisma.post.findMany({
    where: {
      user_id: userId, // Service에서 이미 파싱된 userId
      created_at: {
        gte: startDate, // Service에서 넘겨준 시작일
        lt: endDate,    // Service에서 넘겨준 종료일
      },
      is_deleted: false,
      signal_noise: "signal"
    },
    take: 16,
    orderBy: {
      created_at: 'desc',
    },
  });
};

export const getNoisePostByYear = async (userId, startDate, endDate) => {
    return await prisma.post.findMany({
    where: {
      user_id: userId, // Service에서 이미 파싱된 userId
      created_at: {
        gte: startDate, // Service에서 넘겨준 시작일
        lt: endDate,    // Service에서 넘겨준 종료일
      },
      is_deleted: false,
      signal_noise: "noise"
    },
    take: 16,
    orderBy: {
      created_at: 'desc',
    },
  });
};

export const getSignalPostByMonth = async (userId, startDate, endDate) => {
    return await prisma.post.findMany({
    where: {
      user_id: userId, // Service에서 이미 파싱된 userId
      created_at: {
        gte: startDate, // Service에서 넘겨준 시작일
        lt: endDate,    // Service에서 넘겨준 종료일
      },
      is_deleted: false,
      signal_noise: "signal"
    },
    take: 16,
    orderBy: {
      created_at: 'desc',
    },
  });
};

export const getNoisePostByMonth = async (userId, startDate, endDate) => {
    return await prisma.post.findMany({
    where: {
      user_id: userId, // Service에서 이미 파싱된 userId
      created_at: {
        gte: startDate, // Service에서 넘겨준 시작일
        lt: endDate,    // Service에서 넘겨준 종료일
      },
      is_deleted: false,
      signal_noise: "noise"
    },
    take: 16,
    orderBy: {
      created_at: 'desc',
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
            signal_noise: "signal"
        },
        take: 16,
        orderBy: { created_at: 'desc' }
    });
};

export const getNoisePostByBookmark = async (userId) => {
    return prisma.post.findMany({
        where: {
            user_id: parseInt(userId),
            book_mark: true,
            is_deleted: false,
            signal_noise: "noise"
        },
        take: 16,
        orderBy: { created_at: 'desc' }
    });
};

export const updatePostOneline = async (postId, onelineContent) => {
  return prisma.oneline.create({
    data: {
      post_id: postId,
      content: onelineContent,
    }
  });
};

export const updateEmotion = async (postId, emotionNames) => {
  const pid = Number(postId);
  if (!Number.isInteger(pid) || pid <= 0) {
    throw new Error("Invalid postId");
  }

  // emotionNames는 배열이어야 함 (repository에서도 최소 방어)
  if (!Array.isArray(emotionNames)) {
    throw new Error("emotionNames must be an array");
  }

  return prisma.$transaction(async (tx) => {
    // 1) 기존 감정 삭제
    await tx.emotion.deleteMany({
      where: { post_id: pid },
    });

    // 2) 새 감정 삽입 (0개면 삽입 생략)
    if (emotionNames.length > 0) {
      await tx.emotion.createMany({
        data: emotionNames.map((name) => ({
          post_id: pid,
          emotion_name: name,
        })),
      });
    }

    // 3) 결과 반환
    return tx.emotion.findMany({
      where: { post_id: pid },
      orderBy: { id: "asc" },
    });
  });
};
