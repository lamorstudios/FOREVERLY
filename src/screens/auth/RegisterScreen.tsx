import { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Button, TextField } from '@/components';
import { BrandHeader } from './BrandHeader';
import { useAuth } from '@/context/AuthContext';
import { friendlyError } from '@/lib/errors';
import { colors, spacing } from '@/theme';
import type { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError(null);
    if (!fullName.trim()) return setError('Bitte gib deinen Namen ein.');
    if (!email.trim()) return setError('Bitte gib deine E-Mail ein.');
    if (password.length < 6)
      return setError('Das Passwort muss mindestens 6 Zeichen haben.');

    setLoading(true);
    try {
      const { needsConfirmation } = await signUp({ email, password, fullName });
      if (needsConfirmation) {
        navigation.navigate('VerifyEmail', { email: email.trim() });
      }
      // andernfalls erkennt der RootNavigator die neue Session automatisch
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen contentStyle={styles.content}>
      <BrandHeader subtitle="Erstelle dein Konto und beginne, Erinnerungen zu bewahren." />
      <View style={styles.form}>
        <TextField
          label="Dein Name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Vor- und Nachname"
          autoCapitalize="words"
        />
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
          placeholder="Mindestens 6 Zeichen"
          secure
          hint="Wähle ein sicheres Passwort, das du dir gut merken kannst."
        />
        {error ? (
          <AppText variant="caption" color={colors.error}>
            {error}
          </AppText>
        ) : null}
        <Button label="Konto erstellen" onPress={handleRegister} loading={loading} />
      </View>
      <Pressable onPress={() => navigation.navigate('Login')} style={styles.footer}>
        <AppText variant="body" color={colors.textSecondary} center>
          Bereits ein Konto?{' '}
          <AppText variant="bodyStrong" color={colors.primary}>
            Anmelden
          </AppText>
        </AppText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingTop: spacing.lg },
  form: { gap: spacing.md },
  footer: { marginTop: spacing.md },
});
