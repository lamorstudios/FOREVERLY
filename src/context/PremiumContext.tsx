import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type PlanId, type PremiumFeature } from '@/lib/premium';

const KEY = 'foreverly.plan';

interface PremiumContextValue {
  plan: PlanId;
  /** Bezahlter Tarif (Plus oder Premium). */
  isPaid: boolean;
  /** Höchster Tarif (Premium). */
  isPremium: boolean;
  hasFeature: (feature: PremiumFeature) => boolean;
  setPlan: (plan: PlanId) => void;
}

const PremiumContext = createContext<PremiumContextValue | undefined>(undefined);

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [plan, setPlanState] = useState<PlanId>('free');

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v === 'premium' || v === 'plus' || v === 'free') setPlanState(v);
    });
  }, []);

  const setPlan = useCallback((p: PlanId) => {
    setPlanState(p);
    void AsyncStorage.setItem(KEY, p);
  }, []);

  const value = useMemo<PremiumContextValue>(() => {
    return {
      plan,
      isPaid: plan !== 'free',
      isPremium: plan === 'premium',
      // FAMII ist aktuell vollständig kostenlos: ALLE Funktionen sind freigeschaltet,
      // unabhängig vom Tarif. Es gibt keine gesperrten Features.
      hasFeature: (_feature: PremiumFeature) => true,
      setPlan,
    };
  }, [plan, setPlan]);

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium(): PremiumContextValue {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium muss innerhalb von PremiumProvider verwendet werden.');
  return ctx;
}
