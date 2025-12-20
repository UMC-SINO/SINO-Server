// src/errors/postUpdate.error.js

export class PostUpdateValidationError extends Error {
    constructor(data, reason = "요청값이 올바르지 않습니다.") {
      super(reason);
      this.status = 400;
      this.errorCode = "POST_UPDATE_001";
      this.reason = reason;
      this.data = data ?? null;
    }
  }
  
  export class PostNotFoundError extends Error {
    constructor(postId) {
      super("게시글을 찾을 수 없습니다.");
      this.status = 404;
      this.errorCode = "POST_404";
      this.reason = "게시글을 찾을 수 없습니다.";
      this.data = { postId };
    }
  }
  
  export class PostForbiddenError extends Error {
    constructor(postId) {
      super("권한이 없습니다.");
      this.status = 403;
      this.errorCode = "POST_403";
      this.reason = "해당 게시글을 수정할 권한이 없습니다.";
      this.data = { postId };
    }
  }
  
  export class S3UploadFailedError extends Error {
    constructor(message = "S3 업로드에 실패했습니다.", data = null) {
      super(message);
      this.status = 500;
      this.errorCode = "S3_UPLOAD_FAILED";
      this.reason = message;
      this.data = data ?? null;
    }
  }
  