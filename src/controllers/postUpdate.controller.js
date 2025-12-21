// src/controllers/postUpdate.controller.js
import multer from "multer";
import { updatePostWithOptionalPhotoAndEmotions } from "../services/postUpdate.service.js";
import {
  PostUpdateValidationError,
  PostNotFoundError,
} from "../errors/postUpdate.error.js";

// 메모리에 파일 올려서 바로 S3로 업로드(디스크 저장 X)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, 
});

// photo: 0~1개
export const updatePostUploadMiddleware = upload.single("photo");

/**
 * @swagger
 * /api/posts/{postId}:
 *   patch:
 *     tags: [Posts]
 *     summary: 게시글 수정 (선택 필드 + 사진 0~1개 + 감정 전체교체)
 *     description: |
 *       - 로그인(세션) 필수
 *       - 요청은 **multipart/form-data**
 *       - **키를 아예 보내지 않으면 해당 값은 "미변경"**
 *       - emotions를 보내면 해당 post의 감정은 **전체 교체**
 *         - emotions 생략: 감정 미변경
 *         - emotions = "[]": 감정 전체 삭제
 *         - emotions = ""(빈 문자열) 또는 "null": 감정 전체 삭제(서비스 정책)
 *       - photo 파일이 오면 새 사진 업로드 후 교체(S3 업로드)
 *       - removePhoto=true(또는 1)이면 기존 사진 제거(+ 기존 S3 파일 삭제 best-effort)
 *       - ⚠️ removePhoto와 photo가 동시에 오면, 현재 서비스는 removePhoto를 우선 처리합니다.
 *
 *     security:
 *       - cookieAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *           example: 3
 *         description: 수정할 게시글 ID
 *
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 nullable: true
 *                 description: |
 *                   제목(선택)
 *                   - 키 생략: 미변경
 *                   - ""(빈 문자열) 또는 "null": null로 저장(제목 제거)
 *                   - 일반 문자열: 해당 값으로 변경
 *                 example: "수정 제목"
 *               content:
 *                 type: string
 *                 description: |
 *                   내용(선택)
 *                   - 키 생략: 미변경
 *                   - ""(빈 문자열): 빈 내용으로 변경(허용 여부는 정책에 따름)
 *                   - "null": 서비스에서 오류 처리(POST_UPDATE_001)
 *                 example: "수정 내용"
 *               date:
 *                 type: string
 *                 nullable: true
 *                 description: |
 *                   날짜(선택)
 *                   - 키 생략: 미변경
 *                   - ""(빈 문자열) 또는 "null": null로 저장
 *                   - 파싱 가능한 DATETIME 문자열이어야 합니다.
 *                 example: "2025-12-21 00:00:00"
 *               emotions:
 *                 type: string
 *                 description: |
 *                   감정 배열(JSON 문자열) (선택)
 *                   - 키 생략: 미변경
 *                   - "[]": 감정 전체 삭제
 *                   - ""(빈 문자열) 또는 "null": 감정 전체 삭제
 *                   - 예: "[\\"Happy\\",\\"Worried\\"]"
 *                   - 최대 5개 (중복은 제거됨)
 *                   - 허용 값: Boredom, Worried, Smile, Joyful, Happy, Angry, Shameful, Unrest, Afraid, Sad
 *                 default: '"[\"Happy\",\"Sad\"]"'
 *               removePhoto:
 *                 type: string
 *                 description: |
 *                   사진 삭제 플래그(선택)
 *                   - true/false 또는 1/0
 *                   - true(또는 1)이면 photo_url을 null로 설정합니다.
 *                 example: "true"
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: 새 사진 파일(선택, 0~1개)
 *
 *     responses:
 *       200:
 *         description: 수정 성공(아무 것도 안 바꿔도 SUCCESS)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 postId: 3
 *
 *       400:
 *         description: 요청값 오류
 *         content:
 *           application/json:
 *             examples:
 *               invalidPostId:
 *                 summary: postId가 올바르지 않음
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "POST_UPDATE_001"
 *                     reason: "postId가 올바르지 않습니다."
 *                     data: { postId: -1 }
 *                   success: null
 *               invalidEmotionsJson:
 *                 summary: emotions JSON 파싱 실패
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "POST_UPDATE_001"
 *                     reason: "emotions는 JSON 문자열 배열이어야 합니다."
 *                     data:
 *                       emotions: "Happy"
 *                   success: null
 *               invalidEmotionsType:
 *                 summary: emotions가 배열이 아님
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "POST_UPDATE_001"
 *                     reason: "emotions는 배열이어야 합니다."
 *                     data:
 *                       emotions: "{\"a\":1}"
 *                   success: null
 *               emotionsTooMany:
 *                 summary: emotions 5개 초과
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "POST_UPDATE_001"
 *                     reason: "emotions는 최대 5개까지 가능합니다."
 *                     data:
 *                       emotionsCount: 6
 *                   success: null
 *               invalidEmotionValue:
 *                 summary: 허용되지 않은 emotion 포함
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "POST_UPDATE_001"
 *                     reason: "emotions에 허용되지 않은 값이 포함되어 있습니다."
 *                     data:
 *                       emotion: "Unknown"
 *                   success: null
 *               invalidDate:
 *                 summary: date 형식 오류(파싱 실패)
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "POST_UPDATE_001"
 *                     reason: "date 형식이 올바르지 않습니다."
 *                     data:
 *                       date: "not-a-date"
 *                   success: null
 *               contentNullNotAllowed:
 *                 summary: content를 null로 설정 시도
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "POST_UPDATE_001"
 *                     reason: "content는 null로 설정할 수 없습니다."
 *                     data:
 *                       content: null
 *                   success: null
 *
 *       401:
 *         description: 로그인 필요(세션 없음)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "U003"
 *                 reason: "로그인이 필요합니다."
 *                 data: null
 *               success: null
 *
 *       403:
 *         description: 게시글 수정 권한 없음
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "POST_403"
 *                 reason: "해당 게시글을 수정할 권한이 없습니다."
 *                 data: { postId: 3 }
 *               success: null
 *
 *       404:
 *         description: 게시글 없음
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "POST_404"
 *                 reason: "게시글을 찾을 수 없습니다."
 *                 data: { postId: 999 }
 *               success: null
 *
 *       500:
 *         description: 서버 오류(S3 업로드 실패 포함)
 *         content:
 *           application/json:
 *             examples:
 *               s3UploadFailed:
 *                 summary: S3 업로드 실패
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "S3_UPLOAD_FAILED"
 *                     reason: "S3 업로드에 실패했습니다."
 *                     data:
 *                       where: "uploadToS3"
 *                       message: "unknown"
 *                   success: null
 */





