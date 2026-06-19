import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import { Screen, AppText, Card, Chip, IconChip } from '@/components';
import { usePremium } from '@/context/PremiumContext';
import { LEGAL_DOCS } from '@/lib/legalContent';
import { planById } from '@/lib/premium';
import { colors, spacing } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Settings'>;
type IoniconName = keyof typeof Ionicons.glyphMap;
type Target = 'Premium' | 'Roles' | 'NotificationSettings' | 'PrivacyData' | 'Feedback';

export function SettingsScreen({ navigation }: Props) {
  const { plan, isPaid } = usePremium();

  const rows: { icon: IoniconName; title: string; subtitle: string; target: Target; color?: string }[] = [
    { icon: 'star', title: 'Tarif & Premium', subtitle: isPaid ? `Aktiv – ${planById(plan).name}` : 'Free · Plus & Premium ansehen', target: 'Premium', color: colors.accent },
    { icon: 'people', title: 'Rollen & Rechte', subtitle: 'Wer darf was in der Familie', target: 'Roles', color: colors.primary },
    { icon: 'notifications', title: 'Benachrichtigungen', subtitle: 'Push & Hinweise je Kategorie', target: 'NotificationSettings', color: colors.secondary },
    { icon: 'shield-checkmark', title: 'Datenschutz & Daten', subtitle: 'Export, Löschung, Einwilligungen (DSGVO)', target: 'PrivacyData', color: colors.primary },
    { icon: 'chatbox-ellipses', title: 'Feedback senden', subtitle: 'Fehler melden, Wünsche & Ideen', target: 'Feedback', color: colors.primary },
  ];

  return (
    <Screen>
      <AppText variant="title">Einstellungen</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Konto, Sicherheit, Premium und Datenschutz an einem Ort.
      </AppText>

      {rows.map((r) => (
        <Card key={r.target} onPress={() => navigation.navigate(r.target)}>
          <View style={styles.row}>
            <IconChip name={r.icon} color={r.color ?? colors.primary} />
            <View style={styles.rowText}>
              <AppText variant="bodyStrong">{r.title}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>{r.subtitle}</AppText>
            </View>
            {r.target === 'Premium' && isPaid ? <Chip label={planById(plan).name.replace('Foreverly ', '')} selected color={colors.gold} /> : null}
            <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
          </View>
        </Card>
      ))}

      <AppText variant="bodyStrong" style={styles.sectionLabel}>Rechtliches</AppText>
      {LEGAL_DOCS.map((d) => (
        <Card key={d.doc} onPress={() => navigation.navigate('Legal', { doc: d.doc })}>
          <View style={styles.row}>
            <IconChip name={d.icon as keyof typeof Ionicons.glyphMap} color={colors.primary} />
            <AppText variant="bodyStrong" style={styles.rowText}>{d.label}</AppText>
            <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
          </View>
        </Card>
      ))}

      <AppText variant="caption" center color={colors.textMuted} style={styles.version}>
        Foreverly · v{Constants.expoConfig?.version ?? '1.0.0'} · Build{' '}
        {String(Constants.expoConfig?.extra?.buildId ?? 'dev')}
      </AppText>
      <AppText variant="caption" center color={colors.textMuted}>
        Stand: {String(Constants.expoConfig?.extra?.buildTime ?? 'lokal')}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginVertical: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 2 },
  sectionLabel: { marginTop: spacing.lg, marginBottom: spacing.xs },
  version: { marginTop: spacing.xl },
});
