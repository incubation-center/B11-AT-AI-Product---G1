/**
 * auth-service – handles authentication, email verification, and API docs.
 * Default port: 8081
 */
import { Hono } from "hono";
import { corsMiddleware } from "./lib/cors";
import { authRoutes } from "./routes/auth.routes";
import { docsRoutes } from "./routes/docs.routes";
import { rootRoutes } from "./routes/root.routes";

const app = new Hono();
app.use("*", corsMiddleware);
app.route("/", rootRoutes);
app.route("/", docsRoutes);
app.route("/", authRoutes);

const port = Number(process.env.PORT ?? 8081);
export default { port, fetch: app.fetch };
