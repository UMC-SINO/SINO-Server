import { toggleBookmark } from "../repositories/post.repository.js";


export const bookmarkToggle = async (postId) => {
    const postIdNum = Number(postId);
    const updatedPost = await toggleBookmark(postIdNum);
    
    return updatedPost;
};