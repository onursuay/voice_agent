import {
  type CreditState,
  type SubscriptionState,
  type UserProfile,
  type InvoiceInfo,
  type InvoiceRecord,
  CREDIT_DEFAULTS,
  SUBSCRIPTION_DEFAULTS,
  USER_DEFAULTS,
} from './types'

const KEYS = {
  credits: 'va-credits',
  subscription: 'va-subscription',
  profile: 'va-profile',
  invoiceInfo: 'va-invoice-info',
  invoiceHistory: 'va-invoice-history',
} as const

function get<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function set<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* quota exceeded */ }
}

// ── Credits ────────────────────────────────────────────────────
export function getStoredCredits(): CreditState {
  return get(KEYS.credits, CREDIT_DEFAULTS)
}

export function setStoredCredits(state: CreditState): void {
  set(KEYS.credits, state)
}

// ── Subscription ───────────────────────────────────────────────
export function getStoredSubscription(): SubscriptionState {
  return get(KEYS.subscription, SUBSCRIPTION_DEFAULTS)
}

export function setStoredSubscription(state: SubscriptionState): void {
  set(KEYS.subscription, state)
}

// ── Profile ────────────────────────────────────────────────────
export function getStoredProfile(): UserProfile {
  return get(KEYS.profile, USER_DEFAULTS)
}

export function setStoredProfile(profile: UserProfile): void {
  set(KEYS.profile, profile)
}

// ── Invoice Info ───────────────────────────────────────────────
export function getStoredInvoiceInfo(): InvoiceInfo | null {
  return get<InvoiceInfo | null>(KEYS.invoiceInfo, null)
}

export function setStoredInvoiceInfo(info: InvoiceInfo): void {
  set(KEYS.invoiceInfo, info)
}

// ── Invoice History ────────────────────────────────────────────
export function getStoredInvoiceHistory(): InvoiceRecord[] {
  return get<InvoiceRecord[]>(KEYS.invoiceHistory, [])
}

export function addInvoiceRecord(record: InvoiceRecord): void {
  const history = getStoredInvoiceHistory()
  set(KEYS.invoiceHistory, [record, ...history])
}
