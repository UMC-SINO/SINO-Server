// src/controllers/postCreate.controller.js
import multer from "multer";
import { createPost } from "../services/postCreate.service.js";

const upload = multer({ storage: multer.memoryStorage() });

// photo 0~1개
export const createPostUploadMiddleware = upload.single("photo");
/**
 * @swagger
 * /api/posts/create:
 *   post:
 *     tags: [Posts]
 *     summary: 게시글 생성 (글 + 사진 0~1개 + 감정 1~5개)
 *     description: |
 *       - 로그인(세션) 필수
 *       - 요청은 **multipart/form-data**
 *       - photo는 **선택(0~1개)** 입니다.
 *       - emotions는 **필수(1~5개)** 이며, **JSON 문자열 배열**로 받습니다.
 *         - 예: "[\"Happy\",\"Worried\"]"
 *       - date는 **필수**이며, 파싱 가능한 DATETIME 문자열이어야 합니다.
 *         - 예: "2025-12-21 00:00:00"
 *       - 생성 흐름:
 *         1) post 생성하여 postId 확보
 *         2) photo가 있으면 S3 업로드 후 post.photo_url 업데이트
 *         3) emotion 테이블에 감정 1~5개 insert
 *
 *     security:
 *       - cookieAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - content
 *               - emotions
 *             properties:
 *               date:
 *                 type: string
 *                 description: |
 *                   게시 날짜 (필수)
 *                   - 파싱 가능한 DATETIME 문자열이어야 합니다.
 *                 example: "2025-12-21 00:00:00"
 *               title:
 *                 type: string
 *                 nullable: true
 *                 description: 게시글 제목 (선택)
 *                 example: "오늘의 일기"
 *               content:
 *                 type: string
 *                 description: 게시글 내용 (필수)
 *                 example: "오늘은 정말 기분이 좋았다."
 *               emotions:
 *                 type: string
 *                 description: |
 *                   감정 배열(JSON 문자열) (필수)
 *                   예: ["Happy","Worried"]
 *                   1~5개여야 합니다.
 *                   중복 불가
 *                   허용 값: Boredom, Worried, Smile, Joyful, Happy, Angry, Shameful, Unrest, Afraid, Sad
 *                 example: "[\"Happy\",\"Worried\"]"
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: 사진 파일 (선택, 0~1개)
 *
 *     responses:
 *       200:
 *         description: 생성 성공
 *         content:
 *           application/json:
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 postId: 2
 *                 photo_url: "https://sino-umc-images-dev.s3.ap-northeast-2.amazonaws.com/posts/2/uuid.png"
 *
 *       401:
 *         description: 로그인 필요(세션 없음)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "AUTH_001"
 *                 reason: "로그인이 필요합니다."
 *                 data: null
 *               success: null
 *
 *       400:
 *         description: 요청값 오류(검증 실패)
 *         content:
 *           application/json:
 *             examples:
 *               POST_008:
 *                 summary: content 누락/형식 오류
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "POST_008"
 *                     reason: "content는 필수입니다."
 *                     data: null
 *                   success: null
 *               POST_009:
 *                 summary: date 누락
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "POST_009"
 *                     reason: "date는 필수입니다."
 *                     data: null
 *                   success: null
 *               POST_010:
 *                 summary: emotions 누락
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "POST_010"
 *                     reason: "emotions는 필수입니다."
 *                     data: null
 *                   success: null
 *               POST_007:
 *                 summary: date 형식 오류(파싱 실패)
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "POST_007"
 *                     reason: "date 형식이 올바르지 않습니다."
 *                     data:
 *                       received: "not-a-date"
 *                   success: null
 *               POST_001:
 *                 summary: emotions JSON 파싱 실패
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "POST_001"
 *                     reason: "emotions는 JSON 배열 문자열이어야 합니다."
 *                     data:
 *                       received: "Happy"
 *                   success: null
 *               POST_002:
 *                 summary: emotions는 배열이어야 함
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "POST_002"
 *                     reason: "emotions는 배열이어야 합니다."
 *                     data:
 *                       receivedType: "string"
 *                   success: null
 *               POST_003:
 *                 summary: emotions 개수 제한(1~5)
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "POST_003"
 *                     reason: "emotions는 1~5개여야 합니다."
 *                     data:
 *                       length: 0
 *                   success: null
 *               POST_004:
 *                 summary: emotions 중복
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "POST_004"
 *                     reason: "emotions에 중복 값이 있습니다."
 *                     data:
 *                       emotions: ["Happy","Happy"]
 *                   success: null
 *               POST_005:
 *                 summary: emotion_name 타입 오류(문자열 아님)
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "POST_005"
 *                     reason: "emotion_name은 문자열이어야 합니다."
 *                     data:
 *                       invalid: 123
 *                   success: null
 *               POST_006:
 *                 summary: 허용되지 않은 emotion_name
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "POST_006"
 *                     reason: "허용되지 않은 emotion_name 입니다."
 *                     data:
 *                       invalid: "Unknown"
 *                       allowed: ["Boredom","Worried","Smile","Joyful","Happy","Angry","Shameful","Unrest","Afraid","Sad"]
 *                   success: null
 *
 *       500:
 *         description: 서버 오류(S3 설정 누락 등)
 *         content:
 *           application/json:
 *             examples:
 *               S3_001:
 *                 summary: S3 환경변수 누락 (photo 업로드 시)
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "S3_001"
 *                     reason: "S3 환경변수가 누락되었습니다."
 *                     data:
 *                       missingKeys: ["AWS_REGION","S3_BUCKET"]
 *                   success: null
 *
 *       502:
 *         description: S3 업로드 실패
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "S3_002"
 *                 reason: "S3 업로드에 실패했습니다."
 *                 data:
 *                   message: "unknown"
 *                   code: null
 *               success: null
 */



export const handleCreatePost = async (req, res) => {

  const userId = req.session?.user?.id;
  if (!userId) {
    return res.status(401).error({
      errorCode: "AUTH_001",
      reason: "로그인이 필요합니다.",
      data: null,
    });
  }

  const { date, title, content, emotions } = req.body ?? {};

  const result = await createPost({
    userId,
    date,
    title,
    content,
    emotionsJson: emotions,
    photoFile: req.file ?? null,
  });

  return res.success({
    postId: result.postId,
    photo_url: result.photo_url ?? null,
  });
};
