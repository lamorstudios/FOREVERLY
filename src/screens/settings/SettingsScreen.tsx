import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Card, AppFooter } from '@/components';
import { useI18n } from '@/i18n';
import { colors, spacing } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Settings'>;
type IoniconName = keyof typeof Ionicons.glyphMap;
type Target = 'Language' | 'Premium' | 'Roles' | 'NotificationSettings' | 'PrivacyData' | 'Feedback';

export function SettingsScreen({ navigation }: Props) {
  const { t } = useI18n();

  const rows: { icon: IoniconName; title: string; subtitle: string; target: Target }[] = [
    { icon: 'language-outline', title: t('settings.language'), subtitle: t('settings.languageSub'), target: 'Language' },
    { icon: 'cloud-outline', title: t('settings.storage'), subtitle: t('settings.storageSub'), target: 'Premium' },
    { icon: 'people-outline', title: t('settings.roles'), subtitle: t('settings.rolesSub'), target: 'Roles' },
    { icon: 'notifications-outline', title: t('settings.notifications'), subtitle: t('settings.notificationsSub'), target: 'NotificationSettings' },
    { icon: 'shield-checkmark-outline', title: t('settings.privacy'), subtitle: t('settings.privacySub'), target: 'PrivacyData' },
    { icon: 'chatbox-ellipses-outline', title: t('settings.feedback'), subtitle: t('settings.feedbackSub'), target: 'Feedback' },
  ];

  return (
    <Screen>
      <AppText variant="title">{t('settings.title')}</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        {t('settings.intro')}
      </AppText>

      {rows.map((r) => (
        <Card key={r.target} onPress={() => navigation.navigate(r.target)}>
          <View style={styles.row}>
            <View style={styles.iconCircle}><Ionicons name={r.icon} size={24} color={colors.primary} /></View>
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
