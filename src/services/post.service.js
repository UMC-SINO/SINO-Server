// services/post.service.js
import { findById, updateBookmark, deletePostById } from "../repositories/post.repository.js";
import {
  InvalidPostIdError,
  PostNotFoundError,
  InternalServerError,
  PostAlreadyDeletedError
} from "../errors/post.error.js";

function parsePostId(postId) {
  const n = Number(postId);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

export const bookmarkToggle = async (postId) => {
  const postIdNum = parsePostId(postId);
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
    const postIdNum = parsePostId(postId);
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