export const SUBSCRIPTION_PLAN_IDS = ["free_trial", "starter", "growth"] as const;
export type SubscriptionPlanId = (typeof SUBSCRIPTION_PLAN_IDS)[number];

export const PAID_SUBSCRIPTION_PLAN_IDS = ["starter", "growth"] as const;
export type PaidSubscriptionPlanId = (typeof PAID_SUBSCRIPTION_PLAN_IDS)[number];

export const SUBSCRIPTION_PLANS = {
  free_trial: {
    id: "free_trial",
    trialDays: 14,
    amountUsd: 0,
    productLimit: 50,
    aiMonthlyLimit: 100,
    removeBranding: false,
  },
  starter: {
    id: "starter",
    trialDays: 0,
    amountUsd: 5,
    productLimit: 200,
    aiMonthlyLimit: 1000,
    removeBranding: false,
  },
  growth: {
    id: "growth",
    trialDays: 0,
    amountUsd: 10,
    productLimit: 1000,
    aiMonthlyLimit: 5000,
    removeBranding: true,
  },
} as const satisfies Record<
  SubscriptionPlanId,
  {
    id: SubscriptionPlanId;
    trialDays: number;
    amountUsd: number;
    productLimit: number;
    aiMonthlyLimit: number;
    removeBranding: boolean;
  }
>;

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "payment_pending"
  | "past_due"
  | "expired"
  | "cancelled";

export type SubscriptionCapabilities = {
  productLimit: number;
  aiMonthlyLimit: number;
  removeBranding: boolean;
};

export type SubscriptionSummary = {
  id: string;
  plan: SubscriptionPlanId;
  status: SubscriptionStatus;
  amountUsd: number;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date;
  isAccessActive: boolean;
  capabilities: SubscriptionCapabilities;
};
