// src/controllers/me.controller.js
import { MeAuthRequiredError } from "../errors/me.error.js";

export const getMe = async (req, res) => {
  try {
    if (!req.session?.user) throw new MeAuthRequiredError();

    return res.status(200).json({
      resultType: "SUCCESS",
      error: null,
      success: { name: req.session.user.name },
    });
  } catch (err) {
    const status = err.status || 500;

    return res.status(status).json({
      resultType: "FAIL",
      error: {
        errorCode: err.errorCode || "COMMON_001",
        reason: err.reason || err.message || "Internal Server Error",
        data: err.data ?? null,
      },
      success: null,
    });
  }
};
