import { Hono } from "hono";
import { auth } from "../auth/config";
import { requireBearer } from "../middleware/require-bearer";
import { getOrCreateProfile, toMeResponse } from "../services/profile.service";

export const meRoutes = new Hono();

meRoutes.get("/me", requireBearer, async (c) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session?.user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const authUser = session.user;
  const profile = await getOrCreateProfile(authUser);

  if (!profile) {
    return c.json({ message: "Unable to resolve user profile" }, 500);
  }

  return c.json(toMeResponse(authUser, profile));
});
