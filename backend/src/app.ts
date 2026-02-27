import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRoutes } from "./routes/auth.routes";
import { docsRoutes } from "./routes/docs.routes";
import { meRoutes } from "./routes/me.routes";
import { orderRoutes } from "./routes/order.routes";
import { productRoutes } from "./routes/product.routes";
import { ragRoutes } from "./routes/rag.routes";
import { rootRoutes } from "./routes/root.routes";
import { tenantRoutes } from "./routes/tenant.routes";
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
      if (!origin) return "*";
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
app.route("/", tenantRoutes);
app.route("/", productRoutes);
app.route("/", orderRoutes);
app.route("/", ragRoutes);

export default app;
