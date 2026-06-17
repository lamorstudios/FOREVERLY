import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Steuert die App-Einführung (Welcome-Flow + interaktive Tour).
 * Zustände werden lokal gespeichert, sodass die Einführung nur beim ersten
 * Start erscheint – über „Hilfe & Einführung" jederzeit erneut startbar.
 */

const WELCOME_KEY = 'foreverly.welcomeDone';
const TOUR_KEY = 'foreverly.tourDone';

interface OnboardingContextValue {
  ready: boolean;
  welcomeDone: boolean;
  tourDone: boolean;
  completeWelcome: () => void;
  completeTour: () => void;
  /** Komplette Einführung erneut starten (Profil → Hilfe & Einführung). */
  restartIntro: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [welcomeDone, setWelcomeDone] = useState(false);
  const [tourDone, setTourDone] = useState(false);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(WELCOME_KEY), AsyncStorage.getItem(TOUR_KEY)]).then(([w, t]) => {
      setWelcomeDone(w === 'true');
      setTourDone(t === 'true');
      setReady(true);
    });
  }, []);

  const completeWelcome = useCallback(() => {
    setWelcomeDone(true);
    void AsyncStorage.setItem(WELCOME_KEY, 'true');
  }, []);

  const completeTour = useCallback(() => {
    setTourDone(true);
    void AsyncStorage.setItem(TOUR_KEY, 'true');
  }, []);

  const restartIntro = useCallback(() => {
    setWelcomeDone(false);
    setTourDone(false);
    void AsyncStorage.multiRemove([WELCOME_KEY, TOUR_KEY]);
  }, []);

  const value = useMemo<OnboardingContextValue>(
    () => ({ ready, welcomeDone, tourDone, completeWelcome, completeTour, restartIntro }),
    [ready, welcomeDone, tourDone, completeWelcome, completeTour, restartIntro],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding muss innerhalb von OnboardingProvider verwendet werden.');
  return ctx;
}
