import { Text, TextProps, StyleSheet } from 'react-native';
import { colors, typography } from '@/theme';
import type { TypographyVariant } from '@/theme/typography';

interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  center?: boolean;
}

/** Zentrale Textkomponente mit großen, gut lesbaren Standardgrößen. */
export function AppText({
  variant = 'body',
  color = colors.textPrimary,
  center,
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      style={[
        typography[variant],
        { color },
        center && styles.center,
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
});
