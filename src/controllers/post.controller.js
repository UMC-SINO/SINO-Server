import {
  bookmarkToggle,
  deletePost,
  getSignalPost,
  getNoisePost,
  updateEmotion,
  addOnelineToPost,
  getPostById,
  getPostsById,
} from "../services/post.service.js";
import { bodyToPostRequest, bodyToPostEmotion } from "../dtos/post.dto.js";

/**
 * @swagger
 * tags:
 *   name: Post
 *   description: 게시글(Post) 관련 API
 */

/**
 * @swagger
 * /api/posts/{postId}/bookmark:
 *   patch:
 *     summary: 게시글 북마크 토글
 *     tags:
 *       - Post
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: 북마크를 토글할 게시글 ID
 *     responses:
 *       200:
 *         description: 북마크 토글 성공
 *         content:
 *           application/json:
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 id: 1
 *                 user_id: 1
 *                 year: 2025
 *                 month: 12
 *                 book_mark: true
 *                 title: "오늘의 기록"
 *                 content: "내용..."
 *                 heart: 0
 *                 is_deleted: false
 *                 deleted_at: null
 *                 created_at: "2025-12-19T00:00:00.000Z"
 *       400:
 *         description: 유효하지 않은 게시글 ID (P001)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "P001"
 *                 reason: "유효하지 않은 게시글 ID 입니다."
 *                 data:
 *                   postId: "abc"
 *               success: null
 *       404:
 *         description: 게시글을 찾을 수 없음 (P002)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "P002"
 *                 reason: "일치하는 게시글이 없습니다."
 *                 data:
 *                   postId: 999
 *               success: null
 *       500:
 *         description: 서버 에러 (P003)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "P003"
 *                 reason: "서버 에러가 발생하였습니다."
 *                 data: null
 *               success: null
 */
