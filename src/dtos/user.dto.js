export const responseFromUser = (body) => {
  return {
    id: body.id
  };
};

export const bodyToUserId = (body) => {
  return {
    userId: body.userId
  };
}

export const bodyToUser = (body) => {
  return {
    username: body.username, 
    password: body.password
  };
}