import { Text, TextProps, StyleSheet } from 'react-native';
import { colors, typography, useResponsive } from '@/theme';
import type { TypographyVariant } from '@/theme/typography';

interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  center?: boolean;
}

/**
 * Zentrale Textkomponente mit großen, gut lesbaren Standardgrößen.
 * Die Schriftgröße skaliert responsiv (kleinere Displays → kompaktere Größen),
 * damit Überschriften auf kleinen Smartphones das Layout nicht sprengen.
 */
export function AppText({
  variant = 'body',
  color = colors.textPrimary,
  center,
  style,
  ...props
}: AppTextProps) {
  const { fontScale } = useResponsive();
  const base = typography[variant];
  const scaled = {
    fontSize: Math.round(base.fontSize * fontScale),
    lineHeight: Math.round(base.lineHeight * fontScale),
    fontWeight: base.fontWeight,
    letterSpacing: base.letterSpacing,
  };

  return (
    <Text
      style={[scaled, { color }, center && styles.center, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
});