/**
 * PATCH /api/posts/:postId
 * multipart/form-data
 * - title?: string | null
 * - content?: string (빈문자 허용. "안바꾸려면 key 자체를 안보냄")
 * - date?: string | null (DATETIME)
 * - emotions?: string  (예: ["Happy","Worried"] JSON 문자열) | undefined(미변경)
 * - removePhoto?: "true" | "false" | undefined (photo_url 제거 플래그)
 * - photo?: File 
 */
export const handleUpdatePost = async (req, res) => {
  const postId = Number(req.params.postId);
  if (!Number.isInteger(postId) || postId <= 0) {
    throw new PostUpdateValidationError({ postId }, "postId가 올바르지 않습니다.");
  }


  const userId = req.session?.user?.id;
    if (!userId) throw new UserNotFoundError(null, "로그인이 필요합니다.");

  // multipart에서 값이 "존재"하는지 여부가 핵심
  // - key가 아예 없으면 undefined (미변경)
  // - key가 있으면 string 또는 빈문자("") 또는 "null" 같은 값이 올 수 있음
  const { title, content, date, emotions, removePhoto } = req.body ?? {};
  const file = req.file ?? null;

  const parsed = {
    title: title === undefined ? undefined : (title === "null" ? null : title),
    date: date === undefined ? undefined : (date === "null" ? null : date),
    content: content === undefined ? undefined : content, // 빈문자 허용
    emotions: undefined,
    removePhoto: removePhoto === "true",
  };

  if (emotions !== undefined) {
    // emotions는 JSON 문자열로 받기로 했음: '["Happy","Sad"]'
    try {
      const arr = JSON.parse(emotions);
      if (!Array.isArray(arr)) {
        throw new Error("emotions는 배열이어야 합니다.");
      }
      parsed.emotions = arr;
    } catch (e) {
      throw new PostUpdateValidationError(
        { emotions },
        "emotions는 JSON 배열 문자열이어야 합니다. 예: [\"Happy\",\"Sad\"]"
      );
    }
  }

  const result = await updatePostWithOptionalPhotoAndEmotions({
    postId,
    sessionUser: req.session?.user,
    body: req.body,               
    file,                         
  });

  return res.success(result);
};
