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
   *       400:
   *         description: 텍스트 길이 부족 (H001)
   *         content:
   *           application/json:
   *             example:
   *               resultType: "FAIL"
   *               error:
   *                 errorCode: "H001"
   *                 reason: "분석을 위해 최소 2자 이상의 텍스트를 입력해주세요."
   *                 data: null
   *       404:
   *         description: 게시글 없음 (H005)
   *         content:
   *           application/json:
   *             example:
   *               resultType: "FAIL"
   *               error:
   *                 errorCode: "H005"
   *                 reason: "분석을 위한 게시글을 찾을 수 없습니다."
   *                 data:
   *                   postId: 123
   *       500:
   *         description: AI 분석 서버 오류 (H004)
   *         content:
   *           application/json:
   *             example:
   *               resultType: "FAIL"
   *               error:
   *                 errorCode: "H004"
   *                 reason: "감정 분석 중 서버 오류가 발생했습니다."
   *                 data: null
   *       503:
   *         description: 모델 준비 중 (H003)
   *         content:
   *           application/json:
   *             example:
   *               resultType: "FAIL"
   *               error:
   *                 errorCode: "H003"
   *                 reason: "AI 모델이 준비 중입니다. 잠시 후 다시 시도해주세요."
   *                 data: null
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
   *         description: 분석 결과 없음 (H006) 또는 게시글 없음 (H005)
   *         content:
   *           application/json:
   *               - example:
   *                   resultType: "FAIL"
   *                   error:
   *                     errorCode: "H006"
   *                     reason: "해당 게시글의 분석 결과가 존재하지 않습니다."
   *                     data: null
   *               - example:
   *                   resultType: "FAIL"
   *                   error:
   *                     errorCode: "H005"
   *                     reason: "분석을 위한 게시글을 찾을 수 없습니다."
   *                     data: null
   */
  getAnalysisResult: async (req, res) => {
    const request = new GetAnalysisRequestDto(req.params);
    const analysisData = await hugService.getAnalysisResult(request.postId);

    const responseData = new GetAnalysisResponseDto(analysisData);
    return res.success(responseData);
  },
};
