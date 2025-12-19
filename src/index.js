import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { specs } from "../swagger.config.js";
import { handleUserSignUp } from "./controllers/user.controller.js";
import { handleBookmarkToggle } from "./controllers/post.controller.js";

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

// 비동기 에러 래퍼
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 공통 응답 헬퍼 미들웨어
app.use((req, res, next) => {
  res.success = (success) =>
    res.json({ resultType: "SUCCESS", error: null, success });
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

app.patch("/api/posts/:postId/bookmark", handleBookmarkToggle);

// 전역 에러 처리 미들웨어
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || err.statusCode || 500;

  res.status(status).error({
    errorCode: err.errorCode || "COMMON_001",
    reason: err.reason || err.message || "Internal Server Error",
    data: err.data || null,
  });
});
// 서버 실행
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
