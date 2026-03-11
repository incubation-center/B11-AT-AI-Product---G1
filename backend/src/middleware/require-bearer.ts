import type { Context, Next } from "hono";
import { auth } from "../auth/config";

export async function requireBearer(c: Context, next: Next) {
  const authorization = c.req.header("authorization");

  if (authorization?.startsWith("Bearer ")) {
    await next();
    return;
  }

  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session?.user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  await next();
}
