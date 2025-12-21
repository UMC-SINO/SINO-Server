// src/controllers/me.controller.js
import { MeAuthRequiredError } from "../errors/me.error.js";

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: 내 정보 조회 (세션 로그인 필요)
 *     description: |
 *       세션 기반 인증으로 현재 로그인된 사용자의 이름을 반환합니다.
 *
 *       - 로그인 성공 시 서버가 `connect.sid`를 발급합니다.
 *       - 이후 요청에 해당 세션이이 포함되어야 합니다.
 *       - Request Body는 없습니다.
 *
 *       ⚠️ Swagger UI에서 401이 뜨는 흔한 이유:
 *       - Swagger UI는 쿠키를 자동으로 실어 보내지 않을 수 있습니다.
 *       - 같은 브라우저 세션에서 먼저 /api/auth/login을 호출해 세션이이 저장되어야 합니다.
 *       - 또는 브라우저 개발자도구에서 connect.sid가 저장됐는지 확인하세요.
 *
 *     security:
 *       - cookieAuth: []
 *
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
    if (!req.session?.user) throw new MeAuthRequiredError();
    return res.success({ name: req.session.user.name });
  } catch (err) {
    return next(err);
  }
};

