import { bodyToUserId } from "../dtos/user.dto.js";
import {
  generateYearlyReport,
  generateMonthlyReport,
} from "../services/report.service.js";

/**
 * @swagger
 * /api/report/{year}:
 *   post:
 *     summary: 연간 리포트 생성
 *     tags:
 *       - Report
 *     description: |
 *       특정 사용자(userId)의 게시글을 기준으로, 해당 연도 구간의 리포트를 생성합니다.
 *       - 기간: {year}-01-01 00:00:00 ~ {year+1}-01-01 00:00:00 (endDate 미포함)
 *       - 결과: postIds, 감정 집계(emotionCounts), AI 감정 집계(aiEmotionCounts),
 *         사용자가 수정한 감정 번들(modifiedEmotionBundles: oneLine + modified true/false 감정 목록)
 *       - 로그인 세션이 필요합니다. (isLogin 미들웨어)
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           example: 2025
 *         description: 리포트를 생성할 연도
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *                 description: 리포트를 생성할 사용자 ID
 *     responses:
 *       200:
 *         description: 생성 성공
 *         content:
 *           application/json:
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 postIds: [101, 102, 103]
 *                 emotionCounts:
 *                   Happy: 3
 *                   Sad: 1
 *                 aiEmotionCounts:
 *                   Happy: 2
 *                   Angry: 1
 *                 modifiedEmotionBundles:
 *                   - postId: 103
 *                     oneLineContents: ["오늘은 집중이 잘 됐다"]
 *                     modifiedTrueEmotions: ["Happy", "Calm"]
 *                     modifiedFalseEmotions: ["Sad"]
 *       400:
 *         description: 잘못된 요청 - userId 또는 year 형식 오류 (R001)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "R001"
 *                 reason: "유효하지 않은 userId 또는 year 입니다."
 *                 data:
 *                   userId: "abc"
 *                   year: "202X"
 *               success: null
 *       401:
 *         description: 인증 필요 (AUTH_001)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "AUTH_001"
 *                 reason: "로그인이 필요합니다."
 *                 data: null
 *               success: null
 *       404:
 *         description: 사용자 없음 (U001)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "U001"
 *                 reason: "일치하는 사용자가 없습니다."
 *                 data:
 *                   userId: 999
 *               success: null
 *       500:
 *         description: 서버 에러 (R003)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "R003"
 *                 reason: "report 처리 중 오류가 발생했습니다."
 *                 data:
 *                   detail: "Database error"
 *               success: null
 */

/**
 * @swagger
 * /api/report/{year}/{month}:
 *   post:
 *     summary: 월간 리포트 생성
 *     tags:
 *       - Report
 *     description: |
 *       특정 사용자(userId)의 게시글을 기준으로, 해당 연/월 구간의 리포트를 생성합니다.
 *       - 기간: {year}-{month}-01 00:00:00 ~ 다음 달 1일 00:00:00 (endDate 미포함)
 *       - 결과: postIds, 감정 집계(emotionCounts), AI 감정 집계(aiEmotionCounts),
 *         사용자가 수정한 감정 번들(modifiedEmotionBundles: oneLine + modified true/false 감정 목록)
 *       - 로그인 세션이 필요합니다. (isLogin 미들웨어)
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           example: 2025
 *         description: 리포트를 생성할 연도
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           example: 12
 *         description: 리포트를 생성할 월 (1~12)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *                 description: 리포트를 생성할 사용자 ID
 *     responses:
 *       200:
 *         description: 생성 성공
 *         content:
 *           application/json:
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 postIds: [201, 202]
 *                 emotionCounts:
 *                   Happy: 2
 *                 aiEmotionCounts:
 *                   Happy: 1
 *                   Calm: 1
 *                 modifiedEmotionBundles:
 *                   - postId: 202
 *                     oneLineContents: ["일이 많았지만 잘 버텼다"]
 *                     modifiedTrueEmotions: ["Calm"]
 *                     modifiedFalseEmotions: ["Sad"]
 *       400:
 *         description: 잘못된 요청 - userId 또는 year/month 형식 오류 (R001)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "R001"
 *                 reason: "유효하지 않은 userId 또는 year/month 입니다."
 *                 data:
 *                   userId: "abc"
 *                   year: 2025
 *                   month: 99
 *               success: null
 *       401:
 *         description: 인증 필요 (AUTH_001)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "AUTH_001"
 *                 reason: "로그인이 필요합니다."
 *                 data: null
 *               success: null
 *       404:
 *         description: 사용자 없음 (U001)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "U001"
 *                 reason: "일치하는 사용자가 없습니다."
 *                 data:
 *                   userId: 999
 *               success: null
 *       500:
 *         description: 서버 에러 (R003)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "R003"
 *                 reason: "report 처리 중 오류가 발생했습니다."
 *                 data:
 *                   year: 2025
 *                   month: 12
 *                   detail: "Database error"
 *               success: null
 */

export const handleReport = async (req, res, next) => {
  try {
    const year = Number(req.params.year);
    const month = Number(req.params.month);
    const userId = req.body.userId;
    if (req.params.month == undefined ) {
      const result = await generateYearlyReport(userId, year);
      return res.success(result);
    } else {
      const result = await generateMonthlyReport(userId, year, month);
      return res.success(result);
    }
  } catch (error) {
    return next(error);
  }
};
