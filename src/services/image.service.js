import { prisma } from "../db.config.js";
import { PostNotFoundError } from "../errors/post.error.js";
export const getPostDetail = async (postId) => {
  const post = await prisma.post.findUnique({
    where: {
      id: postId,
      is_deleted: false,
    },
    select: {
      id: true,
      content: true,
      photo_url: true,
    },
  });

  if (!post) {
    throw new PostNotFoundError();
  }

  return post;
};
