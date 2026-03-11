import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  API_URL,
  AUTH_TOKEN_COOKIE,
  type SessionResponse,
  type TelegramLinkStatus,
  type TenantStatusResponse,
} from "@/lib/auth";

function toCookieHeader(entries: Array<{ name: string; value: string }>) {
  return entries.map(({ name, value }) => `${name}=${value}`).join("; ");
}

async function getCookieStore() {
  return cookies();
}

async function getCookieHeader() {
  const cookieStore = await getCookieStore();
  return toCookieHeader(cookieStore.getAll());
}

export async function getServerSession() {
  const cookieHeader = await getCookieHeader();

  if (!cookieHeader) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/get-session`, {
      method: "GET",
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as SessionResponse;
    return data?.user ? data : null;
  } catch (error) {
    console.error("[getServerSession] Fetch error:", error);
    return null;
  }
}

async function getServerBearerToken() {
  const cookieStore = await getCookieStore();
  return cookieStore.get(AUTH_TOKEN_COOKIE)?.value ?? "";
}

async function getProtectedServerData<T>(path: string) {
  const [cookieHeader, token] = await Promise.all([
    getCookieHeader(),
    getServerBearerToken(),
  ]);
  const headers = new Headers();
  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`[getProtectedServerData] Fetch error for ${path}:`, error);
    return null;
  }
}

export async function getServerTenantStatus() {
  return getProtectedServerData<TenantStatusResponse>("/me/tenant");
}

export async function getServerTelegramLinkStatus() {
  return getProtectedServerData<TelegramLinkStatus>("/telegram/link-status");
}

export async function requireServerSession() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  return session;
}

export async function redirectIfAuthenticated(pathname = "/dashboard") {
  const session = await getServerSession();

  if (session?.user) {
    redirect(pathname);
  }
}

export async function getOwnerFlowState() {
  const session = await requireServerSession();
  const tenantStatus = await getServerTenantStatus();

  if (!tenantStatus) {
    throw new Error("Unable to load tenant status.");
  }

  return {
    session,
    tenantStatus,
    selectedTemplate: tenantStatus?.tenant?.storefrontTemplate ?? "",
  };
}

export async function requireDashboardReady() {
  const state = await getOwnerFlowState();

  if (!state.tenantStatus.hasTenant) {
    redirect("/onboarding/store");
  }

  if (!state.selectedTemplate) {
    redirect("/onboarding/template");
  }

  return state;
}

export async function requireStoreOnboarding() {
  const state = await getOwnerFlowState();

  if (state.tenantStatus.hasTenant) {
    if (state.selectedTemplate) {
      redirect("/dashboard");
    }

    redirect("/onboarding/template");
  }

  return state;
}

export async function requireTemplateOnboarding() {
  const state = await getOwnerFlowState();

  if (!state.tenantStatus.hasTenant) {
    redirect("/onboarding/store");
  }

  if (state.selectedTemplate) {
    redirect("/dashboard");
  }

  return state;
}
