import { Pressable, View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { colors, radius, spacing } from '@/theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  color?: string;
  onPress?: () => void;
}

/** Auswahl-Chip, u.a. für Beziehungstypen und Kategorien. */
export function Chip({ label, selected, color, onPress }: ChipProps) {
  const accent = color ?? colors.primary;
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? accent : colors.surface,
          borderColor: selected ? accent : colors.border,
        },
      ]}
    >
      {color ? (
        <View style={[styles.dot, { backgroundColor: color }]} />
      ) : null}
      <AppText
        variant="label"
        color={selected ? colors.textOnAccent : colors.textPrimary}
      >
        {label}
      </AppText>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
