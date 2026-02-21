import app from "./app";

const port = Number(process.env.PORT) || 8080;

export default {
  port,
  fetch: app.fetch,
};
