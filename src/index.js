// src/index.js
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import session from "express-session";
import { specs } from "../swagger.config.js";
import { handleUserSignUp } from "./controllers/user.controller.js";
import {
  postPhotosUploadMiddleware,
  handleUploadPostPhotos,
} from "./controllers/photo.controller.js";

import { handleGetEmotions } from "./controllers/emotion.controller.js";
import authController from "./controllers/auth.controller.js";
import { getMe } from "./controllers/me.controller.js";
import { createPostUploadMiddleware, handleCreatePost } from "./controllers/postCreate.controller.js";


import {
  handlePostDelete,
  handleBookmarkToggle,
  handleSignalPosts,
  handleNoisePosts,
  handlePost,
  handlePostOneline,
  handlePostEmotion,
} from "./controllers/post.controller.js";
import { handleReport } from "./controllers/report.controller.js";
import { hugController } from "./controllers/hug.controller.js";
import { UserNotFoundError } from "./errors/auth.error.js";
import { hugRepository } from "./repositories/hug.repository.js";
import { handleGetPost } from "./controllers/image.controller.js";
const app = express();
const port = process.env.PORT || 3000;

// 미들웨어 설정
app.use(morgan("dev"));
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1800000,
      sameSite: "lax",
      secure: false,
    },
  })
);

// Swagger 연결
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs));

// 공통 응답 헬퍼 (한 번만!)
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

// 로그인 확인 미들웨어
const isLogin = (req, res, next) => {
  if (req.session && req.session.user) {
    req.userName = req.session.user.name;
    next();
  } else {
    throw new UserNotFoundError(null, "로그인이 필요합니다.");
  }
};

// 비동기 에러 래퍼
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 테스트 라우트
app.get("/", (req, res) => {
  res.send("Hello World! Server is running.");
});

// 라우트 (asyncHandler로 감싸면 컨트롤러에서 next 처리 안 해도 됨)
app.post("/api/v1/users/signup", asyncHandler(handleUserSignUp));
// post 관련 라우트
app.patch("/api/posts/:postId/bookmark", asyncHandler(handleBookmarkToggle)); //
app.delete("/api/posts/:postId", asyncHandler(handlePostDelete)); //
app.get("/api/posts/signal", asyncHandler(handleSignalPosts)); //
app.get("/api/posts/noise", asyncHandler(handleNoisePosts)); //
app.get("/api/posts/:postId", asyncHandler(handlePost)); //
app.post("/api/posts/:postId/oneline", asyncHandler(handlePostOneline)); //
app.patch("/api/posts/:postId/emotion", asyncHandler(handlePostEmotion)); //
app.get("/api/report/:year/:month", asyncHandler(handleReport)); 
app.get("/api/report/:year", asyncHandler(handleReport));

// 회원가입

// photo 4개 올릴 때 사용했던 것것
//app.post(
//  "/api/v1/posts/:postId/photos",
//  postPhotosUploadMiddleware,
//  handleUploadPostPhotos
//);

// auth (dev)
app.post(
  "/api/auth/check-nickname",
  asyncHandler(authController.checkNickname)
);
app.post("/api/auth/login", asyncHandler(authController.login));
app.post("/api/auth/signup", asyncHandler(authController.signup));
app.get("/api/auth/test", isLogin, (req, res) => {
  res.success({ message: `${req.userName}님, 세션 인증에 성공했습니다!` });
});
app.post(
  "/api/posts/:postId/analyze",
  isLogin,
  asyncHandler(hugController.analyzeExistingPost)
);
app.get(
  "/api/posts/:postId/analysis",
  isLogin,
  asyncHandler(hugController.getAnalysisResult)
);
app.get("/api/posts/:postId", isLogin, asyncHandler(handleGetPost));
// 감정 목록 조회 (Issue #7)
app.get("/api/v1/emotions", handleGetEmotions);

// get me
app.get("/api/auth/me", isLogin, asyncHandler(getMe));

// create post
app.post("/api/posts/create", isLogin, createPostUploadMiddleware, asyncHandler(handleCreatePost));

// 
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  const status = err.status || err.statusCode || 500;

  return res.status(status).json({
    resultType: "FAIL",
    error: {
      errorCode: err.errorCode || "COMMON_001",
      reason: err.reason || err.message || "Internal Server Error",
      data: err.data || null,
    },
    success: null,
  });
  
});

// 서버 실행
app.listen(process.env.PORT || 3000, async () => {
  console.log(
    `현재 토큰: ${process.env.GROQ_API_KEY ? "로드 성공" : "로드 실패"}`
  );
  await hugRepository.warmupModel();
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
