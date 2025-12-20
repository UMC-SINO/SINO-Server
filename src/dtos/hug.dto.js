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
