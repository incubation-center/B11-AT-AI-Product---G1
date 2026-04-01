export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8080';

export const AUTH_TOKEN_COOKIE = 'coolhat_owner_token';

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  emailVerified?: boolean;
};

export type SessionResponse = {
  session?: {
    id?: string;
    userId?: string;
    token?: string;
  } | null;
  user?: SessionUser | null;
  token?: string | null;
} | null;

export type TenantSummary = {
  id: string;
  shopName: string;
  shopType: string;
  description?: string | null;
  addressText?: string | null;
  googleMapUrl?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  storefrontTemplate?: string | null;
  subdomain: string;
  storeUrl: string;
  isActive: boolean;
};

export type TenantStatusResponse = {
  hasTenant: boolean;
  tenant: TenantSummary | null;
};

export type TelegramLinkStatus = {
  hasTenant: boolean;
  tenant: {
    id: string;
    shopName: string;
    subdomain: string;
  } | null;
  linked: boolean;
  telegramUserId: number | null;
  activeCode: {
    code: string;
    expiresAt: string;
  } | null;
};

export type CreateTenantPayload = {
  shop_name: string;
  shop_type: string;
  description?: string;
  address_text?: string;
  google_map_url?: string;
  logo_url?: string;
  banner_url?: string;
};

export type UpdateTenantPayload = Partial<CreateTenantPayload> & {
  storefront_template?: string | null;
  is_active?: boolean;
};

type UnknownJson = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownJson {
  return typeof value === 'object' && value !== null;
}

function setBrowserCookie(
  name: string,
  value: string,
  maxAgeSeconds = 60 * 60 * 24 * 30,
) {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${name}=${encodeURIComponent(
    value,
  )}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

function removeBrowserCookie(name: string) {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

export function getBrowserCookie(name: string) {
  if (typeof document === 'undefined') {
    return '';
  }

  const key = `${name}=`;
  const found = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(key));

  return found ? decodeURIComponent(found.slice(key.length)) : '';
}

function extractBearerToken(payload: unknown): string {
  if (!payload) return '';
  if (typeof payload === 'string' && payload.trim()) return payload.trim();
  if (!isRecord(payload)) return '';

  const directKeys = ['token', 'bearerToken', 'accessToken'];
  for (const key of directKeys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  const nestedKeys = ['session', 'data'];
  for (const key of nestedKeys) {
    const nested = payload[key];
    const token = extractBearerToken(nested);
    if (token) {
      return token;
    }
  }

  return '';
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const data = text
    ? (JSON.parse(text) as T & { message?: string })
    : ({} as T);

  if (!response.ok) {
    const message =
      typeof (data as { message?: string }).message === 'string'
        ? (data as { message: string }).message
        : 'Request failed';
    throw new Error(message);
  }

  return data as T;
}

export async function signInWithEmail(input: {
  email: string;
  password: string;
  callbackURL?: string;
  rememberMe?: boolean;
}) {
  const response = await fetch(`${API_URL}/api/auth/sign-in/email`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const data = await parseResponse<UnknownJson>(response);
  const token = extractBearerToken(data);

  if (token) {
    setBrowserCookie(AUTH_TOKEN_COOKIE, token);
  }

  return data;
}

export async function signUpWithEmail(input: {
  name: string;
  email: string;
  password: string;
  callbackURL?: string;
  rememberMe?: boolean;
}) {
  const response = await fetch(`${API_URL}/api/auth/sign-up/email`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return parseResponse(response);
}

export async function signOut() {
  const token = getBrowserCookie(AUTH_TOKEN_COOKIE);
  const response = await fetch(`${API_URL}/api/auth/sign-out`, {
    method: 'POST',
    credentials: 'include',
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  removeBrowserCookie(AUTH_TOKEN_COOKIE);

  return parseResponse(response);
}

export async function forgotPassword(input: { email: string }) {
  const response = await fetch(`${API_URL}/api/auth/request-password-reset`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email,
      redirectTo:
        typeof window !== 'undefined'
          ? `${window.location.origin}/reset-password`
          : undefined,
    }),
  });

  return parseResponse(response);
}

export async function verifyResetCode(input: { email: string; code: string }) {
  const response = await fetch(`${API_URL}/api/auth/verify-reset-code`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email,
      code: input.code,
    }),
  });

  return parseResponse<{ token: string }>(response);
}

export async function resetPassword(input: { token: string; password: string }) {
  const response = await fetch(`${API_URL}/api/auth/reset-password`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token: input.token,
      newPassword: input.password,
    }),
  });

  return parseResponse(response);
}

export async function protectedFetch<T>(path: string, init?: RequestInit) {
  const token = getBrowserCookie(AUTH_TOKEN_COOKIE);
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });

  return parseResponse<T>(response);
}

export async function getTenantStatus() {
  return protectedFetch<TenantStatusResponse>('/me/tenant');
}

export async function createTenant(payload: CreateTenantPayload) {
  return protectedFetch<{ message: string; tenant: TenantSummary | null }>(
    '/tenants',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );
}

export async function getTelegramLinkStatus() {
  return protectedFetch<TelegramLinkStatus>('/telegram/link-status');
}

export async function generateTelegramLinkCode() {
  return protectedFetch<{
    message: string;
    code: string;
    expiresAt: string;
    alreadyLinked: boolean;
    tenant: {
      id: string;
      shopName: string;
      subdomain: string;
    };
  }>('/telegram/link-code', {
    method: 'POST',
  });
}

export async function sendVerificationEmail() {
  return protectedFetch<{ message: string }>('/api/auth/send-verification-email', {
    method: 'POST',
  });
}

export async function requestPasswordReset(email: string) {
  return protectedFetch<{ message: string }>('/api/auth/request-password-reset', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
}

export async function updateMyTenant(payload: UpdateTenantPayload) {
  return protectedFetch<{ message: string; tenant: TenantSummary | null }>(
    '/me/tenant',
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );
}
