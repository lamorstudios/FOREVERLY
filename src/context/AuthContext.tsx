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
import { config } from '@/lib/config';

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
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
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
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const resetPassword = useCallback<AuthContextValue['resetPassword']>(
    async (email) => {
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
