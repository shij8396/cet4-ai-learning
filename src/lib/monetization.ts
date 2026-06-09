export type SubscriptionTier = "FREE" | "PREMIUM" | "VIP";

export interface TierConfig {
  name: string;
  maxDailyAIRequests: number;
  maxDailyWords: number;
  maxDailyReadings: number;
  maxDailyDictations: number;
  maxDailyWritings: number;
  hasAdvancedAnalytics: boolean;
  hasAIWritingCoach: boolean;
  hasPriorityAIQueue: boolean;
  hasExportData: boolean;
  hasCustomStudyPlan: boolean;
  hasAdFree: boolean;
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierConfig> = {
  FREE: {
    name: "免费版",
    maxDailyAIRequests: 20,
    maxDailyWords: 50,
    maxDailyReadings: 3,
    maxDailyDictations: 30,
    maxDailyWritings: 2,
    hasAdvancedAnalytics: false,
    hasAIWritingCoach: false,
    hasPriorityAIQueue: false,
    hasExportData: false,
    hasCustomStudyPlan: false,
    hasAdFree: false,
  },
  PREMIUM: {
    name: "高级版",
    maxDailyAIRequests: 100,
    maxDailyWords: 200,
    maxDailyReadings: 10,
    maxDailyDictations: 100,
    maxDailyWritings: 10,
    hasAdvancedAnalytics: true,
    hasAIWritingCoach: true,
    hasPriorityAIQueue: true,
    hasExportData: true,
    hasCustomStudyPlan: true,
    hasAdFree: true,
  },
  VIP: {
    name: "VIP 版",
    maxDailyAIRequests: 500,
    maxDailyWords: 500,
    maxDailyReadings: 50,
    maxDailyDictations: 300,
    maxDailyWritings: 50,
    hasAdvancedAnalytics: true,
    hasAIWritingCoach: true,
    hasPriorityAIQueue: true,
    hasExportData: true,
    hasCustomStudyPlan: true,
    hasAdFree: true,
  },
};

export function getTierConfig(tier: SubscriptionTier): TierConfig {
  return SUBSCRIPTION_TIERS[tier];
}

export function getUserTier(userId?: string, isAdmin?: boolean): SubscriptionTier {
  if (isAdmin) return "VIP";
  return "FREE";
}

export interface AIUsageTracker {
  date: string;
  count: number;
}

const DAILY_AI_USAGE = new Map<string, AIUsageTracker>();

export function trackAIUsage(userId: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  const tracker = DAILY_AI_USAGE.get(userId);
  const tierConfig = getTierConfig(getUserTier(userId));

  if (!tracker || tracker.date !== today) {
    DAILY_AI_USAGE.set(userId, { date: today, count: 1 });
    return true;
  }

  if (tracker.count >= tierConfig.maxDailyAIRequests) {
    return false;
  }

  tracker.count++;
  return true;
}

export function getRemainingAIUsage(userId: string): number {
  const today = new Date().toISOString().split("T")[0];
  const tracker = DAILY_AI_USAGE.get(userId);
  const tierConfig = getTierConfig(getUserTier(userId));

  if (!tracker || tracker.date !== today) {
    return tierConfig.maxDailyAIRequests;
  }

  return Math.max(0, tierConfig.maxDailyAIRequests - tracker.count);
}

export function resetDailyAIUsage(): void {
  DAILY_AI_USAGE.clear();
}

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  requiresTier: SubscriptionTier;
}

export const FEATURE_FLAGS: FeatureFlag[] = [
  { key: "ai_writing_coach", enabled: true, requiresTier: "PREMIUM" },
  { key: "advanced_analytics", enabled: true, requiresTier: "PREMIUM" },
  { key: "custom_study_plan", enabled: true, requiresTier: "PREMIUM" },
  { key: "data_export", enabled: true, requiresTier: "PREMIUM" },
  { key: "priority_ai_queue", enabled: true, requiresTier: "PREMIUM" },
  { key: "ad_free", enabled: true, requiresTier: "PREMIUM" },
  { key: "dictation", enabled: true, requiresTier: "FREE" },
  { key: "reading", enabled: true, requiresTier: "FREE" },
  { key: "writing", enabled: true, requiresTier: "FREE" },
  { key: "words", enabled: true, requiresTier: "FREE" },
  { key: "ai_coach", enabled: true, requiresTier: "FREE" },
];

export function isFeatureEnabled(featureKey: string, userTier: SubscriptionTier): boolean {
  const flag = FEATURE_FLAGS.find((f) => f.key === featureKey);
  if (!flag || !flag.enabled) return false;

  const tierLevels: Record<SubscriptionTier, number> = {
    FREE: 0,
    PREMIUM: 1,
    VIP: 2,
  };

  return tierLevels[userTier] >= tierLevels[flag.requiresTier];
}

const EXPANSION_HOOKS = {
  payment: {
    endpoint: "/api/payment",
    providers: ["wechat", "alipay", "stripe"],
    implemented: false,
  },
  subscription: {
    endpoint: "/api/subscription",
    plans: ["monthly", "yearly", "lifetime"],
    implemented: false,
  },
  referral: {
    endpoint: "/api/referral",
    reward: "7_days_premium",
    implemented: false,
  },
  notification: {
    provider: "firebase",
    implemented: false,
  },
  analytics: {
    provider: "google_analytics",
    implemented: false,
  },
  social: {
    providers: ["google", "github", "wechat"],
    implemented: false,
  },
};

export function getExpansionStatus() {
  return EXPANSION_HOOKS;
}
