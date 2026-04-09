'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { type SubscriptionState, SUBSCRIPTION_DEFAULTS } from '@/lib/subscription/types'
import { getStoredSubscription, setStoredSubscription } from '@/lib/subscription/storage'
import {
  isPaidSubscription,
  isTrialActive,
  getTrialDaysRemaining,
  canUseOptimization,
  hasActiveSubscription,
} from '@/lib/subscription/helpers'

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

  const paid = isPaidSubscription(sub)
  const trial = isTrialActive(sub)
  const trialDays = getTrialDaysRemaining(sub)
  const active = hasActiveSubscription(sub)

  return (
    <SubscriptionContext.Provider value={{
      subscription: sub,
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
