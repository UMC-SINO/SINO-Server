// errors/post.error.js
class BaseError extends Error {
  constructor(message, status, errorCode, data = null) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
    this.reason = message;
    this.data = data;
  }
}

// 400: 유효하지 않은 postId (P001)
export class InvalidPostIdError extends BaseError {
  constructor(data, message = "유효하지 않은 게시글 ID 입니다.") {
    super(message, 400, "P001", data);
  }
}

// 404: 게시글 없음 (P002)
export class PostNotFoundError extends BaseError {
  constructor(data, message = "일치하는 게시글이 없습니다.") {
    super(message, 404, "P002", data);
  }
}

// 500: 토글 처리 실패 (P003)
export class BookmarkToggleFailedError extends BaseError {
  constructor(data, message = "북마크 토글 처리에 실패했습니다.") {
    super(message, 500, "P003", data);
  }
}

// 400: 이미 삭제된 게시글 (P004)
export class PostAlreadyDeletedError extends BaseError {
  constructor(data, message = "이미 삭제된 게시글입니다.") {
    super(message, 400, "P004", data);
  }
}