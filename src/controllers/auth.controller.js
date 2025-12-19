// auth.controller.js
import authService from "../services/auth.service.js";
import {
  CheckNicknameRequestDto,
  LoginRequestDto,
  SignupRequestDto,
} from "../dtos/auth.dto.js";

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: 인증 및 회원가입 관리
 */
class AuthController {
  /**
   * @swagger
   * /api/auth/check-nickname:
   *   post:
   *     summary: 닉네임 중복 및 유효성 확인
   *     tags:
   *       - Auth
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 example: "testuser"
   *     responses:
   *       200:
   *         description: 사용 가능한 닉네임
   *       400:
   *         description: 유효하지 않은 형식 (길이, 공백 등)
   *       409:
   *         description: 이미 존재하는 닉네임
   */
  checkNickname = async (req, res) => {
    try {
      const dto = new CheckNicknameRequestDto(req.body);
      const result = await authService.checkNickname(dto.name);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  };

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: 이름으로 로그인
   *     tags:
   *       - Auth
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 example: "testuser"
   *     responses:
   *       200:
   *         description: 로그인 성공
   *       401:
   *         description: 등록되지 않은 사용자
   */
  login = async (req, res) => {
    try {
      const dto = new LoginRequestDto(req.body);
      const result = await authService.login(dto.name);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(err.status || 401).json({ message: err.message });
    }
  };

  /**
   * @swagger
   * /api/auth/signup:
   *   post:
   *     summary: 회원가입
   *     tags:
   *       - Auth
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 example: "newuser123"
   *     responses:
   *       201:
   *         description: 회원가입 성공
   *       400:
   *         description: 유효하지 않은 형식
   *       409:
   *         description: 이미 존재하는 이름
   */
  signup = async (req, res) => {
    try {
      const dto = new SignupRequestDto(req.body);
      const userDto = await authService.signup(dto.name);
      return res.status(201).json(userDto);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ message: err.message });
    }
  };
}

const authController = new AuthController();
export default authController;
