import { StatusCodes } from "http-status-codes";
import { bodyToUser } from "../dtos/user.dto.js";
import { userSignUp } from "../services/user.service.js";

export const handleUserSignUp = async (req, res) => {
  console.log("회원가입 요청 데이터:", req.body);

  const user = await userSignUp(bodyToUser(req.body));

  return res.status(StatusCodes.OK).success(user);
};
