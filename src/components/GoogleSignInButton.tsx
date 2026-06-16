import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { Button } from './Button';
import { useAuth } from '@/context/AuthContext';
import { friendlyError } from '@/lib/errors';

/** Anmeldung/Registrierung mit Google (Supabase OAuth). */
export function GoogleSignInButton({ label = 'Mit Google anmelden' }: { label?: string }) {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  async function onPress() {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      Alert.alert('Anmeldung fehlgeschlagen', friendlyError(e));
    } finally {
      setLoading(false);
    }
  }

  return <Button label={label} icon="logo-google" variant="secondary" loading={loading} onPress={onPress} />;
}

/** Anmeldung mit Apple (vorbereitet; aktiv, sobald der Provider eingerichtet ist). */
export function AppleSignInButton({ label = 'Mit Apple anmelden' }: { label?: string }) {
  const { signInWithApple } = useAuth();
  const [loading, setLoading] = useState(false);

  // Apple-Login auf Android selten – wir zeigen es auf iOS und im Web.
  if (Platform.OS === 'android') return null;

  async function onPress() {
    setLoading(true);
    try {
      await signInWithApple();
    } catch (e) {
      Alert.alert('Anmeldung fehlgeschlagen', friendlyError(e));
    } finally {
      setLoading(false);
    }
  }

  return <Button label={label} icon="logo-apple" variant="secondary" loading={loading} onPress={onPress} />;
}
