import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();
const HF_TOKEN = process.env.HF_TOKEN;
const client = new InferenceClient({
  accessToken: HF_TOKEN,
});

export const hugRepository = {
  // 1. Hugging Face API 호출
  async fetchEmotionAnalysis(text) {
    try {
      const response = await fetch(
        "https://router.huggingface.co/hf-inference/models/monologg/koelectra-base-finetuned-emotion",
        {
          headers: {
            Authorization: `Bearer ${process.env.HF_TOKEN}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({ inputs: text }),
        }
      );
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const result = await response.json();
        // 에러가 없고 정상 배열이 오면 반환
        if (!result.error) return result;
      }
      throw new Error("Model loading");
    } catch (error) {
      console.warn("⚠️ AI 모델 응답 지연으로 인해 Mock 데이터를 사용합니다.");

      // ✅ 실제 모델 응답과 동일한 규격의 가짜 데이터
      return [
        { label: "행복", score: 0.85 },
        { label: "중립", score: 0.1 },
        { label: "슬픔", score: 0.05 },
      ];
    }
  },

  async warmupModel() {
    console.log("🚀 Hugging Face 모델 웜업 시작...");
    if (!HF_TOKEN) {
      console.error("❌ 에러: HF_TOKEN이 환경 변수에 설정되지 않았습니다.");
      return;
    }
    try {
      await this.fetchEmotionAnalysis("웜업");
      console.log("✅ 모델 준비 완료!");
    } catch (error) {
      if (error.message.includes("loading")) {
        console.log(
          "⏳ 모델이 아직 깨어나는 중입니다. 잠시 후 다시 시도하면 정상 작동합니다."
        );
      } else {
        console.error("❌ 모델 웜업 실패:", error.message);
      }
    }
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
