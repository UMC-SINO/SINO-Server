import { StatusCodes } from "http-status-codes";
import { bodyToUser } from "../dtos/user.dto.js";
import { userSignUp } from "../services/user.service.js";

export const handleUserSignUp = async (req, res) => {
  console.log("회원가입 요청 데이터:", req.body);

  const user = await userSignUp(bodyToUser(req.body));

  return res.status(StatusCodes.OK).success(user);
};

/**
 * @swagger
 * /api/v1/users/signup:
 *   post:
 *     summary: 회원가입 API
 *     tags: [Users]
 *     description: 사용자 정보를 받아 새로운 사용자를 생성합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - gender
 *               - birth
 *               - address
 *               - phoneNumber
 *             properties:
 *               email:
 *                 type: string
 *                 example: "test@example.com"
 *                 description: 사용자 이메일
 *               name:
 *                 type: string
 *                 example: "홍길동"
 *                 description: 사용자 이름
 *               gender:
 *                 type: string
 *                 example: "male"
 *                 description: 성별
 *               birth:
 *                 type: string
 *                 format: date
 *                 example: "2000-01-01"
 *                 description: 생년월일
 *               address:
 *                 type: string
 *                 example: "서울시 강남구"
 *                 description: 주소
 *               detailAddress:
 *                 type: string
 *                 example: "101호"
 *                 description: 상세 주소
 *               phoneNumber:
 *                 type: string
 *                 example: "010-1234-5678"
 *                 description: 전화번호
 *               preferences:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *                 description: 선호 음식 카테고리 ID 목록
 *     responses:
 *       200:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultType:
 *                   type: string
 *                   example: "SUCCESS"
 *                 success:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 */
