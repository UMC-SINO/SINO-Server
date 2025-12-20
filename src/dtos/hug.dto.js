export class AnalyzePostRequestDto {
  constructor(params) {
    this.postId = parseInt(params.postId);
  }
}
export class HugAnalysisResponseDto {
  constructor(signalNoise, emotions) {
    this.signalNoiseResult = signalNoise;
    this.emotions = emotions.map((e) => ({
      emotion_name: e.label,
      percentage: e.percentage,
    }));
    this.analyzedAt = new Date().toISOString();
  }
}

export class GetAnalysisRequestDto {
  constructor(params) {
    this.postId = parseInt(params.postId);
  }
}

export class GetAnalysisResponseDto {
  constructor(analysis) {
    this.signalNoiseResult = analysis.signal_noise_result;
    this.emotions = analysis.aiAnalyzedEmotion.map((e) => ({
      emotion_name: e.emotion_name,
      percentage: e.percentage,
    }));
    this.analyzedAt = analysis.created_at;
  }
}
