import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
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
  // Erststart-Einführung: Welcome-Flow, danach interaktive Tour.
  const showWelcome = inFamily && introReady && !welcomeDone;
  const showTour = inFamily && introReady && welcomeDone && !tourDone;

  return (
    <View style={styles.root}>
      <NavigationContainer theme={navTheme} linking={linking as never}>
        {!session ? (
          <AuthNavigator />
        ) : initializing || loading || !introReady ? (
          <Loading message="Foreverly wird geladen …" />
        ) : families.length === 0 ? (
          <OnboardingNavigator />
        ) : (
          <MainNavigator />
        )}
      </NavigationContainer>

      {/* Vollbild-Willkommensflow als Overlay über der App (Erststart) */}
      {showWelcome ? (
        <View style={styles.overlay}>
          <WelcomeFlowScreen onDone={completeWelcome} />
        </View>
      ) : null}

      {/* Interaktive Tour als Overlay – nach dem Welcome-Flow */}
      {showTour ? <TourOverlay onDone={completeTour} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.background, zIndex: 100 },
});
