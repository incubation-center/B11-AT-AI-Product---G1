import { Hono } from "hono";
import { cors } from "hono/cors";
import { analyticsRoutes } from "./routes/analytics.routes";
import { assistantRoutes } from "./routes/assistant.routes";
import { authRoutes } from "./routes/auth.routes";
import { docsRoutes } from "./routes/docs.routes";
import { globalSearchRoutes } from "./routes/global-search.routes";
import { meRoutes } from "./routes/me.routes";
import { orderRoutes } from "./routes/order.routes";
import { paywayRoutes } from "./routes/payway.routes";
import { productRoutes } from "./routes/product.routes";
import { ragRoutes } from "./routes/rag.routes";
import { rootRoutes } from "./routes/root.routes";
import { tenantRoutes } from "./routes/tenant.routes";
import { telegramRoutes } from "./routes/telegram.routes";
import { env } from "./env";

const app = new Hono();

const defaultOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:8080",
];

const allowedOrigins = new Set(
  [
    ...defaultOrigins,
    ...(env.CORS_ORIGINS?.split(",").map((v) => v.trim()).filter(Boolean) ?? []),
  ].map((v) => v.replace(/\/$/, ""))
);

function allowLocalWildcardOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    const host = url.host.toLowerCase();
    return host.endsWith(".lvh.me:3000") || host.endsWith(".lvh.me:5173") || host.endsWith(".127.0.0.1.nip.io:3000");
  } catch {
    return false;
  }
}

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return "";
      const normalized = origin.replace(/\/$/, "");
      if (allowedOrigins.has(normalized) || allowLocalWildcardOrigin(normalized)) {
        return origin;
      }
      return "";
    },
    allowMethods: ["GET", "POST", "PATCH", "PUT", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.route("/", rootRoutes);
app.route("/", docsRoutes);
app.route("/", authRoutes);
app.route("/", meRoutes);
app.route("/", analyticsRoutes);
app.route("/", assistantRoutes);
app.route("/", globalSearchRoutes);
app.route("/", tenantRoutes);
app.route("/", telegramRoutes);
app.route("/", productRoutes);
app.route("/", orderRoutes);
app.route("/", paywayRoutes);
app.route("/", ragRoutes);

export default app;
