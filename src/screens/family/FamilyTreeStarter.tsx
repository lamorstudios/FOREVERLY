import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components';
import { colors, spacing, radius, withAlpha } from '@/theme';

/**
 * Start-Struktur des Familien-Stammbaums, wenn noch keine Personen vorhanden
 * sind. Statt einer leeren Seite sieht man sofort eine klare, seniorenfreundliche
 * Struktur (Du in der Mitte, darum herum leere Slots zum Hinzufügen). So ist der
 * Stammbaum nie „weg", sondern lädt zum ersten Schritt ein.
 */
const SLOTS: { label: string; icon: keyof typeof Ionicons.glyphMap }[][] = [
  [
    { label: 'Oma', icon: 'person-outline' },
    { label: 'Opa', icon: 'person-outline' },
  ],
  [
    { label: 'Mutter', icon: 'person-outline' },
    { label: 'Vater', icon: 'person-outline' },
  ],
  // „Du" steht als gefüllter Knoten in der Mitte (eigene Zeile).
  [
    { label: 'Bruder', icon: 'person-outline' },
    { label: 'Schwester', icon: 'person-outline' },
  ],
];

export function FamilyTreeStarter({ onAdd }: { onAdd: () => void }) {
  const Slot = ({ label }: { label: string }) => (
    <Pressable style={styles.slot} onPress={onAdd} accessibilityRole="button" accessibilityLabel={`${label} hinzufügen`}>
      <View style={styles.slotCircle}>
        <Ionicons name="add" size={30} color={colors.primary} />
      </View>
      <AppText variant="caption" center style={styles.slotLabel}>{label}</AppText>
      <AppText variant="caption" center color={colors.textMuted}>hinzufügen</AppText>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <AppText variant="bodyStrong" center>Dein Familien-Stammbaum</AppText>
      <AppText variant="caption" center color={colors.textSecondary} style={styles.intro}>
        Beginne mit dir – tippe auf einen Platz, um deine Liebsten nach und nach hinzuzufügen.
      </AppText>

      {/* Großeltern */}
      <View style={styles.row}>
        {SLOTS[0]!.map((s) => <Slot key={s.label} label={s.label} />)}
      </View>
      {/* Eltern */}
      <View style={styles.row}>
        {SLOTS[1]!.map((s) => <Slot key={s.label} label={s.label} />)}
      </View>

      {/* Du (Zentrum) */}
      <View style={styles.row}>
        <View style={styles.slot}>
          <View style={styles.selfCircle}>
            <AppText variant="bodyStrong" center color={colors.textOnAccent}>Du</AppText>
          </View>
          <AppText variant="caption" center style={styles.slotLabel}>Du</AppText>
        </View>
      </View>

      {/* Geschwister */}
      <View style={styles.row}>
        {SLOTS[2]!.map((s) => <Slot key={s.label} label={s.label} />)}
      </View>

      <Pressable style={styles.addBtn} onPress={onAdd} accessibilityRole="button">
        <Ionicons name="person-add-outline" size={20} color={colors.textOnAccent} />
        <AppText variant="label" color={colors.textOnAccent}>Familienmitglied hinzufügen</AppText>
      </Pressable>
    </View>
  );
}

const SLOT_D = 72;

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  intro: { marginBottom: spacing.sm, paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl, flexWrap: 'wrap' },
  slot: { alignItems: 'center', gap: 2, width: 96 },
  slotCircle: {
    width: SLOT_D,
    height: SLOT_D,
    borderRadius: SLOT_D / 2,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: withAlpha(colors.primary, 0.06),
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfCircle: {
    width: SLOT_D,
    height: SLOT_D,
    borderRadius: SLOT_D / 2,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotLabel: { fontWeight: '700', marginTop: 4 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
});
