import { AnalyzePostRequestDto } from "../dtos/hug.dto.js";
import { hugService } from "../services/hug.service.js";

export const hugController = {
  analyzeExistingPost: async (req, res) => {
    const request = new AnalyzePostRequestDto(req.params);
    const result = await hugService.processAnalysisForPost(request.postId);
    return res.success(result);
  },
};
