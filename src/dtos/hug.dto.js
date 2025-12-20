export class AnalyzePostRequestDto {
  constructor(params) {
    this.postId = parseInt(params.postId);
  }
}

export class HugAnalysisResponseDto {
  constructor(signalNoise, emotions) {
    this.signalNoiseResult = signalNoise;
    this.emotions = emotions;
    this.analyzedAt = new Date().toISOString();
  }
}
