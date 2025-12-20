import { AnalyzePostRequestDto } from "../dtos/hug.dto.js";
import { hugService } from "../services/hug.service.js";

/**
 * @swagger
 * tags:
 *   name: Hug
 *   description: AI 감정 분석 및 결과 관리
 */

export const hugController = {
  /**
   * @swagger
   * /api/posts/{postId}/analyze:
   *   post:
   *     summary: 게시글 AI 감정 분석 실행
   *     description: |
   *       특정 게시글의 본문을 읽어 10가지 감정으로 분류하고 Signal/Noise 결과를 저장합니다.
   *       **참고:** 모델이 Sleep 상태일 경우 첫 호출 시 503 에러가 발생할 수 있습니다.
   *     tags:
   *       - Hug
   *     parameters:
   *       - in: path
   *         name: postId
   *         required: true
   *         description: 분석할 게시글의 고유 ID
   *         schema:
   *           type: integer
   *           example: 1
   *     responses:
   *       200:
   *         description: 분석 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 resultType:
   *                   type: string
   *                   example: "SUCCESS"
   *                 success:
   *                   type: object
   *                   properties:
   *                     signalNoiseResult:
   *                       type: string
   *                       enum:
   *                         - Signal
   *                         - Noise
   *                       example: "Signal"
   *                     emotions:
   *                       type: array
   *                       description: "10가지 감정 비율 (합계 100%)"
   *                       items:
   *                         type: object
   *                         properties:
   *                           label:
   *                             type: string
   *                             example: "Happy"
   *                           percentage:
   *                             type: number
   *                             example: 85.5
   *                     analyzedAt:
   *                       type: string
   *                       format: date-time
   *                       example: "2023-10-27T10:00:00.000Z"
   *       400:
   *         description: 잘못된 요청 (H001: 텍스트 부족, H002: 텍스트 초과)
   *         content:
   *           application/json:
   *             example:
   *               resultType: "FAIL"
   *               error:
   *                 errorCode: "H001"
   *                 reason: "분석을 위해 최소 2자 이상의 텍스트를 입력해주세요."
   *       404:
   *         description: 게시글을 찾을 수 없음 (H005)
   *         content:
   *           application/json:
   *             example:
   *               resultType: "FAIL"
   *               error:
   *                 errorCode: "H005"
   *                 reason: "분석을 위한 게시글을 찾을 수 없습니다."
   *       503:
   *         description: 모델 로딩 중 (H003)
   *         content:
   *           application/json:
   *             example:
   *               resultType: "FAIL"
   *               error:
   *                 errorCode: "H003"
   *                 reason: "AI 모델이 준비 중입니다. 잠시 후 다시 시도해주세요."
   */
  analyzeExistingPost: async (req, res) => {
    const request = new AnalyzePostRequestDto(req.params);
    const result = await hugService.processAnalysisForPost(request.postId);
    return res.success(result);
  },
};
