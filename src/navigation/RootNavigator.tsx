import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { Loading, TourOverlay, AppText } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { useOnboarding } from '@/context/OnboardingContext';
import { registerForNotifications } from '@/lib/notifications';
import { parseInviteCode, setPendingInvite } from '@/lib/pendingInvite';
import { DEMO_MODE, isSupabaseConfigured } from '@/lib/config';
import { colors } from '@/theme';
import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainNavigator } from './MainNavigator';
import { navigationRef } from './navigationRef';
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

  // Harte Sicherung: Egal was hängt – nach 3 s wird nicht mehr „geladen" gezeigt.
  const [forceReady, setForceReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setForceReady(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // Temporäre Debug-Ausgabe zur Loading-/White-Screen-Diagnose.
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log(
      '[Foreverly] authInitializing=%s sessionExists=%s supabaseConfigured=%s demoMode=%s familyLoading=%s introReady=%s families=%d forceReady=%s',
      initializing, !!session, isSupabaseConfigured, DEMO_MODE, loading, introReady, families.length, forceReady,
    );
  }, [initializing, session, loading, introReady, families.length, forceReady]);

  useEffect(() => {
    if (session && !DEMO_MODE) {
      registerForNotifications().catch(() => undefined);
    }
  }, [session]);

  // Einladungscode aus dem Öffnungs-Link merken (übersteht den OAuth-Redirect).
  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      const code = parseInviteCode(url);
      if (code) void setPendingInvite(code);
    });
    const sub = Linking.addEventListener('url', ({ url }) => {
      const code = parseInviteCode(url);
      if (code) void setPendingInvite(code);
    });
    return () => sub.remove();
  }, []);

  const stillLoading = (initializing || loading || !introReady) && !forceReady;
  const inFamily = session && !stillLoading && families.length > 0;
  // Erststart-Einführung: Welcome-Flow, danach interaktive Tour.
  const showWelcome = inFamily && introReady && !welcomeDone;
  const showTour = inFamily && introReady && welcomeDone && !tourDone;

  return (
    <View style={styles.root}>
      <NavigationContainer ref={navigationRef} theme={navTheme} linking={linking as never}>
        {!session ? (
          <AuthNavigator />
        ) : stillLoading ? (
          <View style={styles.diag}>
            <Loading message="Foreverly wird geladen …" />
            <View style={styles.diagBox}>
              <AppText variant="caption" color={colors.textSecondary}>Auth Loading: {String(initializing)}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>Session: {session ? 'vorhanden' : 'nicht vorhanden'}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>Supabase: {isSupabaseConfigured ? 'verbunden' : 'nicht verbunden'}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>Demo Mode: {DEMO_MODE ? 'aktiv' : 'inaktiv'}</AppText>
              <AppText variant="caption" color={colors.textMuted}>family={String(loading)} · intro={String(introReady)} · ready={String(forceReady)}</AppText>
            </View>
          </View>
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
  diag: { flex: 1 },
  diagBox: { position: 'absolute', bottom: 24, left: 16, right: 16, gap: 2, padding: 12, borderRadius: 12, backgroundColor: colors.surfaceAlt },
});
