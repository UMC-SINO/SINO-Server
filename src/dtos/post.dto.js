export const bodyToPostRequest = (body) => {
        return {
        userId: body.userId,
        filter: body.filter, //year, month, bookmark
        year: body.year,
        month: body.month
    } 
};

