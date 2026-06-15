import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { colors, spacing } from '@/theme';

/** Zentrierter Ladeindikator mit optionalem Text. */
export function Loading({ message }: { message?: string }) {
  return (
    <View style={styles.wrapper}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? (
        <AppText variant="body" color={colors.textSecondary}>
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
});
