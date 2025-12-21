import { bodyToUserId } from "../dtos/user.dto.js";
import {
  generateYearlyReport,
  generateMonthlyReport,
} from "../services/report.service.js";

/**
 * @swagger
 * /api/report/{year}:
 *   get:
 *     summary: 연간 리포트 생성
 *     tags:
 *       - Report
 *     description: |
 *       특정 유저의 연간 감정/AI감정 통계 및 수정된 감정(oneLine 묶음) 정보를 생성합니다.
 *       - 기간: {year}-01-01 00:00:00 ~ {year+1}-01-01 00:00:00 (endDate 미포함)
 *       - 세션 로그인이 필요합니다. (isLogin)
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           example: 2025
 *         description: 조회할 연도
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 리포트 생성 성공
 *         content:
 *           application/json:
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 postIds: [101, 102, 103]
 *                 emotionCounts:
 *                   Boredom: 1
 *                   Worried: 0
 *                   Smile: 2
 *                   Joyful: 0
 *                   Happy: 3
 *                   Angry: 0
 *                   Shameful: 0
 *                   Unrest: 0
 *                   Afraid: 0
 *                   Sad: 1
 *                 emotionPercentages:
 *                   Boredom: 14.29
 *                   Worried: 0
 *                   Smile: 28.57
 *                   Joyful: 0
 *                   Happy: 42.86
 *                   Angry: 0
 *                   Shameful: 0
 *                   Unrest: 0
 *                   Afraid: 0
 *                   Sad: 14.29
 *                 aiEmotionPercentages:
 *                   Boredom: 0
 *                   Worried: 0
 *                   Smile: 0
 *                   Joyful: 0
 *                   Happy: 60
 *                   Angry: 0
 *                   Shameful: 0
 *                   Unrest: 0
 *                   Afraid: 0
 *                   Sad: 40
 *                 modifiedEmotionBundles:
 *                   - postId: 108
 *                     oneLineContents: ["한 줄 기록 A", "한 줄 기록 B"]
 *                     modifiedTrueEmotions: ["Happy", "Smile"]
 *       400:
 *         description: 요청 파라미터 오류 (AUTH_002 등)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "AUTH_002"
 *                 reason: "유효하지 않은 유저 ID 입니다."
 *                 data:
 *                   userId: null
 *               success: null
 *       401:
 *         description: 로그인 필요 (AUTH_001)
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
 *         description: 사용자를 찾을 수 없음 (AUTH_003 등)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "AUTH_003"
 *                 reason: "일치하는 유저가 없습니다."
 *                 data:
 *                   userId: 999
 *               success: null
 *       500:
 *         description: 서버 내부 에러
 *         content:
 *           application/json:
 *             examples:
 *               dbError:
 *                 summary: 기타 서버/DB 에러
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "COMMON_001"
 *                     reason: "Internal Server Error"
 *                     data:
 *                       detail: "Database connection timeout"
 *                   success: null
 */

/**
 * @swagger
 * /api/report/{year}/{month}:
 *   get:
 *     summary: 월간 리포트 생성
 *     tags:
 *       - Report
 *     description: |
 *       특정 유저의 월간 감정/AI감정 통계 및 수정된 감정(oneLine 묶음) 정보를 생성합니다.
 *       - 기간: {year}-{month}-01 00:00:00 ~ 다음달 1일 00:00:00 (endDate 미포함)
 *       - 세션 로그인이 필요합니다. (isLogin)
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           example: 2025
 *         description: 조회할 연도
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           example: 12
 *         description: 조회할 월 (1~12)
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 리포트 생성 성공
 *         content:
 *           application/json:
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 postIds: [106, 107, 108]
 *                 emotionCounts:
 *                   Boredom: 0
 *                   Worried: 1
 *                   Smile: 1
 *                   Joyful: 0
 *                   Happy: 2
 *                   Angry: 0
 *                   Shameful: 0
 *                   Unrest: 0
 *                   Afraid: 0
 *                   Sad: 0
 *                 emotionPercentages:
 *                   Boredom: 0
 *                   Worried: 25
 *                   Smile: 25
 *                   Joyful: 0
 *                   Happy: 50
 *                   Angry: 0
 *                   Shameful: 0
 *                   Unrest: 0
 *                   Afraid: 0
 *                   Sad: 0
 *                 aiEmotionPercentages:
 *                   Boredom: 0
 *                   Worried: 0
 *                   Smile: 0
 *                   Joyful: 0
 *                   Happy: 100
 *                   Angry: 0
 *                   Shameful: 0
 *                   Unrest: 0
 *                   Afraid: 0
 *                   Sad: 0
 *                 modifiedEmotionBundles:
 *                   - postId: 107
 *                     oneLineContents: ["12월에 수정한 한 줄"]
 *                     modifiedTrueEmotions: ["Worried"]
 *       400:
 *         description: 요청 파라미터 오류 (AUTH_002 등)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "AUTH_002"
 *                 reason: "유효하지 않은 유저 ID 입니다."
 *                 data:
 *                   userId: "abc"
 *               success: null
 *       401:
 *         description: 로그인 필요 (AUTH_001)
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
 *         description: 사용자를 찾을 수 없음 (AUTH_003 등)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "AUTH_003"
 *                 reason: "일치하는 유저가 없습니다."
 *                 data:
 *                   userId: 999
 *               success: null
 *       500:
 *         description: 서버 내부 에러
 *         content:
 *           application/json:
 *             examples:
 *               dbError:
 *                 summary: 기타 서버/DB 에러
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "COMMON_001"
 *                     reason: "Internal Server Error"
 *                     data:
 *                       detail: "Database connection timeout"
 *                   success: null
 */

export const handleReport = async (req, res, next) => {
  try {
    const year = Number(req.params.year);
    const month = Number(req.params.month);
    const userId = req.query.userId;
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
