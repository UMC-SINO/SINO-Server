export const bodyToPostRequest = (body) => {
        return {
        userId: body.userId,
        filter: body.filter, //year, month, bookmark
        year: body.year,
        month: body.month
    } 
};

const ALLOWED_EMOTIONS = new Set([
  "Boredom",
  "Worried",
  "Smile",
  "Joyful",
  "Happy",
  "Angry",
  "Shameful",
  "Unrest",
  "Afraid",
  "Sad",
]);

export const bodyToPostEmotion = (body) => {
  const arr = body.emotion;

  if (!Array.isArray(arr)) {
    throw new Error("emotion must be an array");
  }

  // 5개 이상이면 에러(= 최대 4개)
  if (arr.length > 5) {
    throw new Error("emotion must contain less than 5 items");
  }

  // 값 검증: 문자열 + enum 포함 여부
  for (const v of arr) {
    if (typeof v !== "string") {
      throw new Error("emotion array must contain strings only");
    }
    if (!ALLOWED_EMOTIONS.has(v)) {
      throw new Error(`Invalid emotion value: ${v}`);
    }
  }

  // 필요한 형태로 반환 (서비스/레포에서 그대로 쓰기 좋게)
  return { emotion: arr };
};
