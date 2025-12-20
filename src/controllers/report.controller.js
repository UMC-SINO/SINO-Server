import { bodyToUserId } from "../dtos/user.dto.js";
import { generateYearlyReport, generateMonthlyReport } from "../services/report.service.js";

export const handleReportYearly = async (req, res, next) => {
  try {
    const year = Number(req.params.year);
    const userId = bodyToUserId(req.body.userId);
    const result = await generateYearlyReport(userId, year);
    return res.success(result);
  } catch (error) {
    return next(error);
  }
};

export const handleReportMonthly = async (req, res, next) => {  
    try {   
    const year = Number(req.params.year);
    const month = Number(req.params.month);
    const userId = bodyToUserId(req.body.userId);
    const result = await generateMonthlyReport(userId, year, month);
    return res.success(result);
  } catch (error) {
    return next(error);
  }
};