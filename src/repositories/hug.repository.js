import Groq from "groq-sdk";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const hugRepository = {
  async fetchEmotionAnalysis(text) {
    const completion = await groq.chat.completions.create({
      // Llama 3 모델 사용 (매우 영리함)
      messages: [
        {
          role: "system",
          content: `당신은 감정 분석 전문가입니다. 입력된 한국어 텍스트를 분석하여 아래 10가지 감정의 비율을 합산 100이 되도록 정수로 반환하세요.
          오직 JSON 형식으로만 응답하세요.
          감정 목록: Boredom, Worried, Smile, Joyful, Happy, Angry, Shameful, Unrest, Afraid, Sad
          응답 형식: {"emotions": [{"label": "Happy", "percentage": 85}, {"label": "Sad", "percentage": 5}, ...]}`,
        },
        { role: "user", content: text },
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return result.emotions;
  },

  async warmupModel() {
    console.log("🚀 Groq API 연결 확인 중...");
    try {
      if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY가 .env 파일에 없습니다.");
      }
      await this.fetchEmotionAnalysis("테스트");
      console.log("✅ Groq 연결 및 분석 준비 완료!");
    } catch (error) {
      console.error("❌ Groq 연결 실패:", error.message);
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
