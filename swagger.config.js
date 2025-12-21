import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SINO API",
      version: "1.0.0",
      description: "UMC Node.js Server API",
    },
    servers: [
      {
        url: "http://52.91.220.116:3000",
      },
      {
        url: "https://sino-server.duckdns.org",
      }
    ],

    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "connect.sid",
          description:
            "세션 기반 인증. 먼저 /api/auth/login 성공 후 발급되는 connect.sid가 필요합니다.",
        },
      },
    },
  },
  apis: ["./src/routes/*.js", "./src/**/*.js"],
};

export const specs = swaggerJSDoc(options);
