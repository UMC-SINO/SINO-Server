import { bookmarkToggle } from "../services/post.service.js";


export const handleBookmarkToggle = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const result = await bookmarkToggle(postId);
    return res.success(result);
  } catch (error) {
    return res.error({ errorCode: "bookmark_toggle_failed", reason: error.message });
  }
};