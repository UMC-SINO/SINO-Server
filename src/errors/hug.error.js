class BaseError extends Error {
  constructor(message, status, errorCode, data = null) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
    this.reason = message;
    this.data = data;
  }
}

export class InvalidTextError extends BaseError {
  constructor(
    data,
    message = "분석을 위해 최소 2자 이상의 텍스트를 입력해주세요."
  ) {
    super(message, 400, "H001", data);
  }
}

export class ModelLoadingError extends BaseError {
  constructor(
    data,
    message = "AI 모델이 준비 중입니다. 잠시 후 다시 시도해주세요."
  ) {
    super(message, 503, "H003", data);
  }
}

export class AnalysisFailedError extends BaseError {
  constructor(data, message = "감정 분석 중 서버 오류가 발생했습니다.") {
    super(message, 500, "H004", data);
  }
}

export class PostNotFoundError extends BaseError {
  constructor(data, message = "분석을 위한 게시글을 찾을 수 없습니다.") {
    super(message, 404, "H005", data);
  }
}
