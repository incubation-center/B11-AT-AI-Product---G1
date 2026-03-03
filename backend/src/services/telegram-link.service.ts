import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "../db";
import { telegramLinkTokens, telegramLinks } from "../db/schema";
import { sendTelegramMessage } from "../lib/telegram";
import { getOrCreateProfile } from "./profile.service";
import { getMyTenant } from "./tenant.service";
import type { SessionUser } from "../types/auth";

function createLinkCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let code = "ST";

  for (let i = 0; i < bytes.length; i += 1) {
    code += alphabet[bytes[i] % alphabet.length];
  }

  return code;
}

async function uniqueLinkCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = createLinkCode();
    const existing = await db.query.telegramLinkTokens.findFirst({
      where: eq(telegramLinkTokens.code, code),
      columns: { code: true },
    });
    if (!existing) {
      return code;
    }
  }

  throw new Error("Unable to generate a unique Telegram link code");
}

function nextExpiry(minutes = 10): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export async function createTelegramLinkCode(authUser: SessionUser) {
  const profile = await getOrCreateProfile(authUser);
  if (!profile) {
    throw new Error("Unable to resolve user profile.");
  }

  const tenant = await getMyTenant(authUser);
  if (!tenant) {
    throw new Error("Tenant not found");
  }

  const existingLink = await db.query.telegramLinks.findFirst({
    where: eq(telegramLinks.tenantId, tenant.id),
  });

  const code = await uniqueLinkCode();
  const expiresAt = nextExpiry();

  await db.insert(telegramLinkTokens).values({
    tenantId: tenant.id,
    ownerUserId: profile.id,
    code,
    expiresAt,
    usedAt: null,
  });

  return {
    code,
    expiresAt,
    alreadyLinked: !!existingLink,
    tenant: {
      id: tenant.id,
      shopName: tenant.shopName,
      subdomain: tenant.subdomain,
    },
  };
}

export async function getTelegramLinkStatus(authUser: SessionUser) {
  const profile = await getOrCreateProfile(authUser);
  if (!profile) {
    throw new Error("Unable to resolve user profile.");
  }

  const tenant = await getMyTenant(authUser);
  if (!tenant) {
    return {
      hasTenant: false,
      tenant: null,
      linked: false,
      telegramUserId: null,
      activeCode: null,
    };
  }

  const [link, tokenRows] = await Promise.all([
    db.query.telegramLinks.findFirst({
      where: eq(telegramLinks.tenantId, tenant.id),
    }),
    db.query.telegramLinkTokens.findMany({
      where: and(
        eq(telegramLinkTokens.tenantId, tenant.id),
        isNull(telegramLinkTokens.usedAt),
        gt(telegramLinkTokens.expiresAt, new Date())
      ),
      orderBy: (fields, { desc }) => [desc(fields.createdAt)],
      limit: 1,
    }),
  ]);
  const token = tokenRows[0] ?? null;

  return {
    hasTenant: true,
    tenant: {
      id: tenant.id,
      shopName: tenant.shopName,
      subdomain: tenant.subdomain,
    },
    linked: !!link,
    telegramUserId: link?.telegramUserId ?? null,
    activeCode: token
      ? {
          code: token.code,
          expiresAt: token.expiresAt,
        }
      : null,
  };
}

export async function consumeTelegramLinkCode(telegramUserId: number, code: string) {
  const normalizedCode = code.trim().toUpperCase();
  const now = new Date();

  return db.transaction(async (tx) => {
    const token = await tx.query.telegramLinkTokens.findFirst({
      where: and(
        eq(telegramLinkTokens.code, normalizedCode),
        isNull(telegramLinkTokens.usedAt),
        gt(telegramLinkTokens.expiresAt, now)
      ),
    });

    if (!token) {
      return { ok: false as const, reason: "Invalid or expired code" };
    }

    const existingByUser = await tx.query.telegramLinks.findFirst({
      where: eq(telegramLinks.telegramUserId, telegramUserId),
    });
    if (existingByUser && existingByUser.tenantId !== token.tenantId) {
      return { ok: false as const, reason: "This Telegram account is already linked to another store" };
    }

    const existingByTenant = await tx.query.telegramLinks.findFirst({
      where: eq(telegramLinks.tenantId, token.tenantId),
    });

    if (existingByTenant) {
      await tx
        .update(telegramLinks)
        .set({
          telegramUserId,
          linkedAt: now,
        })
        .where(eq(telegramLinks.tenantId, token.tenantId));
    } else {
      await tx.insert(telegramLinks).values({
        tenantId: token.tenantId,
        telegramUserId,
        linkedAt: now,
      });
    }

    await tx
      .update(telegramLinkTokens)
      .set({
        usedAt: now,
      })
      .where(eq(telegramLinkTokens.id, token.id));

    return { ok: true as const, tenantId: token.tenantId };
  });
}

export async function getTenantLinkByTelegramUser(telegramUserId: number) {
  return db.query.telegramLinks.findFirst({
    where: eq(telegramLinks.telegramUserId, telegramUserId),
  });
}

export async function sendTelegramMessageToTenant(tenantId: string, text: string): Promise<boolean> {
  const link = await db.query.telegramLinks.findFirst({
    where: eq(telegramLinks.tenantId, tenantId),
  });

  if (!link) {
    return false;
  }

  try {
    await sendTelegramMessage(link.telegramUserId, text);
    return true;
  } catch (error) {
    console.error("[telegram] sendTelegramMessageToTenant failed", { tenantId, error });
    return false;
  }
}
