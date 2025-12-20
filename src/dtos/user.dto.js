export const responseFromUser = (body) => {
  return {
    id: body.id
  };
};

export const bodyToUser = (body) => {
  return {
    username: body.username, 
    password: body.password
  };
}