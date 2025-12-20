export const bodyToPostRequest = (body) => {
        return {
        userId: body.userId,
        filter: body.filter, //year, month, bookmark
        year: body.year,
        month: body.month
    } 
};

export const bodyToPostEmotion = (body) => {
  const arr = body?.emotion_name;

  if (!Array.isArray(arr)) {
    throw new Error("emotion_name must be an array");
  }

  // 문자열만, trim, 빈값 제거
  const cleaned = arr
    .filter((v) => typeof v === "string")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);

  // (선택) 중복 제거
  const unique = [...new Set(cleaned)];

  // 0개면 에러 (원하면 정책 바꿔도 됨)
  if (unique.length === 0) {
    throw new Error("emotion_name must contain at least one valid string");
  }

  // 5개 초과면 에러 (정책)
  if (unique.length > 5) {
    throw new Error("emotion_name can contain up to 5 items");
  }

  return { emotion_name: unique };
};
