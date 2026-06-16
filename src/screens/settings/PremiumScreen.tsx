import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Card, Button, Chip } from '@/components';
import { usePremium } from '@/context/PremiumContext';
import { PLANS, PREMIUM_FEATURE_LABELS, type PremiumFeature } from '@/lib/premium';
import { colors, spacing, radius } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Premium'>;

export function PremiumScreen(_: Props) {
  const { plan, isPremium, setPlan } = usePremium();
  const features = Object.keys(PREMIUM_FEATURE_LABELS) as PremiumFeature[];

  return (
    <Screen>
      <View style={styles.hero}>
        <Ionicons name="star" size={32} color={colors.gold} />
        <AppText variant="title" center>Family Premium</AppText>
        <AppText variant="body" center color={colors.textSecondary}>
          Ein Abo für die ganze Familie – schaltet die emotionalsten Funktionen frei.
        </AppText>
      </View>

      {PLANS.map((p) => {
        const active = plan === p.id;
        return (
          <Card key={p.id} style={[styles.plan, active && styles.activePlan]}>
            <View style={styles.planHeader}>
              <AppText variant="subheading">{p.name}</AppText>
              {active ? <Chip label="Aktiv" selected color={colors.success} /> : null}
            </View>
            <AppText variant="heading" color={colors.primary}>{p.price}</AppText>
            <AppText variant="caption" color={colors.textSecondary}>Bis zu {p.maxMembers} Mitglieder · {p.storageGb} GB Speicher</AppText>
            <View style={styles.list}>
              {p.highlights.map((h) => (
                <View key={h} style={styles.li}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  <AppText variant="body" style={styles.flex}>{h}</AppText>
                </View>
              ))}
            </View>
          </Card>
        );
      })}

      <Card>
        <AppText variant="bodyStrong">Premium-Funktionen</AppText>
        <View style={styles.chips}>
          {features.map((f) => <Chip key={f} label={PREMIUM_FEATURE_LABELS[f]} color={colors.gold} />)}
        </View>
      </Card>

      {isPremium ? (
        <Button label="Auf Free zurückstufen" variant="ghost" icon="arrow-down-outline" onPress={() => setPlan('free')} />
      ) : (
        <Button label="Family Premium aktivieren" icon="star-outline" onPress={() => setPlan('premium')} />
      )}
      <AppText variant="caption" center color={colors.textMuted} style={styles.note}>
        Demo: Der Premium-Status wird lokal umgeschaltet. Im Realbetrieb erfolgt die Abwicklung über
        App Store / Google Play.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  plan: { gap: spacing.xs },
  activePlan: { borderColor: colors.success, borderWidth: 1.5 },
  planHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  list: { gap: spacing.xs, marginTop: spacing.sm },
  li: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  note: { marginTop: spacing.md },
});
