import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { config } from './config';

/**
 * Globaler Supabase-Client.
 *
 * - Sitzung wird sicher in AsyncStorage persistiert.
 * - Automatische Token-Erneuerung aktiviert.
 * - `detectSessionInUrl` nur im Web aktiv (für den OAuth-Redirect, z. B. Google).
 */
export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  },
);
