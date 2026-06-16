import { View, StyleSheet } from 'react-native';
import { Screen, AppText } from '@/components';
import { LEGAL_CONTENT, type LegalDoc } from '@/lib/legalContent';
import { colors, spacing } from '@/theme';

/**
 * Zeigt einen Rechtstext (Impressum/Datenschutz/AGB/Cookies/Einwilligungen).
 * In Auth- und Profil-Stack registriert; liest `doc` aus den Routen-Parametern.
 */
export function LegalScreen({ route }: { route: { params?: { doc?: LegalDoc } } }) {
  const doc = route.params?.doc ?? 'datenschutz';
  const content = LEGAL_CONTENT[doc];

  return (
    <Screen>
      <AppText variant="title">{content.title}</AppText>
      <AppText variant="caption" color={colors.textMuted}>{content.updated}</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>{content.intro}</AppText>

      {content.sections.map((s, i) => (
        <View key={i} style={styles.section}>
          {s.heading ? <AppText variant="bodyStrong">{s.heading}</AppText> : null}
          <AppText variant="body" color={colors.textSecondary}>{s.body}</AppText>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginVertical: spacing.xs },
  section: { gap: spacing.xs, marginTop: spacing.md },
});
