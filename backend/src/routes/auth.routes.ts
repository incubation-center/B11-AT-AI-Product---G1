import { Hono } from "hono";
import { auth } from "../auth/config";

export const authRoutes = new Hono();

authRoutes.all("/api/auth/*", async (c) => {
  return auth.handler(c.req.raw);
});
