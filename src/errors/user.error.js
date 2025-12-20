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

// 400: 유효하지 않은 userId (P001)
export class InvalidUserIdError extends BaseError {
  constructor(data, message = "유효하지 않은 유저 ID 입니다.") {
    super(message, 400, "P001", data);
  }
}

// 404: user 없음 (P002)
export class UserNotFoundError extends BaseError {
  constructor(data, message = "일치하는 유저가 없습니다.") {
    super(message, 404, "P002", data);
  }
}