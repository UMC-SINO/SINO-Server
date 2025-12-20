import {
  AnalyzePostRequestDto,
  HugAnalysisResponseDto,
  GetAnalysisResponseDto,
  GetAnalysisRequestDto,
} from "../dtos/hug.dto.js";
import { hugService } from "../services/hug.service.js";

/**
 * @swagger
 * tags:
 *   name: Hug
 *   description: AI 감정 분석 및 결과 관리 (Groq Llama 3.3 기반)
 */
export const hugController = {
  /**
   * @swagger
   * /api/posts/{postId}/analyze:
   *   post:
   *     summary: 게시글 AI 감정 분석 실행
   *     description: Llama 3 모델을 사용하여 10가지 감정(Boredom, Happy 등)의 수치를 분석하고 결과를 DB에 저장합니다.
   *     tags:
   *       - Hug
   *     parameters:
   *       - in: path
   *         name: postId
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: 분석 성공
   *         content:
   *           application/json:
   *             example:
   *               resultType: "SUCCESS"
   *               success:
   *                 signalNoiseResult: "Signal"
   *                 emotions:
   *                   - emotion_name: "Happy"
   *                     percentage: 85
   *                   - emotion_name: "Joyful"
   *                     percentage: 10
   *                 analyzedAt: "2025-12-20T21:30:00.000Z"
   */
  analyzeExistingPost: async (req, res) => {
    const request = new AnalyzePostRequestDto(req.params);
    const { signalNoiseResult, emotions } =
      await hugService.processAnalysisForPost(request.postId);

    const responseData = new HugAnalysisResponseDto(
      signalNoiseResult,
      emotions
    );

    return res.success(responseData);
  },

  /**
   * @swagger
   * /api/posts/{postId}/analysis:
   *   get:
   *     summary: 게시글 AI 감정 분석 결과 조회
   *     description: 이미 완료된 AI 분석 데이터(Signal/Noise 및 10개 감정 수치)를 DB에서 조회합니다.
   *     tags:
   *       - Hug
   *     parameters:
   *       - in: path
   *         name: postId
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: 조회 성공
   *         content:
   *           application/json:
   *             example:
   *               resultType: "SUCCESS"
   *               success:
   *                 signalNoiseResult: "Signal"
   *                 emotions:
   *                   - emotion_name: "Happy"
   *                     percentage: 85
   *                 analyzedAt: "2025-12-20T21:30:00.000Z"
   *       404:
   *         description: 분석 결과 없음 (H006)
   */
  getAnalysisResult: async (req, res) => {
    const request = new GetAnalysisRequestDto(req.params);
    const analysisData = await hugService.getAnalysisResult(request.postId);

    const responseData = new GetAnalysisResponseDto(analysisData);
    return res.success(responseData);
  },
};
