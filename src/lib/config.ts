import Constants from 'expo-constants';

type Extra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  inviteBaseUrl?: string;
  demoMode?: string;
  demoSeed?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

// Leere Strings wie „nicht gesetzt" behandeln. WICHTIG: Im CI sind die
// EXPO_PUBLIC_*-Variablen über den `env:`-Block immer definiert – fehlt das
// Secret, ist der Wert ein LEERER String. `??` würde diesen NICHT abfangen,
// sodass ein leerer supabaseUrl an createClient ginge ("supabaseUrl is
// required" → Absturz beim Start). Daher hier auf nicht-leere Werte normalisieren.
const envSupabaseUrl = extra.supabaseUrl && extra.supabaseUrl.trim() ? extra.supabaseUrl.trim() : undefined;
const envSupabaseAnonKey =
  extra.supabaseAnonKey && extra.supabaseAnonKey.trim() ? extra.supabaseAnonKey.trim() : undefined;

/** Sind echte Supabase-Zugangsdaten konfiguriert? */
export const isSupabaseConfigured = !!envSupabaseUrl && !!envSupabaseAnonKey;

/**
 * Demo-Modus: ermöglicht es, die App ohne Supabase-Setup (z.B. im Browser)
 * mit Beispiel-Daten zu testen.
 *
 * Aktiv, wenn EXPO_PUBLIC_DEMO_MODE === 'true' ODER wenn keine Supabase-
 * Zugangsdaten hinterlegt sind.
 */
export const DEMO_MODE =
  extra.demoMode === 'true' || !isSupabaseConfigured;

/**
 * Vorgefertigte Demo-Inhalte (Familie Mielke etc.) werden NUR im expliziten
 * Demo-Modus geladen – über EXPO_PUBLIC_DEMO_SEED=true oder den URL-Parameter
 * ?demo=1. Standardmäßig startet die App leer (wie ein normales Konto) und
 * zeigt vorbereitende Leerzustände.
 */
export const DEMO_SEED = (() => {
  if (extra.demoSeed === 'true') return true;
  if (typeof window !== 'undefined' && window.location && window.location.search) {
    try {
      return new URLSearchParams(window.location.search).get('demo') === '1';
    } catch {
      return false;
    }
  }
  return false;
})();

export const config = {
  // Im Demo-Modus dienen Platzhalterwerte nur dazu, dass der Supabase-Client
  // konstruiert werden kann – er wird dann nie aufgerufen. Es MUSS eine
  // gültige (nicht-leere) URL sein, sonst wirft createClient beim Start.
  supabaseUrl: envSupabaseUrl ?? 'https://demo.foreverly.invalid',
  supabaseAnonKey: envSupabaseAnonKey ?? 'demo-anon-key',
  inviteBaseUrl:
    extra.inviteBaseUrl && extra.inviteBaseUrl.trim()
      ? extra.inviteBaseUrl
      : 'https://foreverly.app/invite',
};
