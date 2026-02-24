/**
 * user-service – manages user profiles (/me endpoints).
 * Default port: 8082
 */
import { Hono } from "hono";
import { corsMiddleware } from "./lib/cors";
import { meRoutes } from "./routes/me.routes";

const app = new Hono();
app.use("*", corsMiddleware);
app.route("/", meRoutes);

const port = Number(process.env.PORT ?? 8082);
export default { port, fetch: app.fetch };
