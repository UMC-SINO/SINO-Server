import { bodyToUserId } from "../dtos/user.dto.js";
import {
  generateYearlyReport,
  generateMonthlyReport,
} from "../services/report.service.js";

/**
 * @swagger
 * tags:
 *   - name: Report
 *     description: 기간(연/월) 기준 감정 리포트 생성/조회 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CommonSuccessResponse:
 *       type: object
 *       required: [resultType, error, success]
 *       properties:
 *         resultType:
 *           type: string
 *           example: SUCCESS
 *         error:
 *           nullable: true
 *           example: null
 *         success:
 *           nullable: true
 *
 *     CommonFailResponse:
 *       type: object
 *       required: [resultType, error, success]
 *       properties:
 *         resultType:
 *           type: string
 *           example: FAIL
 *         error:
 *           type: object
 *           required: [errorCode, reason, data]
 *           properties:
 *             errorCode:
 *               type: string
 *               description: 에러 코드 (예: P001, P002, COMMON_001 등)
 *               example: P001
 *             reason:
 *               type: string
 *               description: 에러 사유(메시지)
 *               example: 유효하지 않은 유저 ID 입니다.
 *             data:
 *               nullable: true
 *               description: 디버깅/추적을 위한 추가 데이터
 *               example:
 *                 userId: "abc"
 *         success:
 *           nullable: true
 *           example: null
 *
 *     ReportSuccess:
 *       type: object
 *       description: 연/월 리포트 공통 성공 payload
 *       required: [postIds, emotionCounts, aiEmotionCounts, modifiedEmotionBundles]
 *       properties:
 *         postIds:
 *           type: array
 *           description: 기간 내 게시글 ID 목록
 *           items:
 *             type: integer
 *           example: [101, 102, 103]
 *
 *         emotionCounts:
 *           type: object
 *           description: 사용자가 최종 저장한 감정(emotion 테이블) 카운트 (emotion_name -> count)
 *           additionalProperties:
 *             type: integer
 *           example:
 *             Happy: 3
 *             Sad: 1
 *
 *         aiEmotionCounts:
 *           type: object
 *           description: AI 분석 결과 감정(aiAnalyzedEmotion) 카운트 (emotion_name -> count)
 *           additionalProperties:
 *             type: integer
 *           example:
 *             Happy: 2
 *             Angry: 1
 *
 *         modifiedEmotionBundles:
 *           type: array
 *           description: modified=true인 감정 수정 이력 번들(게시글 단위로 묶음)
 *           items:
 *             type: object
 *             required: [postId, oneLineContents, modifiedTrueEmotions, modifiedFalseEmotions]
 *             properties:
 *               postId:
 *                 type: integer
 *                 example: 108
 *               oneLineContents:
 *                 type: array
 *                 description: 해당 post에 연결된 oneLine 내용들(중복 제거)
 *                 items:
 *                   type: string
 *                 example: ["오늘은 조금 힘들었다", "그래도 했다"]
 *               modifiedTrueEmotions:
 *                 type: array
 *                 description: 사용자가 수정해서 반영한 감정 목록(modified=true)
 *                 items:
 *                   type: string
 *                 example: ["Happy", "Proud"]
 *               modifiedFalseEmotions:
 *                 type: array
 *                 description: 수정되기 전/AI 등으로 들어온 원본 감정 목록(modified=false)
 *                 items:
 *                   type: string
 *                 example: ["Sad"]
 *
 *     ReportRequestBody:
 *       type: object
 *       required: [userId]
 *       properties:
 *         userId:
 *           type: integer
 *           format: int32
 *           description: 조회 대상 유저 ID (현재 구현은 GET body에서 읽음)
 *           example: 1
 */

