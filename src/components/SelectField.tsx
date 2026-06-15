import { useState } from 'react';
import {
  View,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors, radius, spacing } from '@/theme';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  color?: string;
}

interface SelectFieldProps<T extends string> {
  label?: string;
  placeholder?: string;
  value: T | null;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
}

/** Großes Auswahlfeld, das eine modale Liste öffnet (einfach bedienbar). */
export function SelectField<T extends string>({
  label,
  placeholder = 'Bitte auswählen',
  value,
  options,
  onChange,
}: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <View style={styles.wrapper}>
      {label ? (
        <AppText variant="label" color={colors.textSecondary}>
          {label}
        </AppText>
      ) : null}
      <Pressable style={styles.control} onPress={() => setOpen(true)}>
        {selected?.color ? (
          <View style={[styles.dot, { backgroundColor: selected.color }]} />
        ) : null}
        <AppText
          variant="body"
          color={selected ? colors.textPrimary : colors.textMuted}
          style={styles.controlText}
        >
          {selected?.label ?? placeholder}
        </AppText>
        <Ionicons name="chevron-down" size={22} color={colors.textMuted} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet}>
            <AppText variant="subheading" style={styles.sheetTitle}>
              {label ?? 'Auswählen'}
            </AppText>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <Pressable
                    style={styles.option}
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                  >
                    {item.color ? (
                      <View style={[styles.dot, { backgroundColor: item.color }]} />
                    ) : null}
                    <AppText variant="body" style={styles.optionText}>
                      {item.label}
                    </AppText>
                    {isSelected ? (
                      <Ionicons name="checkmark" size={24} color={colors.primary} />
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 58,
  },
  controlText: { flex: 1 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '75%',
  },
  sheetTitle: { marginBottom: spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  optionText: { flex: 1 },
});
