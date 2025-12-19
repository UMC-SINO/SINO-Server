import userRepository from "../repositories/auth.repository.js";
import {
  CheckNicknameResponseDto,
  LoginResponseDto,
  UserDto,
} from "../dtos/auth.dto.js";

// 닉네임 유효성: 3~15자, 공백 불가
function isValidNickname(name) {
  if (!name) return false;
  if (name.length < 3 || name.length > 15) return false;
  if (name.trim() !== name) return false; // 앞뒤 공백 방지
  if (/\s/.test(name)) return false; // 중간 공백 포함 전체 공백 방지
  return true;
}

class AuthService {
  async checkNickname(name) {
    // 유효성 검사 실패
    if (!isValidNickname(name)) {
      const error = new Error("3~15자의 공백 없는 이름을 입력해주세요.");
      error.status = 400;
      throw error;
    }

    // 중복 검사
    const exists = await userRepository.existsByName(name);
    if (exists) {
      const error = new Error("이미 사용 중인 이름입니다.");
      error.status = 409;
      throw error;
    }

    // 사용 가능
    return new CheckNicknameResponseDto(true);
  }

  async login(name) {
    const user = await userRepository.findByName(name);
    if (!user) {
      const error = new Error("일치하는 사용자가 없습니다.");
      error.status = 401;
      throw error;
    }

    // JWT 생략, 간단 토큰 문자열만 생성
    const fakeToken = `token_${user.id}_${Date.now()}`;
    return new LoginResponseDto(fakeToken, new UserDto(user));
  }
  async signup(name) {
    try {
      // 유효성 및 중복 검사 로직 재사용
      await this.checkNickname(name);

      // 사용자 생성
      const newUser = await userRepository.create(name);
      return new UserDto(newUser);
    } catch (dbError) {
      if (dbError.code === "P2002") {
        const error = new Error("회원가입 처리 중 이름이 중복되었습니다.");
        error.status = 409;
        throw error;
      }
      throw dbError;
    }
  }
}

const authService = new AuthService();
export default authService;
