import { Hono } from "hono";
import { auth } from "../auth/config";
import { requireBearer } from "../middleware/require-bearer";
import {
  deactivateProfile,
  getOrCreateProfile,
  toMeResponse,
  updateProfileFullName,
} from "../services/profile.service";

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

meRoutes.patch("/me", requireBearer, async (c) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session?.user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  const fullNameRaw = body?.full_name ?? body?.fullName;

  if (typeof fullNameRaw !== "string" || !fullNameRaw.trim()) {
    return c.json({ message: "full_name is required" }, 400);
  }

  const profile = await updateProfileFullName(session.user, fullNameRaw.trim());

  if (!profile) {
    return c.json({ message: "Unable to resolve user profile" }, 500);
  }

  return c.json(toMeResponse(session.user, profile));
});

meRoutes.patch("/me/deactivate", requireBearer, async (c) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session?.user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const profile = await deactivateProfile(session.user);

  if (!profile) {
    return c.json({ message: "Unable to resolve user profile" }, 500);
  }

  return c.json({
    message: "Account deactivated",
    profile: {
      id: profile.id,
      isActive: profile.isActive,
      updatedAt: profile.updatedAt,
    },
  });
});
