import { hugRepository } from "../repositories/hug.repository.js";
import { AnalysisFailedError, PostNotFoundError } from "../errors/hug.error.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const hugService = {
  async processAnalysisForPost(postId) {
    // [STEP 1] DB에서 해당 게시글 본문 가져오기
    const rawPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { content: true },
    });

    if (!rawPost) throw new PostNotFoundError({ postId });

    try {
      // [STEP 2] Groq AI 분석 (이미 10개 감정 배열로 반환됨)
      const aiEmotions = await hugRepository.fetchEmotionAnalysis(
        rawPost.content
      );

      // [STEP 3] Signal/Noise 판별 (긍정 라벨 합산)
      const positiveSum = aiEmotions
        .filter((e) => ["Happy", "Joyful", "Smile"].includes(e.label))
        .reduce((sum, e) => sum + e.percentage, 0);

      const signalNoiseResult = positiveSum >= 50 ? "Signal" : "Noise";
      // [STEP 4] DB 저장
      await hugRepository.saveAiAnalysisData({
        postId,
        signalNoiseResult,
        aiEmotions,
      });

      // [STEP 5] DTO 형식에 맞춰 결과 반환
      return {
        signalNoiseResult,
        emotions: aiEmotions,
      };
    } catch (error) {
      console.error("Service Error:", error);
      throw new AnalysisFailedError({ originalError: error.message });
    }
  },
};
