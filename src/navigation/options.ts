import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { colors, typography } from '@/theme';

/** Einheitliche, warme Header-Optik für alle Stacks. */
export const stackScreenOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerShadowVisible: false,
  headerTintColor: colors.primaryDark,
  headerTitleStyle: {
    color: colors.textPrimary,
    fontSize: typography.subheading.fontSize,
    fontWeight: '700',
  },
  headerBackTitle: 'Zurück',
  contentStyle: { backgroundColor: colors.background },
};
