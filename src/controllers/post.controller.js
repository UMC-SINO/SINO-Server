// post.controller.js
import { bookmarkToggle, deletePost } from "../services/post.service.js";

/**
 * @swagger
 * tags:
 *   name: Post
 *   description: 게시글(Post) 관련 API
 */

/**
 * @swagger
 * /api/posts/{postId}/bookmark:
 *   patch:
 *     summary: 게시글 북마크 토글
 *     tags:
 *       - Post
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: 북마크를 토글할 게시글 ID
 *     responses:
 *       200:
 *         description: 북마크 토글 성공
 *         content:
 *           application/json:
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 id: 1
 *                 user_id: 1
 *                 year: 2025
 *                 month: 12
 *                 book_mark: true
 *                 title: "오늘의 기록"
 *                 content: "내용..."
 *                 heart: 0
 *                 is_deleted: false
 *                 deleted_at: null
 *                 created_at: "2025-12-19T00:00:00.000Z"
 *       400:
 *         description: 유효하지 않은 게시글 ID (P001)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "P001"
 *                 reason: "유효하지 않은 게시글 ID 입니다."
 *                 data:
 *                   postId: "abc"
 *               success: null
 *       404:
 *         description: 게시글을 찾을 수 없음 (P002)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "P002"
 *                 reason: "일치하는 게시글이 없습니다."
 *                 data:
 *                   postId: 999
 *               success: null
 *       500:
 *         description: 북마크 토글 처리 실패 (P003)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "P003"
 *                 reason: "북마크 토글 처리 중 오류가 발생했습니다."
 *                 data: null
 *               success: null
 */
export const handleBookmarkToggle = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const result = await bookmarkToggle(postId);
    return res.success(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * @swagger
 * /api/posts/{postId}:
 *   delete:
 *     summary: 게시글 삭제 (소프트 삭제)
 *     tags:
 *       - Post
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: 삭제할 게시글 ID
 *     responses:
 *       200:
 *         description: 게시글 삭제 성공
 *         content:
 *           application/json:
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 message: "Post with ID 1 deleted."
 *                 deletedPost:
 *                   id: 1
 *                   user_id: 1
 *                   year: 2025
 *                   month: 12
 *                   book_mark: false
 *                   title: "오늘의 기록"
 *                   content: "내용..."
 *                   heart: 0
 *                   is_deleted: true
 *                   deleted_at: "2025-12-19T00:00:00.000Z"
 *                   created_at: "2025-12-19T00:00:00.000Z"
 *       400:
 *         description: 유효하지 않은 게시글 ID (P001)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "P001"
 *                 reason: "유효하지 않은 게시글 ID 입니다."
 *                 data:
 *                   postId: "abc"
 *               success: null
 *       404:
 *         description: 게시글을 찾을 수 없음 (P002)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "P002"
 *                 reason: "일치하는 게시글이 없습니다."
 *                 data:
 *                   postId: 999
 *               success: null
 *       409:
 *         description: 이미 삭제된 게시글 (P004)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "P004"
 *                 reason: "이미 삭제된 게시글입니다."
 *                 data:
 *                   postId: 1
 *               success: null
 *       500:
 *         description: 게시글 삭제 처리 실패 (P005)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "P005"
 *                 reason: "게시글 삭제 처리 중 오류가 발생했습니다."
 *                 data: null
 *               success: null
 */
export const handlePostDelete = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const result = await deletePost(postId);
    return res.success({
      message: `Post with ID ${postId} deleted.`,
      deletedPost: result,
    });
  } catch (error) {
    return next(error);
  }
};