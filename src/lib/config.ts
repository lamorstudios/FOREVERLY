import Constants from 'expo-constants';

type Extra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  inviteBaseUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Konfiguration fehlt: ${name}. Bitte .env anlegen (siehe .env.example) und die App neu starten.`,
    );
  }
  return value;
}

export const config = {
  supabaseUrl: required(extra.supabaseUrl, 'EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: required(
    extra.supabaseAnonKey,
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  ),
  inviteBaseUrl: extra.inviteBaseUrl ?? 'https://foreverly.app/invite',
};
