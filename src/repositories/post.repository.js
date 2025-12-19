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