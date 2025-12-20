// services/post.service.js
import {
  findById,
  updateBookmark,
  deletePostById,
  getSignalPostByYear,
  getSignalPostByMonth,
  getSignalPostByBookmark,
} from "../repositories/post.repository.js";
import {
  InvalidPostIdError,
  PostNotFoundError,
  InternalServerError,
  PostAlreadyDeletedError,
} from "../errors/post.error.js";
import { UserNotFoundError, InvalidUserIdError } from "../errors/user.error.js";

function parseId(postId) {
  const n = Number(postId);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

export const bookmarkToggle = async (postId) => {
  const postIdNum = parseId(postId);
  if (!postIdNum) {
    throw new InvalidPostIdError({ postId });
  }

  const post = await findById(postIdNum);
  if (!post) {
    throw new PostNotFoundError({ postId: postIdNum });
  }

  try {
    const updatedPost = await updateBookmark(postIdNum, !post.book_mark);
    return updatedPost;
  } catch (error) {
    // Prisma가 update에서 “없음”이면 기본적으로 에러(P2025)를 던지는데,
    // 이 경우도 깔끔하게 404로 바꿔주고 싶으면 아래를 켜면 됨.
    if (error?.code === "P2025") {
      throw new PostNotFoundError({ postId: postIdNum });
    }

    // 기타 DB 장애/권한/연결 문제 등
    throw new InternalServerError(
      { postId: postIdNum, detail: error?.message },
      "북마크 토글 처리 중 오류가 발생했습니다."
    );
  }
};

export const deletePost = async (postId) => {
  const postIdNum = parseId(postId);
  if (!postIdNum) {
    throw new InvalidPostIdError({ postId });
  }

  const post = await findById(postIdNum);
  if (!post) {
    throw new PostNotFoundError({ postId: postIdNum });
  }
  if (post.is_deleted) {
    throw new PostAlreadyDeletedError({ postId: postIdNum });
  }

  try {
    const deletedPost = await deletePostById(postIdNum);
    return deletedPost;
  } catch (error) {
    // Prisma가 update에서 “없음”이면 기본적으로 에러(P2025)를 던지는데,
    // 이 경우도 깔끔하게 404로 바꿔주고 싶으면 아래를 켜면 됨.
    if (error?.code === "P2025") {
      throw new PostNotFoundError({ postId: postIdNum });
    }

    // 기타 DB 장애/권한/연결 문제 등
    throw new InternalServerError(
      { postId: postIdNum, detail: error?.message },
      "북마크 토글 처리 중 오류가 발생했습니다."
    );
  }
};

export const getSignalPost = async (postRequest) => {
  const userId = parseId(postRequest.userId);
  if (!userId) {
    throw new InvalidUserIdError({ userId: postRequest.userId });
  }
  const user = await findById(userId);
  if (!user) {
    throw new UserNotFoundError({ userId: userId });
  }
  const filter = postRequest.filter;
  const y = postRequest.year;
  const m = postRequest.month;
  if (filter === "year" && y != null) {
    const year = parseInt(y, 10);
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);
    const result = await getSignalPostByYear(userId, startDate, endDate);
    return result;
  } else if (filter === "month" && m != null && y != null) {
    const year = parseInt(y, 10); const month = parseInt(m, 10);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    const result = await getSignalPostByMonth(userId, startDate, endDate);
    return result;
  } else if (filter === "bookmark") {
    const result = await getSignalPostByBookmark(userId);
    return result;
  } else {
    throw new InternalServerError(
      { userId: userId, detail: "Invalid filter type" },
      "유효하지 않은 필터 타입입니다."
    );
  }
};

export const getNoisePost = async () => {
  const userId = parseId(postRequest.userId);
  if (!userId) {
    throw new InvalidUserIdError({ userId: postRequest.userId });
  }
  const user = await findById(userId);
  if (!user) {
    throw new UserNotFoundError({ userId: userId });
  }
  const filter = postRequest.filter;
  const filterValue = postRequest.filterValue;
  if (filter === "year" && filterValue != null) {
    const result = await getNoisePostByYear(userId, filterValue);
    return result;
  } else if (filter === "month" && filterValue != null) {
    const result = await getNoisePostByMonth(userId, filterValue);
    return result;
  } else if (filter === "bookmark") {
    const result = await getNoisePostByBookmark(userId);
    return result;
  } else {
    throw new InternalServerError(
      { userId: userId, detail: "Invalid filter type" },
      "유효하지 않은 필터 타입입니다."
    );
  }
  return {};
};