export const handleBookmarkToggle = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const result = await bookmarkToggle(postId);
    return res.success(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * @swagger
 * /api/posts/{postId}:
 *   delete:
 *     summary: 게시글 삭제 (소프트 삭제)
 *     tags:
 *       - Post
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: 삭제할 게시글 ID
 *     responses:
 *       200:
 *         description: 게시글 삭제 성공
 *         content:
 *           application/json:
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 message: "Post with ID 1 deleted."
 *                 deletedPost:
 *                   id: 1
 *                   user_id: 1
 *                   year: 2025
 *                   month: 12
 *                   book_mark: false
 *                   title: "오늘의 기록"
 *                   content: "내용..."
 *                   heart: 0
 *                   is_deleted: true
 *                   deleted_at: "2025-12-19T00:00:00.000Z"
 *                   created_at: "2025-12-19T00:00:00.000Z"
 *       400:
 *         description: 유효하지 않은 게시글 ID 또는 이미 삭제된 게시글 (P001, P004)
 *         content:
 *           application/json:
 *             examples:
 *               invalidPostId:
 *                 summary: 유효하지 않은 postId (P001)
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "P001"
 *                     reason: "유효하지 않은 게시글 ID 입니다."
 *                     data:
 *                       postId: "abc"
 *                   success: null
 *               alreadyDeleted:
 *                 summary: 이미 삭제된 게시글 (P004)
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "P004"
 *                     reason: "이미 삭제된 게시글입니다."
 *                     data:
 *                       postId: 1
 *                   success: null
 *       404:
 *         description: 게시글을 찾을 수 없음 (P002)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "P002"
 *                 reason: "일치하는 게시글이 없습니다."
 *                 data:
 *                   postId: 999
 *               success: null
 *       500:
 *         description: 서버 에러 (P003)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "P003"
 *                 reason: "서버 에러가 발생하였습니다."
 *                 data: null
 *               success: null
 */
export const handlePostDelete = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const result = await deletePost(postId);
    return res.success({
      message: `Post with ID ${postId} deleted.`,
      deletedPost: result,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * @swagger
 * /api/posts/signal:
 *   post:
 *     summary: Signal 게시글 목록 조회
 *     tags:
 *       - Post
 *     description: 유저의 Signal 게시글을 연도별, 월별 또는 북마크 여부에 따라 필터링하여 조회합니다. (최대 16개)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - filter
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               filter:
 *                 type: string
 *                 enum:
 *                   - year
 *                   - month
 *                   - bookmark
 *                 example: year
 *               year:
 *                 type: string
 *                 description: "filter가 year 또는 month일 때 사용 (optional)"
 *                 example: "2025"
 *               month:
 *                 type: string
 *                 description: "filter가 month일 때 사용 (optional)"
 *                 example: ""
 *           example:
 *             userId: 1
 *             filter: "year"
 *             year: "2025"
 *             month: ""
 *     responses:
 *       200:
 *         description: 조회 성공
 *         content:
 *           application/json:
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 result: []
 *       400:
 *         description: 잘못된 요청 (P001)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "P001"
 *                 reason: "유효하지 않은 게시글 ID 입니다."
 *                 data:
 *                   received: "abc"
 *               success: null
 *       404:
 *         description: 유저를 찾을 수 없음 (U001 등)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "U001"
 *                 reason: "사용자를 찾을 수 없습니다."
 *                 data:
 *                   userId: 123
 *               success: null
 *       500:
 *         description: 서버 내부 에러 (P003)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "P003"
 *                 reason: "서버 에러가 발생하였습니다."
 *                 data:
 *                   detail: "Invalid filter type"
 *               success: null
 */
export const handleSignalPosts = async (req, res, next) => {
  try {
    const postRequest = bodyToPostRequest(req.body);
    const result = await getSignalPost(postRequest);
    return res.success({ result: result });
  } catch (error) {
    return next(error);
  }
};

export const handleGetPosts = async (req, res, next) => {
  try {
    const { type, sort } = req.query;
    const sessionUser = req.session.user;
    const userId = sessionUser.id;

    const result = await getPostsById(userId, type, sort);
    return res.success({ result: result });
  } catch (error) {
    return next(error);
  }
};

/**
 * @swagger
 * /api/posts/noise:
 *   post:
 *     summary: Noise 게시글 목록 조회
 *     tags:
 *       - Post
 *     description: |
 *       유저의 Noise 게시글을 연도별, 월별 또는 북마크 여부에 따라 필터링하여 조회합니다. (최대 16개)
 *       - filter=year: 해당 연도의 데이터를 가져옵니다. (year 파라미터 권장)
 *       - filter=month: 해당 연도/월의 데이터를 가져옵니다. (year, month 파라미터 권장)
 *       - filter=bookmark: 북마크된 Noise 데이터를 가져옵니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - filter
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *                 description: 사용자 ID
 *               filter:
 *                 type: string
 *                 enum:
 *                   - year
 *                   - month
 *                   - bookmark
 *                 example: year
 *                 description: 필터 타입
 *               year:
 *                 type: string
 *                 description: "filter가 year 또는 month일 때 사용 (optional)"
 *                 example: "2025"
 *               month:
 *                 type: string
 *                 description: "filter가 month일 때 사용 (optional)"
 *                 example: ""
 *           example:
 *             userId: 1
 *             filter: "year"
 *             year: "2025"
 *             month: ""
 *     responses:
 *       200:
 *         description: 조회 성공
 *         content:
 *           application/json:
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 result:
 *                   - id: 1
 *                     content: "내용..."
 *                     signal_noise: "noise"
 *                     created_at: "2025-12-20T..."
 *       400:
 *         description: 요청 파라미터 오류 (P001)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "P001"
 *                 reason: "유효하지 않은 게시글 ID 입니다."
 *                 data:
 *                   received: "abc"
 *               success: null
 *       404:
 *         description: 사용자를 찾을 수 없음 (U001)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "U001"
 *                 reason: "사용자를 찾을 수 없습니다."
 *                 data:
 *                   userId: 123
 *               success: null
 *       500:
 *         description: 서버 내부 에러 (P003)
 *         content:
 *           application/json:
 *             examples:
 *               invalidFilter:
 *                 summary: 유효하지 않은 필터 타입
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "P003"
 *                     reason: "유효하지 않은 필터 타입입니다."
 *                     data:
 *                       userId: 1
 *                       detail: "Invalid filter type"
 *               dbError:
 *                 summary: 기타 서버/DB 에러
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "P003"
 *                     reason: "서버 에러가 발생하였습니다."
 *                     data:
 *                       detail: "Database connection timeout"
 */
export const handleNoisePosts = async (req, res, next) => {
  try {
    const postRequest = bodyToPostRequest(req.body);
    const result = await getNoisePost(postRequest);
    return res.success({ result: result });
  } catch (error) {
    return next(error);
  }
};
/**
 * @swagger
 * /api/posts/{postId}:
 *   get:
 *     summary: 게시글 통합 상세 조회 (글 + AI 분석 + 감정)
 *     tags:
 *       - Post
 *     description: |
 *       특정 postId에 해당하는 게시글의 모든 정보(본문, 이미지, AI 감정 분석 결과, 유저 선택 감정 등)를 조회합니다.
 *       - **aiAnalysis**: AI가 분석한 Signal/Noise 결과 및 상위 감정 리스트
 *       - **emotion**: 게시글에 연결된 전체 감정 태그 리스트
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 조회할 게시글 ID
 *         example: 1
 *     responses:
 *       200:
 *         description: 조회 성공
 *         content:
 *           application/json:
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 id: 1
 *                 user_id: 1
 *                 date: "2025-12-21T00:00:00.000Z"
 *                 title: "오늘의 기록"
 *                 content: "게시글 본문 내용입니다."
 *                 photo_url: "https://sino-bucket.s3.amazonaws.com/posts/1/uuid.jpg"
 *                 created_at: "2025-12-21T16:00:00.000Z"
 *                 book_mark: false
 *                 signal_noise: "signal"
 *                 is_deleted: false
 *                 aiAnalysis:
 *                   id: 10
 *                   post_id: 1
 *                   signal_noise_result: "Signal"
 *                   aiAnalyzedEmotion:
 *                     - emotion_name: "Happy"
 *                       percentage: 85.5
 *                     - emotion_name: "Joyful"
 *                       percentage: 12.0
 *                 emotion:
 *                   - emotion_name: "Happy"
 *                     modified: false
 *                   - emotion_name: "Smile"
 *                     modified: true
 *       400:
 *         description: 유효하지 않은 ID 형식 (P001)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "P001"
 *                 reason: "유효하지 않은 게시글 ID 입니다."
 *                 data:
 *                   postId: "abc"
 *               success: null
 *       404:
 *         description: 게시글을 찾을 수 없음 (P002)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "P002"
 *                 reason: "일치하는 게시글이 없습니다."
 *                 data:
 *                   postId: 999
 *               success: null
 *       500:
 *         description: 서버 내부 에러 (P003)
 *         content:
 *           application/json:
 *             examples:
 *               dbError:
 *                 summary: DB 관련 에러
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "P003"
 *                     reason: "서버 에러가 발생하였습니다."
 *                     data:
 *                       detail: "Database connection timeout"
 *                   success: null
 */
export const handlePost = async (req, res, next) => {
  try {
    const postId = Number(req.params.postId);
    const result = await getPostById(postId);
    return res.success(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * @swagger
 * /api/posts/{postId}/oneline:
 *   post:
 *     summary: 게시글 한 줄 정리 추가
 *     tags:
 *       - Post
 *     description: |
 *       특정 게시글에 대해 사용자가 작성한 '한 줄 정리' 내용을 저장합니다.
 *       - 한 줄 정리는 최대 50자까지 가능합니다.
 *       - 존재하지 않는 게시글에는 추가할 수 없습니다.
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 한 줄 정리를 추가할 게시글 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oneline
 *             properties:
 *               oneline:
 *                 type: string
 *                 maxLength: 50
 *                 example: "오늘 하루는 정말 보람찼다."
 *                 description: 저장할 한 줄 정리 내용
 *     responses:
 *       200:
 *         description: 등록 성공
 *         content:
 *           application/json:
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 id: 10
 *                 post_id: 1
 *                 content: "오늘 하루는 정말 보람찼다."
 *       400:
 *         description: 잘못된 요청 (P001)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "P001"
 *                 reason: "유효하지 않은 게시글 ID 입니다."
 *                 data:
 *                   received: "abc"
 *               success: null
 *       404:
 *         description: 게시글 없음 (P002)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "P002"
 *                 reason: "일치하는 게시글이 없습니다."
 *                 data:
 *                   postId: 999
 *               success: null
 *       500:
 *         description: 서버 에러 (P003)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "P003"
 *                 reason: "oneline 처리 중 오류가 발생했습니다."
 *                 data:
 *                   postId: 1
 *                   detail: "Database constraints violation"
 *               success: null
 */
export const handlePostOneline = async (req, res, next) => {
  try {
    const postId = Number(req.params.postId);
    const { oneline } = req.body;
    const result = await addOnelineToPost(postId, oneline);
    return res.success(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * @swagger
 * /api/posts/{postId}/emotion:
 *   patch:
 *     summary: 게시글 감정 수정 (사용자 선택)
 *     tags:
 *       - Post
 *     description: |
 *       사용자가 직접 선택한 감정들(최대 5개)로 게시글의 감정 데이터를 업데이트합니다.
 *       기존에 저장된 해당 게시글의 감정 데이터가 있다면 추가로 생성(CreateMany)됩니다.
 *       - 감정은 미리 정의된 10가지 종류만 가능합니다.
 *       - 한 게시물당 최대 5개까지 배열로 보낼 수 있습니다.
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 감정을 수정할 게시글 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emotion
 *             properties:
 *               emotion:
 *                 type: array
 *                 maxItems: 5
 *                 items:
 *                   type: string
 *                   enum:
 *                     - Boredom
 *                     - Worried
 *                     - Smile
 *                     - Joyful
 *                     - Happy
 *                     - Angry
 *                     - Shameful
 *                     - Unrest
 *                     - Afraid
 *                     - Sad
 *                 example:
 *                   - "Happy"
 *                   - "Joyful"
 *                 description: 선택한 감정 이름 리스트
 *     responses:
 *       200:
 *         description: 수정 성공
 *         content:
 *           application/json:
 *             example:
 *               resultType: "SUCCESS"
 *               error: null
 *               success:
 *                 - id: 1
 *                   post_id: 1
 *                   emotion_name: "Happy"
 *                   modified: true
 *                 - id: 2
 *                   post_id: 1
 *                   emotion_name: "Joyful"
 *                   modified: true
 *       400:
 *         description: 잘못된 요청 (P001 또는 입력값 오류)
 *         content:
 *           application/json:
 *             examples:
 *               invalidId:
 *                 summary: 유효하지 않은 postId (P001)
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "P001"
 *                     reason: "유효하지 않은 게시글 ID 입니다."
 *                     data:
 *                       received: "abc"
 *               invalidInput:
 *                 summary: 감정 배열 형식/개수 오류
 *                 value:
 *                   resultType: "FAIL"
 *                   error:
 *                     errorCode: "COMMON_001"
 *                     reason: "emotion must contain less than 5 items"
 *                     data: null
 *       404:
 *         description: 게시글 없음 (P002)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "P002"
 *                 reason: "일치하는 게시글이 없습니다."
 *                 data:
 *                   postId: 999
 *       500:
 *         description: 서버 에러 (P003)
 *         content:
 *           application/json:
 *             example:
 *               resultType: "FAIL"
 *               error:
 *                 errorCode: "P003"
 *                 reason: "감정 처리 중 오류가 발생했습니다."
 *                 data:
 *                   postId: 1
 *                   detail: "Transaction failed"
 */
export const handlePostEmotion = async (req, res, next) => {
  try {
    const postId = Number(req.params.postId);
    const { emotion } = bodyToPostEmotion(req.body);
    const result = await updateEmotion(postId, emotion);
    return res.success(result);
  } catch (error) {
    return next(error);
  }
};
