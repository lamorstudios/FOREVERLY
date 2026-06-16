import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Card, AppFooter } from '@/components';
import { colors, spacing } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Settings'>;
type IoniconName = keyof typeof Ionicons.glyphMap;
type Target = 'Premium' | 'Roles' | 'NotificationSettings' | 'PrivacyData' | 'Feedback';

export function SettingsScreen({ navigation }: Props) {
  const rows: { icon: IoniconName; title: string; subtitle: string; target: Target; color?: string }[] = [
    { icon: 'cloud-outline', title: 'Speicher', subtitle: 'Speicherplatz eurer Familie', target: 'Premium' },
    { icon: 'people-outline', title: 'Rollen & Rechte', subtitle: 'Wer darf was in der Familie', target: 'Roles' },
    { icon: 'notifications-outline', title: 'Benachrichtigungen', subtitle: 'Push & Hinweise je Kategorie', target: 'NotificationSettings' },
    { icon: 'shield-checkmark-outline', title: 'Datenschutz & Daten', subtitle: 'Export, Löschung, Einwilligungen (DSGVO)', target: 'PrivacyData' },
    { icon: 'chatbox-ellipses-outline', title: 'Feedback senden', subtitle: 'Fehler melden, Wünsche & Ideen', target: 'Feedback' },
  ];

  return (
    <Screen>
      <AppText variant="title">Einstellungen</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Konto, Sicherheit, Speicher und Datenschutz an einem Ort.
      </AppText>

      {rows.map((r) => (
        <Card key={r.target} onPress={() => navigation.navigate(r.target)}>
          <View style={styles.row}>
            <View style={styles.iconCircle}><Ionicons name={r.icon} size={24} color={r.color ?? colors.primary} /></View>
            <View style={styles.rowText}>
              <AppText variant="bodyStrong">{r.title}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>{r.subtitle}</AppText>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
          </View>
        </Card>
      ))}

      <AppFooter onOpenLegal={(doc) => navigation.navigate('Legal', { doc })} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginVertical: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 2 },
});
