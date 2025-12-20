import {
  AnalyzePostRequestDto,
  HugAnalysisResponseDto,
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
   *     description: Llama 3 모델을 사용하여 게시글의 감정을 10가지로 정밀 분석합니다.
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
   *                   - label: "Happy"
   *                     percentage: 80
   *                 analyzedAt: "2023-10-27T10:00:00.000Z"
   */
  analyzeExistingPost: async (req, res) => {
    const request = new AnalyzePostRequestDto(req.params);
    const { signalNoiseResult, emotions } =
      await hugService.processAnalysisForPost(request.postId);

    const responseData = new HugAnalysisResponseDto(
      signalNoiseResult,
      emotions
    );
    return res.success(response.success);
  },
};
