import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components';
import { DEMO_SEED } from '@/lib/config';
import { colors, radius, spacing } from '@/theme';

/** Hinweis nur im expliziten Demo-Modus mit Beispiel-Daten (?demo=1). */
export function DemoBanner() {
  if (!DEMO_SEED) return null;
  return (
    <View style={styles.banner}>
      <Ionicons name="sparkles" size={18} color={colors.primaryDark} />
      <AppText variant="caption" color={colors.primaryDark} style={styles.text}>
        Demo-Modus · Beispiel-Daten der Familie Mielke. Änderungen werden beim
        Neuladen zurückgesetzt.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.goldSoft,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  text: { flex: 1 },
});
