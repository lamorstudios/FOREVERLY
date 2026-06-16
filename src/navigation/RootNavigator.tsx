import { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { Loading, TourOverlay } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { useOnboarding } from '@/context/OnboardingContext';
import { registerForNotifications } from '@/lib/notifications';
import { DEMO_MODE } from '@/lib/config';
import { colors } from '@/theme';
import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainNavigator } from './MainNavigator';
import { WelcomeFlowScreen } from '@/screens/onboarding/WelcomeFlowScreen';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    primary: colors.primary,
    border: colors.border,
  },
};

const linking = {
  prefixes: [Linking.createURL('/'), 'https://foreverly.app'],
  config: {
    screens: {
      // Einladungslinks: foreverly://invite/CODE bzw. https://foreverly.app/invite/CODE
      JoinFamily: 'invite/:code',
    },
  },
};

/**
 * Entscheidet anhand von Sitzung und Familienzugehörigkeit, welcher
 * Navigationsbereich angezeigt wird:
 *   keine Sitzung      -> Authentifizierung
 *   Sitzung, 0 Familien -> Onboarding (Familie erstellen/beitreten)
 *   Sitzung + Familie   -> Haupt-App
 */
export function RootNavigator() {
  const { session, initializing } = useAuth();
  const { families, loading } = useFamily();
  const { ready: introReady, welcomeDone, tourDone, completeWelcome, completeTour } = useOnboarding();

  useEffect(() => {
    if (session && !DEMO_MODE) {
      registerForNotifications().catch(() => undefined);
    }
  }, [session]);

  const inFamily = session && !initializing && !loading && families.length > 0;

  return (
    <NavigationContainer theme={navTheme} linking={linking as never}>
      {!session ? (
        <AuthNavigator />
      ) : initializing || loading || !introReady ? (
        <Loading message="Foreverly wird geladen …" />
      ) : families.length === 0 ? (
        <OnboardingNavigator />
      ) : !welcomeDone ? (
        // Erststart: Vollbild-Willkommensflow
        <WelcomeFlowScreen onDone={completeWelcome} />
      ) : (
        <MainNavigator />
      )}
      {/* Interaktive Tour als Overlay über der App – nach dem Welcome-Flow */}
      {inFamily && welcomeDone && !tourDone ? <TourOverlay onDone={completeTour} /> : null}
    </NavigationContainer>
  );
}
