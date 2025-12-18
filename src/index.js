import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { specs } from "../swagger.config.js";
import { handleUserSignUp } from "./controllers/user.controller.js";
import { handleCreatePresignedUrl } from "./controllers/upload.controller.js";
import { handleAddPostPhoto } from "./controllers/photo.controller.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// 미들웨어 설정
app.use(morgan("dev"));
app.use(cors());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Swagger 연결
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// 공통 응답 헬퍼
app.use((req, res, next) => {
  res.success = (success) => {
    return res.json({ resultType: "SUCCESS", error: null, success });
  };
  res.error = ({ errorCode = "unknown", reason = null, data = null }) => {
    return res.json({
      resultType: "FAIL",
      error: { errorCode, reason, data },
      success: null,
    });
  };
  next();
});

// 테스트 라우트
app.get("/", (req, res) => {
  res.send("Hello World! Server is running.");
});
app.post("/api/v1/users/signup", handleUserSignUp);

// dubu 이미지 업로드드
app.post("/api/v1/uploads/presign", handleCreatePresignedUrl);

app.post("/api/v1/posts/:postId/photos", handleAddPostPhoto);


// 서버 실행
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});