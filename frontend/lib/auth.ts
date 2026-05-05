export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8080';

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
  paywayLinkUrl?: string | null;
  storefrontTemplate?: string | null;
  subdomain: string;
  storeUrl: string;
  isActive: boolean;
};

export type SubscriptionPlanId = 'free_trial' | 'starter' | 'growth';
export type PaidSubscriptionPlanId = Extract<
  SubscriptionPlanId,
  'starter' | 'growth'
>;

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'payment_pending'
  | 'past_due'
  | 'expired'
  | 'cancelled';

export type SubscriptionSummary = {
  id: string;
  plan: SubscriptionPlanId;
  status: SubscriptionStatus;
  amountUsd: number;
  trialEndsAt: string | null;
  currentPeriodEnd: string;
  isAccessActive: boolean;
  capabilities: {
    productLimit: number;
    aiMonthlyLimit: number;
    removeBranding: boolean;
  };
};

export type TenantStatusResponse = {
  hasTenant: boolean;
  tenant: TenantSummary | null;
  subscription?: SubscriptionSummary | null;
};

export type BillingSubscriptionResponse = {
  tenant: TenantSummary | null;
  subscription: SubscriptionSummary | null;
};

export type BillingSubscriptionActionResponse = {
  subscription: SubscriptionSummary | null;
};

export type BillingPaywayInitResponse = BillingSubscriptionActionResponse & {
  payment: Record<string, unknown>;
};

export type BillingPaywayStatusResponse = BillingSubscriptionActionResponse & {
  paywayStatus: unknown;
};

export type BillingPaywayStatusInput = {
  planId: PaidSubscriptionPlanId;
  clientId: string;
  deviceId: string;
  requestTime: string;
  token: string;
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
  payway_link_url?: string;
};

export type UpdateTenantPayload = Partial<CreateTenantPayload> & {
  storefront_template?: string | null;
  is_active?: boolean;
};

type UnknownJson = Record<string, unknown>;

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let data: (T & { message?: string }) | null = null;
  if (text) {
    try {
      data = JSON.parse(text) as T & { message?: string };
    } catch {
      data = { message: text } as T & { message?: string };
    }
  } else {
    data = {} as T & { message?: string };
  }

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
  const response = await fetch(`${API_URL}/api/auth/sign-out`, {
    method: 'POST',
    credentials: 'include',
  });

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

export async function resetPassword(input: {
  token: string;
  password: string;
}) {
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
  const headers = new Headers(init?.headers);

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

export async function getBillingSubscription() {
  return protectedFetch<BillingSubscriptionResponse>('/billing/subscription');
}

export async function startBillingTrial() {
  return protectedFetch<BillingSubscriptionActionResponse>('/billing/trial', {
    method: 'POST',
  });
}

export async function initBillingPayway(planId: PaidSubscriptionPlanId) {
  return protectedFetch<BillingPaywayInitResponse>('/billing/payway/init', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ plan_id: planId }),
  });
}

export async function checkBillingPaywayStatus(
  input: BillingPaywayStatusInput,
) {
  return protectedFetch<BillingPaywayStatusResponse>('/billing/payway/status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      plan_id: input.planId,
      client_id: input.clientId,
      device_id: input.deviceId,
      request_time: input.requestTime,
      token: input.token,
    }),
  });
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
  return protectedFetch<{ message: string }>(
    '/api/auth/send-verification-email',
    {
      method: 'POST',
    },
  );
}

export async function requestPasswordReset(email: string) {
  return protectedFetch<{ message: string }>(
    '/api/auth/request-password-reset',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    },
  );
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
