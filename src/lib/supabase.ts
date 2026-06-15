import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { config } from './config';

/**
 * Globaler Supabase-Client.
 *
 * - Sitzung wird sicher in AsyncStorage persistiert.
 * - Automatische Token-Erneuerung aktiviert.
 * - `detectSessionInUrl` deaktiviert (kein Browser).
 */
export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
