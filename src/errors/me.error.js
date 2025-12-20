// src/errors/me.error.js
export class MeAuthRequiredError extends Error {
    constructor() {
      super("로그인이 필요합니다.");
      this.name = "MeAuthRequiredError";
      this.status = 401;
      this.errorCode = "AUTH_001";
      this.reason = "로그인이 필요합니다.";
      this.data = null;
    }
  }
  