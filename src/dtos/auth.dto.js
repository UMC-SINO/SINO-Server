// CheckNickname
class CheckNicknameRequestDto {
  constructor(body) {
    this.name = body.name;
  }
}
class CheckNicknameResponseDto {
  constructor(available) {
    this.available = available;
  }
}

// Login
class LoginRequestDto {
  constructor(body) {
    this.name = body.name;
  }
}
class SessionUserDto {
  constructor(user) {
    this.id = user.id;
    this.name = user.name;
  }
}
// Signup
class SignupRequestDto {
  constructor(body) {
    this.name = body.name;
  }
}

// 공용 User DTO
class UserDto {
  constructor(user) {
    this.id = user.id;
    this.name = user.name;
  }
}

export {
  CheckNicknameRequestDto,
  CheckNicknameResponseDto,
  LoginRequestDto,
  SignupRequestDto,
  SessionUserDto,
  UserDto,
};
