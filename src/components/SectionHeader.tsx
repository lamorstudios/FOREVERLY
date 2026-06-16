import { View, Pressable, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { colors, spacing } from '@/theme';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Überschrift einer Bereichs-Sektion mit optionaler Aktion. */
export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <AppText variant="heading" style={styles.title} numberOfLines={2}>
        {title}
      </AppText>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={10} style={styles.action}>
          <AppText variant="label" color={colors.primary} numberOfLines={1}>
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: { flexShrink: 1 },
  action: { flexShrink: 0 },
});
