import { StatusCodes } from "http-status-codes";
import { getPostDetail } from "../services/image.service.js";
import { InvalidPostIdError } from "../errors/post.error.js";
/**
 * @swagger
 * /api/posts/{postId}/image-content:
 *   get:
 *     summary: 게시글 상세 조회 (글 + 사진)
 *     tags:
 *       - Posts
 *     description: |
 *       특정 postId에 해당하는 게시글의 텍스트 내용과 업로드된 사진 URL을 조회합니다.
 *       확인 페이지(작성 후 페이지)에서 사용됩니다.
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 조회할 게시글 ID
 *         example: 1
 *       - in: header
 *         name: x-user-name
 *         required: true
 *         schema:
 *           type: string
 *         description: 로그인한 사용자의 이름 (DB의 name 필드와 일치해야 함)
 *         example: "newuser2"
 *     responses:
 *       200:
 *         description: 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: SUCCESS
 *                 error:
 *                   nullable: true
 *                   example: null
 *                 success:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     content:
 *                       type: string
 *                       example: "오늘 날씨가 정말 좋았어요."
 *                     imageUrl:
 *                       type: string
 *                       nullable: true
 *                       example: "https://my-bucket.s3.region.amazonaws.com/posts/1/uuid.jpg"
 *       400:
 *         description: 잘못된 요청 (유효하지 않은 postId 형식)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: FAIL
 *                 error:
 *                   type: object
 *                   properties:
 *                     errorCode:
 *                       type: string
 *                       example: P001
 *                     reason:
 *                       type: string
 *                       example: "유효하지 않은 게시글 ID 입니다."
 *                     data:
 *                       type: object
 *                       properties:
 *                         received:
 *                           type: string
 *                           example: "abc"
 *                 success:
 *                   nullable: true
 *                   example: null
 *       404:
 *         description: 게시글을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: FAIL
 *                 error:
 *                   type: object
 *                   properties:
 *                     errorCode:
 *                       type: string
 *                       example: P002
 *                     reason:
 *                       type: string
 *                       example: "일치하는 게시글이 없습니다."
 *                     data:
 *                       nullable: true
 *                       example: null
 *                 success:
 *                   nullable: true
 *                   example: null
 */

export const handleGetPost = async (req, res) => {
  const postId = Number(req.params.postId);
  if (isNaN(postId) || postId <= 0) {
    throw new InvalidPostIdError({ received: req.params.postId });
  }

  const post = await getPostDetail(postId);

  return res.status(StatusCodes.OK).success({
    id: post.id,
    content: post.content,
    imageUrl: post.photo_url,
  });
};
