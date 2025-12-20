import { hugRepository } from "../repositories/hug.repository.js";
import { HugAnalysisResponseDto } from "../dtos/hug.dto.js";
import {
  AnalysisFailedError,
  ModelLoadingError,
  PostNotFoundError,
} from "../errors/hug.error.js";
export const hugService = {
  async processAnalysisForPost(postId) {
    // [STEP 1] DB에서 해당 게시글 본문 가져오기
    const rawPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { content: true },
    });

    if (!rawPost) throw new PostNotFoundError({ postId });

    try {
      // [STEP 2] AI 분석 및 10개 감정 변환
      const rawAiData = await hugRepository.fetchEmotionAnalysis(
        rawPost.content
      );
      const aiEmotions = this.transformToTenEmotions(rawAiData);

      // [STEP 3] Signal/Noise 판별 (긍정 점수 합산 50% 기준)
      const positiveSum = aiEmotions
        .filter((e) => ["Happy", "Joyful", "Smile"].includes(e.label))
        .reduce((sum, e) => sum + e.percentage, 0);

      const signalNoiseResult = positiveSum >= 50 ? "Signal" : "Noise";

      await hugRepository.saveAiAnalysisData({
        postId,
        signalNoiseResult,
        aiEmotions,
      });

      return new HugAnalysisResponseDto(signalNoiseResult, aiEmotions);
    } catch (error) {
      if (error.status === 503) throw new ModelLoadingError();
      throw new AnalysisFailedError({ originalError: error.message });
    }
  },

  // AI 분석 결과 10개 감정 변환 및 정규화 로직
  transformToTenEmotions(rawData) {
    const rawScores = {};
    rawData.forEach((item) => {
      rawScores[item.label] = item.score;
    });

    // 7개 감정 -> 10개 감정 배분 수식
    const extended = {
      Happy: rawScores["행복"] || 0,
      Joyful: rawScores["행복"] * 0.8 || 0,
      Smile: rawScores["중립"] * 0.4 + rawScores["행복"] * 0.2 || 0,
      Boredom: rawScores["중립"] * 0.6 || 0,
      Sad: rawScores["슬픔"] || 0,
      Worried: rawScores["공포"] * 0.5 + rawScores["슬픔"] * 0.3 || 0,
      Angry: rawScores["분노"] || 0,
      Shameful: rawScores["혐오"] * 0.7 + rawScores["슬픔"] * 0.1 || 0,
      Unrest: rawScores["공포"] * 0.5 || 0,
      Afraid: rawScores["공포"] || 0,
    };

    // 정규화: 모든 값을 더한 뒤, 각 값을 합계로 나누어 총합이 정확히 1(100%)이 되게 함
    const totalScore = Object.values(extended).reduce((a, b) => a + b, 0);

    return Object.keys(extended).map((label) => ({
      label,
      percentage:
        totalScore > 0
          ? parseFloat(((extended[label] / totalScore) * 100).toFixed(2))
          : 0,
    }));
  },
};
