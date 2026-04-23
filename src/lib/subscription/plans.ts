import type { SubscriptionPlan, CreditPackage } from './types'

const ACCOUNT_PRICES: Record<string, Record<number, number>> = {
  basic:   { 2: 49, 3: 69, 4: 89, 5: 109 },
  starter: { 2: 99, 3: 139, 4: 189, 5: 229 },
  premium: { 2: 199, 3: 289, 4: 379, 5: 469 },
}

const EXTRA_ACCOUNT_COST: Record<string, number> = {
  basic: 20,
  starter: 40,
  premium: 90,
}

export const YEARLY_DISCOUNT = 0.70

export function getMonthlyPrice(planId: string, adAccounts: number): number {
  const prices = ACCOUNT_PRICES[planId]
  if (!prices) return 0
  if (prices[adAccounts] !== undefined) return prices[adAccounts]
  const maxDefined = Math.max(...Object.keys(prices).map(Number))
  const basePrice = prices[maxDefined]
  const extra = adAccounts - maxDefined
  return basePrice + extra * (EXTRA_ACCOUNT_COST[planId] || 20)
}

export function getYearlyPrice(planId: string, adAccounts: number): number {
  const monthly = getMonthlyPrice(planId, adAccounts)
  return Math.round(monthly * 12 * YEARLY_DISCOUNT * 100) / 100
}

export function getYearlyMonthlyPrice(planId: string, adAccounts: number): number {
  const yearly = getYearlyPrice(planId, adAccounts)
  return Math.round(yearly / 12 * 100) / 100
}

const BASIC_FEATURES = [
  'Google Reports',
  'Meta Reports',
  'Google Ads',
  'Meta Audience (AI)',
  'Meta Ads',
  '20 Design Credits',
]

const STARTER_FEATURES = [
  'Optimization',
  'Google Reports',
  'Meta Reports',
  'Google Ads',
  'Meta Audience (AI)',
  'Meta Ads',
  '60 Design Credits',
]

const PREMIUM_FEATURES = [
  'AI Strategy (AI)',
  'Optimization',
  'Google Reports',
  'Meta Reports',
  'Google Ads',
  'Meta Ads',
  '100 Design Credits',
]

const ENTERPRISE_FEATURES = [
  'AI Strategy (Unlimited)',
  'Optimization',
  'Meta Ads',
  'Google Ads',
  'Meta Reports',
  'Google Reports',
  'Design',
]

// Display strings — UI callers should prefer t() from useTranslations
export const PLAN_SECTION_TITLES: Record<string, string> = {
  basic: 'Manage from One Panel',
  starter: 'Professional Ad Management',
  premium: 'One-Click Advertising',
  enterprise: 'Unlimited Ad Power',
}

// Display strings — UI callers should prefer t() from useTranslations
export const PLAN_DESCRIPTIONS: Record<string, string> = {
  basic: 'Ad management from a single panel',
  starter: 'Professional ad management',
  premium: 'Fully automated advertising',
  enterprise: 'Enterprise solutions',
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    monthlyPrice: 49,
    yearlyPrice: 411.60,
    features: BASIC_FEATURES,
    adAccountLimit: 2,
    includesOptimization: false,
    aiScanDailyLimit: 3,
    strategyMonthlyLimit: 1,
    trialDays: 0,
  },
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 99,
    yearlyPrice: 831.60,
    features: STARTER_FEATURES,
    adAccountLimit: 2,
    includesOptimization: true,
    aiScanDailyLimit: 3,
    strategyMonthlyLimit: 3,
    trialDays: 0,
  },
  {
    id: 'premium',
    name: 'Premium',
    monthlyPrice: 199,
    yearlyPrice: 1671.60,
    features: PREMIUM_FEATURES,
    adAccountLimit: 2,
    includesOptimization: true,
    aiScanDailyLimit: 10,
    strategyMonthlyLimit: 10,
    trialDays: 14,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: ENTERPRISE_FEATURES,
    adAccountLimit: 6,
    includesOptimization: true,
    aiScanDailyLimit: -1,
    strategyMonthlyLimit: -1,
    trialDays: 14,
  },
]

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'pkg-100', credits: 100, price: 49, label: '100 Credits' },
  { id: 'pkg-500', credits: 500, price: 199, label: '500 Credits', popular: true },
  { id: 'pkg-1000', credits: 1000, price: 349, label: '1,000 Credits' },
]
