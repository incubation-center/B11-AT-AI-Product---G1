import type { Context, Next } from "hono";
import { auth } from "../auth/config";
import { readTelegramMiniAppClaimsFromAuthHeader } from "../services/telegram-miniapp.service";

function unauthorized(c: Context) {
  return c.json({ message: "Unauthorized" }, 401);
}

function readBearerToken(authorization?: string): string | null {
  if (!authorization) return null;
  const [scheme, ...rawTokenParts] = authorization.trim().split(/\s+/);
  if (!scheme || scheme.toLowerCase() !== "bearer") return null;
  const token = rawTokenParts.join(" ").trim();
  return token ? token : null;
}

export async function requireAuth(c: Context, next: Next) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session?.user) {
    return unauthorized(c);
  }

  c.set("authUser", session.user);
  c.set("authSession", session);
  await next();
}

export async function requireAuthorizationBearer(c: Context, next: Next) {
  const authorization = c.req.header("authorization");
  const token = readBearerToken(authorization);
  if (!token) {
    return unauthorized(c);
  }

  try {
    const claims = readTelegramMiniAppClaimsFromAuthHeader(`Bearer ${token}`);
    c.set("telegramMiniAppClaims", claims);
    await next();
    return;
  } catch {
    const headers = new Headers();
    headers.set("authorization", `Bearer ${token}`);

    const session = await auth.api.getSession({
      headers,
    });

    if (!session?.user) {
      return unauthorized(c);
    }

    c.set("authUser", session.user);
    c.set("authSession", session);
    await next();
  }
}

export const requireBearer = requireAuth;
