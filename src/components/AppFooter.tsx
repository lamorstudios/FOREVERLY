import { View, Pressable, StyleSheet, Linking } from 'react-native';
import Constants from 'expo-constants';
import { AppText } from './AppText';
import { OPERATOR, type LegalDoc } from '@/lib/legalContent';
import { BRAND } from '@/lib/brand';
import { colors, spacing } from '@/theme';

/**
 * Dezenter, professioneller Footer: Beta-Hinweis, rechtliche Links,
 * Kontakt, Version und Betreiberhinweis.
 */
export function AppFooter({ onOpenLegal }: { onOpenLegal: (doc: LegalDoc) => void }) {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const links: { label: string; doc: LegalDoc }[] = [
    { label: 'Impressum', doc: 'impressum' },
    { label: 'Datenschutz', doc: 'datenschutz' },
    { label: 'AGB', doc: 'agb' },
  ];

  return (
    <View style={styles.footer}>
      <View style={styles.betaRow}>
        <View style={styles.betaBadge}>
          <AppText variant="caption" color={colors.bronze}>FAMII Beta</AppText>
        </View>
      </View>
      <AppText variant="caption" center color={colors.textMuted}>
        FAMII befindet sich aktuell in der privaten Beta. Vielen Dank für euer Feedback.
      </AppText>

      <View style={styles.links}>
        {links.map((l, i) => (
          <View key={l.doc} style={styles.linkItem}>
            {i > 0 ? <AppText variant="caption" color={colors.textMuted}>·</AppText> : null}
            <Pressable onPress={() => onOpenLegal(l.doc)} hitSlop={8}>
              <AppText variant="caption" color={colors.primary}>{l.label}</AppText>
            </Pressable>
          </View>
        ))}
        <View style={styles.linkItem}>
          <AppText variant="caption" color={colors.textMuted}>·</AppText>
          <Pressable onPress={() => Linking.openURL(`mailto:${OPERATOR.email}`)} hitSlop={8}>
            <AppText variant="caption" color={colors.primary}>Kontakt</AppText>
          </Pressable>
        </View>
      </View>

      <AppText variant="caption" center color={colors.textMuted} style={styles.motto}>
        {BRAND.motto}
      </AppText>
      <AppText variant="caption" center color={colors.textMuted}>
        FAMII · Version {version}
      </AppText>
      <AppText variant="caption" center color={colors.textMuted}>
        {OPERATOR.productLine}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { marginTop: spacing.xl, gap: spacing.xs, alignItems: 'center' },
  motto: { marginTop: spacing.sm, fontStyle: 'italic' },
  betaRow: { alignItems: 'center' },
  betaBadge: {
    backgroundColor: colors.goldSoft,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  linkItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
