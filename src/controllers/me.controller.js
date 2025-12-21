// src/controllers/me.controller.js
import { MeAuthRequiredError } from "../errors/me.error.js";

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: 내 정보 조회 (헤더 로그인 필요)
 *     description: |
 *       헤더 기반 인증으로 현재 로그인된 사용자의 이름을 반환합니다.
 *     parameters:
 *       - in: header
 *         name: x-user-name
 *         required: true
 *         schema:
 *           type: string
 *         description: 로그인한 사용자의 이름 (DB의 name 필드와 일치해야 함)
 *         example: "newuser2"
 *     responses:
 *       200:
 *         description: 성공
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
 *                     name:
 *                       type: string
 *                       example: newuser3
 *
 *       401:
 *         description: 로그인 필요(세션 없음/만료) 또는 인증 실패
 *         content:
 *           application/json:
 *             examples:
 *               notLoggedIn:
 *                 summary: 세션 없음(로그인 필요)
 *                 value:
 *                   resultType: FAIL
 *                   error:
 *                     errorCode: U003
 *                     reason: "로그인이 필요합니다."
 *                     data: null
 *                   success: null
 *               userNotFound:
 *                 summary: 인증 실패(사용자 없음)
 *                 value:
 *                   resultType: FAIL
 *                   error:
 *                     errorCode: U003
 *                     reason: "일치하는 사용자가 없습니다."
 *                     data: null
 *                   success: null
 *
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             example:
 *               resultType: FAIL
 *               error:
 *                 errorCode: COMMON_001
 *                 reason: Internal Server Error
 *                 data: null
 *               success: null
 */
export const getMe = async (req, res, next) => {
  try {
    return res.success({
      name: req.userName,
    });
  } catch (err) {
    return next(err);
  }
};
