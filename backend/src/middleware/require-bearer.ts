import type { Context, Next } from "hono";

export async function requireBearer(c: Context, next: Next) {
  const authorization = c.req.header("authorization");
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  await next();
}
