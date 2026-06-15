import { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { Loading } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { registerForNotifications } from '@/lib/notifications';
import { colors } from '@/theme';
import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainNavigator } from './MainNavigator';

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

  useEffect(() => {
    if (session) registerForNotifications().catch(() => undefined);
  }, [session]);

  return (
    <NavigationContainer theme={navTheme} linking={linking as never}>
      {!session ? (
        <AuthNavigator />
      ) : initializing || loading ? (
        <Loading message="Foreverly wird geladen …" />
      ) : families.length === 0 ? (
        <OnboardingNavigator />
      ) : (
        <MainNavigator />
      )}
    </NavigationContainer>
  );
}