/**
 * @swagger
 * /api/report/{year}:
 *   post:
 *     tags: [Report]
 *     summary: 연간 리포트 조회
 *     description: |
 *       지정한 연도에 대해 리포트를 생성/조회합니다.
 *
 *       - 기간 범위: `{year}-01-01 00:00:00` 이상 ~ `{year+1}-01-01 00:00:00` 미만
 *       - `emotionCounts`: emotion 테이블 기반 집계
 *       - `aiEmotionCounts`: aiAnalyzedEmotion 기반 집계
 *       - `modifiedEmotionBundles`: modified=true 인 감정 수정 이력(게시글 단위로 oneLine 포함)
 *
 *       ⚠️ 주의: 현재 구현은 **GET 요청 body**에서 `userId`를 읽습니다.
 *       일부 클라이언트/프록시에서 GET body가 누락될 수 있으니,
 *       운영 환경에서는 `userId`를 query로 받도록 변경하는 것을 권장합니다.
 *
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1970
 *           maximum: 2100
 *         description: 조회할 연도
 *         example: 2025
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReportRequestBody'
 *
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/CommonSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     success:
 *                       $ref: '#/components/schemas/ReportSuccess'
 *             examples:
 *               success:
 *                 value:
 *                   resultType: SUCCESS
 *                   error: null
 *                   success:
 *                     postIds: [101, 102, 103]
 *                     emotionCounts: { Happy: 3, Sad: 1 }
 *                     aiEmotionCounts: { Happy: 2, Angry: 1 }
 *                     modifiedEmotionBundles:
 *                       - postId: 108
 *                         oneLineContents: ["오늘은 조금 힘들었다"]
 *                         modifiedTrueEmotions: ["Happy"]
 *                         modifiedFalseEmotions: ["Sad"]
 *       400:
 *         description: 잘못된 요청 (유효하지 않은 userId/파라미터 등)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommonFailResponse'
 *             examples:
 *               invalidUserId:
 *                 value:
 *                   resultType: FAIL
 *                   error:
 *                     errorCode: P001
 *                     reason: 유효하지 않은 유저 ID 입니다.
 *                     data: { userId: "abc" }
 *                   success: null
 *       404:
 *         description: 유저 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommonFailResponse'
 *             examples:
 *               userNotFound:
 *                 value:
 *                   resultType: FAIL
 *                   error:
 *                     errorCode: P002
 *                     reason: 일치하는 유저가 없습니다.
 *                     data: { userId: 9999 }
 *                   success: null
 *       401:
 *         description: 인증 필요(세션 로그인 필요)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommonFailResponse'
 *             examples:
 *               needLogin:
 *                 value:
 *                   resultType: FAIL
 *                   error:
 *                     errorCode: COMMON_001
 *                     reason: 로그인이 필요합니다.
 *                     data: null
 *                   success: null
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommonFailResponse'
 */

/**
 * @swagger
 * /api/report/{year}/{month}:
 *   post:
 *     tags: [Report]
 *     summary: 월간 리포트 조회
 *     description: |
 *       지정한 연/월에 대해 리포트를 생성/조회합니다.
 *
 *       - 기간 범위: `{year}-{month}-01 00:00:00` 이상 ~ 다음달 1일 00:00:00 미만
 *       - month는 1~12
 *
 *       ⚠️ 주의: 현재 구현은 **GET 요청 body**에서 `userId`를 읽습니다.
 *       일부 환경에서 GET body가 누락될 수 있으니 운영 환경에서는 query로 받도록 변경 권장.
 *
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1970
 *           maximum: 2100
 *         description: 조회할 연도
 *         example: 2025
 *
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: 조회할 월(1~12)
 *         example: 12
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReportRequestBody'
 *
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/CommonSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     success:
 *                       $ref: '#/components/schemas/ReportSuccess'
 *       400:
 *         description: 잘못된 요청 (유효하지 않은 userId/파라미터 등)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommonFailResponse'
 *       404:
 *         description: 유저 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommonFailResponse'
 *       401:
 *         description: 인증 필요(세션 로그인 필요)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommonFailResponse'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommonFailResponse'
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
