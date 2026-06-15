import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Button, TextField, EmptyState } from '@/components';
import { BrandHeader } from './BrandHeader';
import { useAuth } from '@/context/AuthContext';
import { friendlyError } from '@/lib/errors';
import { colors, spacing } from '@/theme';
import type { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    setError(null);
    if (!email.trim()) return setError('Bitte gib deine E-Mail ein.');
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Screen contentStyle={styles.content}>
        <EmptyState
          icon="mail-outline"
          title="E-Mail unterwegs"
          message={`Wir haben einen Link zum Zurücksetzen an ${email.trim()} gesendet. Bitte prüfe dein Postfach.`}
          actionLabel="Zurück zur Anmeldung"
          onAction={() => navigation.navigate('Login')}
        />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.content}>
      <BrandHeader subtitle="Wir helfen dir, wieder hineinzukommen." />
      <View style={styles.form}>
        <AppText variant="body" color={colors.textSecondary}>
          Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum
          Zurücksetzen deines Passworts.
        </AppText>
        <TextField
          label="E-Mail"
          value={email}
          onChangeText={setEmail}
          placeholder="name@beispiel.de"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {error ? (
          <AppText variant="caption" color={colors.error}>
            {error}
          </AppText>
        ) : null}
        <Button label="Link senden" onPress={handleReset} loading={loading} />
        <Button
          label="Zurück"
          variant="ghost"
          onPress={() => navigation.goBack()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingTop: spacing.xl },
  form: { gap: spacing.md },
});
