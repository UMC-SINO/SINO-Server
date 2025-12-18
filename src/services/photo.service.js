import { prisma } from "../db.config.js";

export const addPostPhoto = async ({ postId, url, uploadOrder }) => {
  if (uploadOrder < 1 || uploadOrder > 4) {
    throw new Error("upload_order는 1~4만 가능합니다.");
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error("존재하지 않는 postId 입니다.");

  // (post_id, upload_order) 유니크가 걸려있다는 전제
  await prisma.photo.upsert({
    where: {
      post_id_upload_order: { post_id: postId, upload_order: uploadOrder },
    },
    update: { url, is_picked: false },
    create: { post_id: postId, url, upload_order: uploadOrder, is_picked: false },
  });

  const photos = await prisma.photo.findMany({
    where: { post_id: postId },
    orderBy: { upload_order: "asc" },
  });

  return { postId, photos };
};
