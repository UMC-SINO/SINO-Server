// src/errors/postCreate.error.js

export class PostCreateValidationError extends Error {
    constructor({ errorCode, reason, data = null, status = 400 }) {
      super(reason);
      this.status = status;
      this.errorCode = errorCode;
      this.reason = reason;
      this.data = data;
    }
  }
  
  export class S3ConfigMissingError extends Error {
    constructor(missingKeys) {
      super("S3 환경변수가 누락되었습니다.");
      this.status = 500;
      this.errorCode = "S3_001";
      this.reason = "S3 환경변수가 누락되었습니다.";
      this.data = { missingKeys };
    }
  }
  
  export class S3UploadFailedError extends Error {
    constructor(message = "S3 업로드에 실패했습니다.", data = null) {
      super(message);
      this.status = 502;
      this.errorCode = "S3_002";
      this.reason = message;
      this.data = data;
    }
  }
  