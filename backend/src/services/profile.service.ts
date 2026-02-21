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

export async function updateProfileFullName(authUser: SessionUser, fullName: string) {
  const profile = await getOrCreateProfile(authUser);

  if (!profile) {
    return null;
  }

  await db
    .update(users)
    .set({
      fullName,
      updatedAt: new Date(),
    })
    .where(eq(users.id, profile.id));

  return db.query.users.findFirst({
    where: eq(users.id, profile.id),
  });
}

export async function deactivateProfile(authUser: SessionUser) {
  const profile = await getOrCreateProfile(authUser);

  if (!profile) {
    return null;
  }

  await db
    .update(users)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(users.id, profile.id));

  return db.query.users.findFirst({
    where: eq(users.id, profile.id),
  });
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
