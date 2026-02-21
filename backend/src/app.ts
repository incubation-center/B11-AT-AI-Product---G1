import { Hono } from "hono";
import { authRoutes } from "./routes/auth.routes";
import { docsRoutes } from "./routes/docs.routes";
import { meRoutes } from "./routes/me.routes";
import { rootRoutes } from "./routes/root.routes";

const app = new Hono();

app.route("/", rootRoutes);
app.route("/", docsRoutes);
app.route("/", authRoutes);
app.route("/", meRoutes);

export default app;
