import { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Dynamische Expo-Konfiguration.
 *
 * Öffentliche Werte (Supabase URL/Key, Invite-URLs) werden aus den
 * EXPO_PUBLIC_*-Umgebungsvariablen gelesen und über `extra` zur Laufzeit
 * verfügbar gemacht. Sensible Schlüssel (service_role) gehören NICHT hierher.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Foreverly',
  slug: 'foreverly',
  scheme: process.env.EXPO_PUBLIC_APP_SCHEME ?? 'foreverly',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#FBF6EE',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'app.foreverly.mobile',
    infoPlist: {
      NSMicrophoneUsageDescription:
        'Foreverly benötigt Zugriff auf dein Mikrofon, um Audio-Erinnerungen aufzunehmen.',
      NSPhotoLibraryUsageDescription:
        'Foreverly benötigt Zugriff auf deine Fotos, um Familienerinnerungen hochzuladen.',
      NSCameraUsageDescription:
        'Foreverly benötigt Zugriff auf deine Kamera, um Fotos für Erinnerungen aufzunehmen.',
    },
  },
  android: {
    package: 'app.foreverly.mobile',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FBF6EE',
    },
    permissions: ['RECORD_AUDIO', 'READ_EXTERNAL_STORAGE', 'CAMERA'],
  },
  web: {
    bundler: 'metro',
    favicon: './assets/favicon.png',
    output: 'single',
  },
  plugins: [
    'expo-av',
    'expo-image-picker',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#C8A24A',
      },
    ],
  ],
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    inviteBaseUrl:
      process.env.EXPO_PUBLIC_INVITE_BASE_URL ?? 'https://foreverly.app/invite',
    demoMode: process.env.EXPO_PUBLIC_DEMO_MODE,
  },
});
