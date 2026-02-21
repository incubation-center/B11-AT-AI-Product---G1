import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { authAccounts, authSessions, authUsers, authVerifications, users } from "../db/schema";
import { sendResetPasswordEmail, sendVerifyEmail } from "../resend";

const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const defaultFrontendOrigin = process.env.PUBLIC_URL ?? "https://eavheang.me";

function normalizeOrigin(value: string): string {
  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
}

const trustedOrigins = Array.from(
  new Set(
    [
      baseURL,
      defaultFrontendOrigin,
      "https://eavheang.me",
      "https://www.eavheang.me",
      "http://localhost:3000",
      "http://localhost:5173",
      ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",").map((v) => v.trim()) ?? []),
    ]
      .filter(Boolean)
      .map(normalizeOrigin)
  )
);

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

const authSecret = requireEnv("BETTER_AUTH_SECRET");

export const auth = betterAuth({
  baseURL,
  basePath: "/api/auth",
  trustedOrigins,
  secret: authSecret,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: authUsers,
      session: authSessions,
      account: authAccounts,
      verification: authVerifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail({
        to: user.email,
        resetUrl: url,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerifyEmail({
        to: user.email,
        verifyUrl: url,
      });
    },
  },
  plugins: [bearer()],
  databaseHooks: {
    user: {
      create: {
        after: async (authUser) => {
          const existing = await db.query.users.findFirst({
            where: eq(users.email, authUser.email),
          });

          if (!existing) {
            await db.insert(users).values({
              id: crypto.randomUUID(),
              email: authUser.email,
              fullName: authUser.name ?? null,
              authUserId: authUser.id,
            });
            return;
          }

          if (existing.authUserId !== authUser.id || existing.fullName !== authUser.name) {
            await db
              .update(users)
              .set({
                authUserId: authUser.id,
                fullName: authUser.name ?? existing.fullName,
                updatedAt: new Date(),
              })
              .where(eq(users.id, existing.id));
          }
        },
      },
      update: {
        after: async (authUser) => {
          const existing = await db.query.users.findFirst({
            where: eq(users.authUserId, authUser.id),
          });

          if (!existing) {
            return;
          }

          await db
            .update(users)
            .set({
              email: authUser.email,
              fullName: authUser.name ?? existing.fullName,
              updatedAt: new Date(),
            })
            .where(eq(users.id, existing.id));
        },
      },
    },
  },
});
