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
        url: "http://localhost:3000",
      },
    ],
  },
  apis: ["./src/routes/*.js", "./src/**/*.js"],
};

export const specs = swaggerJSDoc(options);
