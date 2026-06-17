import { View, StyleSheet } from 'react-native';
import { AppText, BrandLogo } from '@/components';
import { colors, spacing } from '@/theme';

/** Warmer Markenkopf für die Authentifizierungs-Bildschirme. */
export function BrandHeader({ subtitle }: { subtitle?: string }) {
  return (
    <View style={styles.wrapper}>
      <BrandLogo />
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
});
