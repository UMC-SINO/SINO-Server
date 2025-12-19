// 기본 에러 클래스
class BaseError extends Error {
  constructor(message, status, errorCode, data = null) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
    this.reason = message; // 응답 형식
    this.data = data;
  }
}

// 400: 유효하지 않은 입력 (U001)
export class InvalidNicknameError extends BaseError {
  constructor(data, message = "3~15자의 공백 없는 이름을 입력해주세요.") {
    super(message, 400, "U001", data);
  }
}

// 409: 중복된 닉네임 (U002)
export class DuplicateNicknameError extends BaseError {
  constructor(data, message = "이미 사용 중인 이름입니다.") {
    super(message, 409, "U002", data);
  }
}

// 401: 인증 실패 (U003)
export class UserNotFoundError extends BaseError {
  constructor(data, message = "일치하는 사용자가 없습니다.") {
    super(message, 401, "U003", data);
  }
}
