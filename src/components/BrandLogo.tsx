import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { BRAND } from '@/lib/brand';
import { colors, spacing } from '@/theme';

/**
 * FAMII-Logo (Platzhalter-Wortmarke). Später leicht durch eine Grafik
 * austauschbar: hier zentral das Badge + den Schriftzug ersetzen.
 */
export function BrandLogo({ showBadge = true }: { showBadge?: boolean }) {
  return (
    <View style={styles.wrapper}>
      {showBadge ? (
        <View style={styles.badge}>
          <Ionicons name="heart" size={36} color={colors.gold} />
        </View>
      ) : null}
      <AppText variant="display" color={colors.primaryDark}>
        {BRAND.name}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: spacing.sm },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
});
