import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Button, EmptyState } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { friendlyError } from '@/lib/errors';
import { colors, spacing } from '@/theme';
import type { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>;

export function VerifyEmailScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const { resendConfirmation } = useAuth();
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    setInfo(null);
    setLoading(true);
    try {
      await resendConfirmation(email);
      setInfo('Wir haben die Bestätigungs-E-Mail erneut gesendet.');
    } catch (e) {
      setInfo(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen contentStyle={styles.content}>
      <EmptyState
        icon="mail-unread-outline"
        title="Bestätige deine E-Mail"
        message={`Wir haben eine E-Mail an ${email} gesendet. Bitte öffne den Link darin, um dein Konto zu aktivieren.`}
      />
      {info ? (
        <AppText variant="caption" color={colors.success} center>
          {info}
        </AppText>
      ) : null}
      <Button
        label="E-Mail erneut senden"
        variant="secondary"
        onPress={handleResend}
        loading={loading}
      />
      <Button
        label="Zur Anmeldung"
        onPress={() => navigation.navigate('Login')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingTop: spacing.xl },
});
