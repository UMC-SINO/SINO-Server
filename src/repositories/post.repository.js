import { prisma } from "../db.config.js";

export const toggleBookmark = async (postId) => {
    const post = await prisma.post.findUnique({
        where: { id: postId },
    });
    if (!post) {
        throw new Error("Post not found");
    }  
    const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: { book_mark: !post.book_mark },
    });
    if (!updatedPost) {
        throw new Error("Failed to toggle bookmark");
    }
    return updatedPost;
};