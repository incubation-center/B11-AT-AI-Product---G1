import { cors } from "hono/cors";
import { env } from "../env";

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
    // Allow exactly <subdomain>.lvh.me:PORT or <subdomain>.127.0.0.1.nip.io:PORT
    // where subdomain contains only alphanumeric characters and hyphens.
    return (
      /^[a-z0-9-]+\.lvh\.me:3000$/.test(host) ||
      /^[a-z0-9-]+\.lvh\.me:5173$/.test(host) ||
      /^[a-z0-9-]+\.127\.0\.0\.1\.nip\.io:3000$/.test(host)
    );
  } catch {
    return false;
  }
}

export const corsMiddleware = cors({
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
});
