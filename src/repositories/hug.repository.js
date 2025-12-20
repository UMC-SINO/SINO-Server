import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();
const client = new InferenceClient(process.env.HF_TOKEN);
export const warmupModel = async () => {
  console.log("🚀 Hugging Face 모델 웜업 시작...");
  try {
    const response = await hugRepository.fetchEmotionAnalysis("웜업");
    console.log(
      "✅ 모델 준비 완료! 현재 상태:",
      response ? "정상" : "응답없음"
    );
  } catch (error) {
    if (error.status === 503) {
      console.log(
        "⏳ 모델이 현재 로딩 중입니다(503). 약 20초 후 자동으로 준비됩니다."
      );
    } else {
      console.error("❌ 모델 웜업 중 예상치 못한 에러 발생:", error.message);
    }
  }
};
export const hugRepository = {
  // 1. Hugging Face API 호출
  async fetchEmotionAnalysis(text) {
    return await client.textClassification({
      model: "matthew-ko/korean-emotion-classification",
      inputs: text,
    });
  },

  // 2. 모든 분석 데이터 DB 저장 (Prisma 트랜잭션)
  async saveAiAnalysisData({ postId, signalNoiseResult, aiEmotions }) {
    return await prisma.$transaction(async (tx) => {
      const analysis = await tx.aiAnalysis.create({
        data: {
          post_id: postId,
          signal_noise_result: signalNoiseResult,
        },
      });

      const aiEmotionData = aiEmotions.map((e) => ({
        analysis_id: analysis.id,
        emotion_id: getEmotionId(e.label),
        percentage: e.percentage,
      }));

      await tx.aiAnalyzedEmotion.createMany({ data: aiEmotionData });
      return analysis.id;
    });
  },
};

// 감정 이름을 DB의 고유 ID로 변환하는 함수
const getEmotionId = (label) => {
  const map = {
    Boredom: 1,
    Worried: 2,
    Smile: 3,
    Joyful: 4,
    Happy: 5,
    Angry: 6,
    Shameful: 7,
    Unrest: 8,
    Afraid: 9,
    Sad: 10,
  };
  return map[label];
};
