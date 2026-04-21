import type { getStoreBySubdomain } from "../services/tenant.service";
import type { TelegramMiniAppClaims } from "../services/telegram-miniapp.service";
import type { SessionUser } from "./auth";

declare module "hono" {
  interface ContextVariableMap {
    authUser: SessionUser;
    authSession: unknown;
    resolvedSubdomain: string | null;
    resolvedTenant: Awaited<ReturnType<typeof getStoreBySubdomain>> | null;
    telegramMiniAppClaims: TelegramMiniAppClaims;
  }
}

export {};
