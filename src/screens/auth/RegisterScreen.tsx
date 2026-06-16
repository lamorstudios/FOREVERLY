import { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Button, TextField, GoogleSignInButton } from '@/components';
import { BrandHeader } from './BrandHeader';
import { useAuth } from '@/context/AuthContext';
import { friendlyError } from '@/lib/errors';
import { colors, spacing, radius } from '@/theme';
import type { AuthStackParamList } from '@/navigation/types';

function ConsentRow({
  checked,
  onToggle,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable style={consentStyles.row} onPress={onToggle} accessibilityRole="checkbox" accessibilityState={{ checked }}>
      <View style={[consentStyles.box, checked && consentStyles.boxChecked]}>
        {checked ? <Ionicons name="checkmark" size={15} color={colors.textOnAccent} /> : null}
      </View>
      <View style={consentStyles.label}>{children}</View>
    </Pressable>
  );
}

const consentStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.xs },
  box: { width: 22, height: 22, borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  boxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { flex: 1 },
});

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [acceptAgb, setAcceptAgb] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [optNotifications, setOptNotifications] = useState(false);
  const [optLocation, setOptLocation] = useState(false);

  async function handleRegister() {
    setError(null);
    if (!fullName.trim()) return setError('Bitte gib deinen Namen ein.');
    if (!email.trim()) return setError('Bitte gib deine E-Mail ein.');
    if (password.length < 6)
      return setError('Das Passwort muss mindestens 6 Zeichen haben.');
    if (!acceptAgb || !acceptPrivacy)
      return setError('Bitte akzeptiere AGB und Datenschutzerklärung.');

    // Einwilligungen festhalten (Standort/Push standardmäßig AUS, sofern nicht gewählt).
    await AsyncStorage.setItem('foreverly.signupConsents', JSON.stringify({
      agb: true, privacy: true, notifications: optNotifications, location: optLocation, at: new Date().toISOString(),
    }));
    await AsyncStorage.setItem('foreverly.locationConsent', optLocation ? 'true' : 'false');

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
        <View style={styles.consents}>
          <ConsentRow checked={acceptAgb} onToggle={() => setAcceptAgb((v) => !v)}>
            <AppText variant="caption" color={colors.textSecondary}>
              Ich akzeptiere die{' '}
              <AppText variant="caption" color={colors.primary} onPress={() => navigation.navigate('Legal', { doc: 'agb' })}>AGB</AppText>.
            </AppText>
          </ConsentRow>
          <ConsentRow checked={acceptPrivacy} onToggle={() => setAcceptPrivacy((v) => !v)}>
            <AppText variant="caption" color={colors.textSecondary}>
              Ich habe die{' '}
              <AppText variant="caption" color={colors.primary} onPress={() => navigation.navigate('Legal', { doc: 'datenschutz' })}>Datenschutzerklärung</AppText>{' '}gelesen.
            </AppText>
          </ConsentRow>
          <ConsentRow checked={optNotifications} onToggle={() => setOptNotifications((v) => !v)}>
            <AppText variant="caption" color={colors.textSecondary}>Benachrichtigungen erhalten (optional)</AppText>
          </ConsentRow>
          <ConsentRow checked={optLocation} onToggle={() => setOptLocation((v) => !v)}>
            <AppText variant="caption" color={colors.textSecondary}>Standortfreigabe aktivieren (optional)</AppText>
          </ConsentRow>
        </View>

        {error ? (
          <AppText variant="caption" color={colors.error}>
            {error}
          </AppText>
        ) : null}
        <Button label="Konto erstellen" onPress={handleRegister} loading={loading} />
        <View style={styles.divider}>
          <AppText variant="caption" color={colors.textMuted} center>oder</AppText>
        </View>
        <GoogleSignInButton label="Mit Google registrieren" />
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
  consents: { gap: 2 },
  divider: { paddingVertical: spacing.xs },
  footer: { marginTop: spacing.md },
});
