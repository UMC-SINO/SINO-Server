import { bodyToUserId } from "../dtos/user.dto.js";
import {
  generateYearlyReport,
  generateMonthlyReport,
} from "../services/report.service.js";

export const handleReport = async (req, res, next) => {
  try {
    const year = Number(req.params.year);
    const month = Number(req.params.month);
    const userId = req.body.userId;
    if (req.params.month == undefined ) {
      const result = await generateYearlyReport(userId, year);
      return res.success(result);
    } else {
      const result = await generateMonthlyReport(userId, year, month);
      return res.success(result);
    }
  } catch (error) {
    return next(error);
  }
};
