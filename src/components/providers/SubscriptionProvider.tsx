'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { type SubscriptionState, SUBSCRIPTION_DEFAULTS } from '@/lib/subscription/types'
import { getStoredSubscription, setStoredSubscription } from '@/lib/subscription/storage'
import {
  isPaidSubscription,
  isTrialActive,
  getTrialDaysRemaining,
  hasActiveSubscription,
} from '@/lib/subscription/helpers'
import { useAppStore } from '@/lib/store'

interface SubscriptionContextValue {
  subscription: SubscriptionState
  updateSubscription: (partial: Partial<SubscriptionState>) => void
  isPaid: boolean
  isTrialActive: boolean
  trialDaysRemaining: number
  hasSubscription: boolean
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [sub, setSub] = useState<SubscriptionState>(SUBSCRIPTION_DEFAULTS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setSub(getStoredSubscription())
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) setStoredSubscription(sub)
  }, [sub, loaded])

  const updateSubscription = useCallback((partial: Partial<SubscriptionState>) => {
    setSub(prev => ({ ...prev, ...partial }))
  }, [])

  // Organizasyon sahibi (owner) = en yetkili kişi → sınırsız/kurumsal, deneme yok.
  // (Abonelik sistemi şu an kozmetik; owner asla "Deneme" görmez/kısıtlanmaz.)
  const isOwner = useAppStore((s) => s.session?.membership?.role === 'owner')
  const effective: SubscriptionState = isOwner
    ? { ...sub, planId: 'enterprise', status: 'active', trialEndDate: null }
    : sub

  const paid = isPaidSubscription(effective)
  const trial = isTrialActive(effective)
  const trialDays = getTrialDaysRemaining(effective)
  const active = hasActiveSubscription(effective)

  return (
    <SubscriptionContext.Provider value={{
      subscription: effective,
      updateSubscription,
      isPaid: paid,
      isTrialActive: trial,
      trialDaysRemaining: trialDays,
      hasSubscription: active,
    }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider')
  return ctx
}
