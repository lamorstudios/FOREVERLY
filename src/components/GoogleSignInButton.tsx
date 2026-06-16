import { useState } from 'react';
import { Alert } from 'react-native';
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
