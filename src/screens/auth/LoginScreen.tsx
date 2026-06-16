import { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Button, TextField, GoogleSignInButton } from '@/components';
import { BrandHeader } from './BrandHeader';
import { useAuth } from '@/context/AuthContext';
import { friendlyError } from '@/lib/errors';
import { colors, spacing } from '@/theme';
import type { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(null);
    if (!email || !password) {
      setError('Bitte E-Mail und Passwort eingeben.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen contentStyle={styles.content}>
      <BrandHeader subtitle="Schön, dass du wieder da bist." />
      <View style={styles.form}>
        <TextField
          label="E-Mail"
          value={email}
          onChangeText={setEmail}
          placeholder="name@beispiel.de"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <TextField
          label="Passwort"
          value={password}
          onChangeText={setPassword}
          placeholder="Dein Passwort"
          secure
          autoComplete="password"
        />
        {error ? (
          <AppText variant="caption" color={colors.error}>
            {error}
          </AppText>
        ) : null}
        <Button label="Anmelden" onPress={handleLogin} loading={loading} />
        <View style={styles.divider}>
          <AppText variant="caption" color={colors.textMuted} center>oder</AppText>
        </View>
        <GoogleSignInButton />
        <Pressable
          onPress={() => navigation.navigate('ForgotPassword')}
          style={styles.link}
        >
          <AppText variant="label" color={colors.primary} center>
            Passwort vergessen?
          </AppText>
        </Pressable>
      </View>
      <Pressable onPress={() => navigation.navigate('Register')} style={styles.footer}>
        <AppText variant="body" color={colors.textSecondary} center>
          Noch kein Konto?{' '}
          <AppText variant="bodyStrong" color={colors.primary}>
            Jetzt registrieren
          </AppText>
        </AppText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingTop: spacing.xl },
  form: { gap: spacing.md },
  divider: { paddingVertical: spacing.xs },
  link: { paddingVertical: spacing.sm },
  footer: { marginTop: spacing.md },
});
