import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { config, DEMO_MODE } from '@/lib/config';
import { DEMO_USER_ID } from '@/demo/demoData';

/** Minimale Demo-Sitzung, damit die App ohne echtes Login funktioniert. */
const demoSession = {
  access_token: 'demo',
  refresh_token: 'demo',
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: DEMO_USER_ID,
    email: 'nick@foreverly.demo',
    app_metadata: {},
    user_metadata: { full_name: 'Nick Mielke' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  },
} as unknown as Session;

interface AuthContextValue {
  session: Session | null;
  userId: string | null;
  initializing: boolean;
  signUp: (input: {
    email: string;
    password: string;
    fullName: string;
  }) => Promise<{ needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(
    DEMO_MODE ? demoSession : null,
  );
  const [initializing, setInitializing] = useState(!DEMO_MODE);

  useEffect(() => {
    if (DEMO_MODE) return; // Im Demo-Modus keine echte Auth.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signUp = useCallback<AuthContextValue['signUp']>(
    async ({ email, password, fullName }) => {
      if (DEMO_MODE) {
        setSession(demoSession);
        return { needsConfirmation: false };
      }
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${config.supabaseUrl}/auth/v1/verify`,
        },
      });
      if (error) throw error;
      // Bei aktivierter E-Mail-Bestätigung gibt es noch keine Session.
      return { needsConfirmation: !data.session };
    },
    [],
  );

  const signIn = useCallback<AuthContextValue['signIn']>(
    async (email, password) => {
      if (DEMO_MODE) {
        setSession(demoSession);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
    },
    [],
  );

  const signOut = useCallback(async () => {
    if (DEMO_MODE) {
      setSession(null);
      return;
    }
    await supabase.auth.signOut();
  }, []);

  const resetPassword = useCallback<AuthContextValue['resetPassword']>(
    async (email) => {
      if (DEMO_MODE) return;
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: 'foreverly://reset-password' },
      );
      if (error) throw error;
    },
    [],
  );

  const resendConfirmation = useCallback<
    AuthContextValue['resendConfirmation']
  >(async (email) => {
    if (DEMO_MODE) return;
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
    });
    if (error) throw error;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      userId: session?.user.id ?? null,
      initializing,
      signUp,
      signIn,
      signOut,
      resetPassword,
      resendConfirmation,
    }),
    [session, initializing, signUp, signIn, signOut, resetPassword, resendConfirmation],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden.');
  return ctx;
}
