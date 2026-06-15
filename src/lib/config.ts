import Constants from 'expo-constants';

type Extra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  inviteBaseUrl?: string;
  demoMode?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

/** Sind echte Supabase-Zugangsdaten konfiguriert? */
export const isSupabaseConfigured =
  !!extra.supabaseUrl && !!extra.supabaseAnonKey;

/**
 * Demo-Modus: ermöglicht es, die App ohne Supabase-Setup (z.B. im Browser)
 * mit Beispiel-Daten zu testen.
 *
 * Aktiv, wenn EXPO_PUBLIC_DEMO_MODE === 'true' ODER wenn keine Supabase-
 * Zugangsdaten hinterlegt sind.
 */
export const DEMO_MODE =
  extra.demoMode === 'true' || !isSupabaseConfigured;

export const config = {
  // Im Demo-Modus dienen Platzhalterwerte nur dazu, dass der Supabase-Client
  // konstruiert werden kann – er wird dann nie aufgerufen.
  supabaseUrl: extra.supabaseUrl ?? 'https://demo.foreverly.invalid',
  supabaseAnonKey: extra.supabaseAnonKey ?? 'demo-anon-key',
  inviteBaseUrl: extra.inviteBaseUrl ?? 'https://foreverly.app/invite',
};
