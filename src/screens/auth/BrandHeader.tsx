import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components';
import { colors, spacing } from '@/theme';

/** Warmes Logo/Markenkopf für die Authentifizierungs-Bildschirme. */
export function BrandHeader({ subtitle }: { subtitle?: string }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.badge}>
        <Ionicons name="heart" size={36} color={colors.gold} />
      </View>
      <AppText variant="display" color={colors.primaryDark}>
        Foreverly
      </AppText>
      {subtitle ? (
        <AppText variant="body" color={colors.textSecondary} center>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
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
