import { eq, or } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  emailVerified?: boolean;
};

export async function getOrCreateProfile(authUser: SessionUser) {
  let profile = await db.query.users.findFirst({
    where: or(eq(users.authUserId, authUser.id), eq(users.email, authUser.email)),
  });

  if (!profile) {
    const id = crypto.randomUUID();
    await db.insert(users).values({
      id,
      email: authUser.email,
      fullName: authUser.name ?? null,
      authUserId: authUser.id,
    });

    profile = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  return profile;
}

export function toMeResponse(authUser: SessionUser, profile: NonNullable<Awaited<ReturnType<typeof getOrCreateProfile>>>) {
  return {
    id: profile.id,
    email: authUser.email,
    emailVerified: !!authUser.emailVerified,
    profile: {
      fullName: profile.fullName ?? authUser.name ?? "",
      tenantId: profile.tenantId ?? null,
    },
  };
}
