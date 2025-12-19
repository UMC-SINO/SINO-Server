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
   *         description: 유효하지 않은 형식 (U001)
   *         content:
   *           application/json:
   *             example:
   *               resultType: "FAIL"
   *               error:
   *                 errorCode: "U001"
   *                 reason: "3~15자의 공백 없는 이름을 입력해주세요."
   *                 data: null
   *       409:
   *         description: 이미 존재하는 닉네임 (U002)
   *         content:
   *           application/json:
   *             example:
   *               resultType: "FAIL"
   *               error:
   *                 errorCode: "U002"
   *                 reason: "이미 사용 중인 이름입니다."
   *                 data: null
   */
  checkNickname = async (req, res) => {
    const dto = new CheckNicknameRequestDto(req.body);
    const result = await authService.checkNickname(dto.name);
    return res.success(result);
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
   *         description: 등록되지 않은 사용자 (U003)
   *         content:
   *           application/json:
   *             example:
   *               resultType: "FAIL"
   *               error:
   *                 errorCode: "U003"
   *                 reason: "일치하는 사용자가 없습니다."
   *                 data: null
   */
  login = async (req, res) => {
    const dto = new LoginRequestDto(req.body);
    const result = await authService.login(dto.name);
    return res.success(result);
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
   *         description: 유효하지 않은 형식 (U001)
   *         content:
   *           application/json:
   *             example:
   *               resultType: "FAIL"
   *               error:
   *                 errorCode: "U001"
   *                 reason: "3~15자의 공백 없는 이름을 입력해주세요."
   *                 data: null
   *       409:
   *         description: 이미 존재하는 이름 (U002)
   *         content:
   *           application/json:
   *             example:
   *               resultType: "FAIL"
   *               error:
   *                 errorCode: "U002"
   *                 reason: "이미 사용 중인 이름입니다."
   *                 data:
   *                   requestedName: "newuser123"
   */
  signup = async (req, res) => {
    const dto = new SignupRequestDto(req.body);
    const userDto = await authService.signup(dto.name);
    return res.status(201).success(userDto);
  };
}

const authController = new AuthController();
export default authController;
