import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Card } from '@/components';
import { useI18n, SUPPORTED_LOCALES, PLANNED_LOCALES } from '@/i18n';
import { colors, spacing } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Language'>;

export function LanguageScreen(_: Props) {
  const { locale, setLocale, t } = useI18n();

  return (
    <Screen>
      <AppText variant="title">{t('language.title')}</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        {t('language.intro')}
      </AppText>

      {SUPPORTED_LOCALES.map((l) => {
        const active = l.code === locale;
        return (
          <Card key={l.code} onPress={() => setLocale(l.code)}>
            <View style={styles.row}>
              <View style={styles.iconCircle}>
                <Ionicons name="language-outline" size={22} color={colors.primary} />
              </View>
              <AppText variant="bodyStrong" style={styles.flex}>{l.label}</AppText>
              {active ? (
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              ) : (
                <Ionicons name="ellipse-outline" size={24} color={colors.textMuted} />
              )}
            </View>
          </Card>
        );
      })}

      <AppText variant="caption" color={colors.textMuted} style={styles.note}>
        {t('language.deviceHint')} {t('language.note')}
      </AppText>

      {/* Vorbereitet: weitere Sprachen folgen. */}
      <AppText variant="caption" color={colors.textMuted} style={styles.planned}>
        Bald verfügbar: {PLANNED_LOCALES.join(' · ')}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginVertical: spacing.xs },
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  note: { marginTop: spacing.md },
  planned: { marginTop: spacing.sm },
});
