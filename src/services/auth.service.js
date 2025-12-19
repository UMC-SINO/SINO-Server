import userRepository from "../repositories/auth.repository.js";
import { CheckNicknameResponseDto, UserDto } from "../dtos/auth.dto.js";
import {
  InvalidNicknameError,
  DuplicateNicknameError,
  UserNotFoundError,
} from "../errors/auth.error.js";

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
      throw new InvalidNicknameError();
    }

    // 중복 검사
    const exists = await userRepository.existsByName(name);
    if (exists) {
      throw new DuplicateNicknameError();
    }

    // 사용 가능
    return new CheckNicknameResponseDto(true);
  }

  async login(name) {
    const user = await userRepository.findByName(name);
    if (!user) {
      throw new UserNotFoundError();
    }
    return new UserDto(user);
  }
  async signup(name) {
    try {
      // 유효성 및 중복 검사 로직 재사용
      await this.checkNickname(name);

      // 사용자 생성
      const newUser = await userRepository.create(name);
      return new UserDto(newUser);
    } catch (error) {
      if (error.code === "P2002") {
        throw new DuplicateNicknameError(
          "회원가입 처리 중 이름이 중복되었습니다."
        );
      }
      throw error;
    }
  }
}

const authService = new AuthService();
export default authService;
