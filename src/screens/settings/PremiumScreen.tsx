import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Card, Button, Chip } from '@/components';
import { usePremium } from '@/context/PremiumContext';
import { PLANS, type Plan, type PlanId } from '@/lib/premium';
import { annualSavingsPct, storageUpgradeMessage, tierById, type BillingPeriod } from '@/lib/billing';
import { colors, spacing, radius, withAlpha } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Premium'>;

const FOOTER_NOTES = [
  'Foreverly wächst mit eurer Familie mit.',
  'Kleinere Familien können Foreverly dauerhaft kostenlos nutzen.',
  'Ein Upgrade wird erst benötigt, wenn eure Familie oder euer Speicherbedarf wächst.',
];

// Demo-Speicherstand für den sanften Hinweis (statt harter Paywall).
const DEMO_STORAGE_USED_GB = 4.8;

export function PremiumScreen(_: Props) {
  const { plan, setPlan } = usePremium();
  const [period, setPeriod] = useState<BillingPeriod>('monthly');

  return (
    <Screen>
      <View style={styles.hero}>
        <AppText variant="title" center>Wähle euren Tarif</AppText>
        <AppText variant="body" center color={colors.textSecondary}>
          Ein Abo gilt für die ganze Familie – jederzeit änderbar.
        </AppText>
      </View>

      {/* Sanfter Speicher-Hinweis statt harter Paywall (Free-Nutzer). */}
      {plan === 'free' ? (
        <Card style={styles.notice}>
          <View style={styles.noticeRow}>
            <View style={styles.noticeIcon}>
              <Ionicons name="cloud-outline" size={22} color={colors.bronze} />
            </View>
            <AppText variant="body" style={styles.flex}>
              {storageUpgradeMessage(DEMO_STORAGE_USED_GB, tierById('free').storageGb)}
            </AppText>
          </View>
        </Card>
      ) : null}

      {/* Abrechnungszeitraum */}
      <View style={styles.periodRow}>
        <PeriodChip label="Monatlich" active={period === 'monthly'} onPress={() => setPeriod('monthly')} />
        <PeriodChip label="Jährlich · sparen" active={period === 'annual'} onPress={() => setPeriod('annual')} />
      </View>

      {PLANS.map((p) => (
        <PlanCard key={p.id} plan={p} period={period} active={plan === p.id} onSelect={() => setPlan(p.id)} />
      ))}

      <View style={styles.footer}>
        {FOOTER_NOTES.map((n) => (
          <View key={n} style={styles.footerRow}>
            <Ionicons name="heart" size={14} color={colors.gold} />
            <AppText variant="caption" color={colors.textSecondary} style={styles.flex}>{n}</AppText>
          </View>
        ))}
      </View>

      <AppText variant="caption" center color={colors.textMuted} style={styles.demoNote}>
        Demo: Der Tarif wird lokal umgeschaltet. Im Realbetrieb erfolgt die Abwicklung über
        App Store / Google Play.
      </AppText>
    </Screen>
  );
}

function PeriodChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.periodChip, active && styles.periodChipActive]}
      accessibilityRole="button"
    >
      <AppText variant="label" color={active ? colors.textOnAccent : colors.textSecondary}>{label}</AppText>
    </Pressable>
  );
}

function PlanCard({
  plan,
  period,
  active,
  onSelect,
}: {
  plan: Plan;
  period: BillingPeriod;
  active: boolean;
  onSelect: () => void;
}) {
  const highlight = !!plan.recommended;
  const annual = period === 'annual';
  const showAnnual = annual && !!plan.priceAnnual;
  const price = showAnnual ? plan.priceAnnual! : plan.priceMonthly;
  const savings = annualSavingsPct(plan.id);

  // Dezente Glow-Animation für den empfohlenen Tarif (web-tauglich: JS-Driver).
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!highlight) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1800, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 1800, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glow, highlight]);
  const ringOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.95] });

  return (
    <View style={[styles.cardWrap, highlight && styles.cardWrapHighlight]}>
      {highlight ? (
        <>
          <Animated.View pointerEvents="none" style={[styles.glowRing, { opacity: ringOpacity }]} />
          <View style={styles.badge}>
            <Ionicons name="star" size={13} color={colors.textOnAccent} />
            <AppText variant="label" color={colors.textOnAccent}>{plan.badge}</AppText>
          </View>
        </>
      ) : null}

      <Card style={[styles.card, highlight && styles.cardHighlight, active && styles.cardActive]}>
        <View style={styles.headerRow}>
          <AppText variant="subheading">{plan.name}</AppText>
          {active ? <Chip label="Aktiv" selected color={colors.success} /> : null}
        </View>

        <View style={styles.priceRow}>
          <AppText variant="display" color={highlight ? colors.primaryDark : colors.textPrimary}>{price}</AppText>
          {showAnnual && savings > 0 ? (
            <View style={styles.saveBadge}>
              <AppText variant="caption" color={colors.success}>− {savings} %</AppText>
            </View>
          ) : null}
        </View>
        <AppText variant="body" color={colors.textSecondary}>{plan.tagline}</AppText>

        {/* Eckdaten: Speicher & Mitglieder (die Monetarisierungs-Hebel). */}
        <View style={styles.specRow}>
          <View style={styles.spec}>
            <Ionicons name="cloud-outline" size={16} color={colors.primary} />
            <AppText variant="caption" color={colors.textSecondary}>{plan.storageLabel}</AppText>
          </View>
          <View style={styles.spec}>
            <Ionicons name="people-outline" size={16} color={colors.primary} />
            <AppText variant="caption" color={colors.textSecondary}>{plan.membersLabel}</AppText>
          </View>
        </View>

        <View style={styles.list}>
          {plan.features.map((f) => (
            <View key={f} style={styles.li}>
              <Ionicons name="checkmark-circle" size={18} color={highlight ? colors.gold : colors.success} />
              <AppText variant="body" style={styles.flex}>{f}</AppText>
            </View>
          ))}
        </View>

        {plan.note ? (
          <View style={[styles.noteBox, highlight && styles.noteBoxHighlight]}>
            <AppText variant="caption" color={highlight ? colors.bronze : colors.textSecondary}>{plan.note}</AppText>
          </View>
        ) : null}

        <PlanAction planId={plan.id} active={active} highlight={highlight} onSelect={onSelect} />
      </Card>
    </View>
  );
}

function PlanAction({
  planId,
  active,
  highlight,
  onSelect,
}: {
  planId: PlanId;
  active: boolean;
  highlight: boolean;
  onSelect: () => void;
}) {
  if (active) {
    return <Button label="Aktueller Tarif" variant="ghost" icon="checkmark-outline" disabled onPress={onSelect} />;
  }
  if (planId === 'free') {
    return <Button label="Auf Free wechseln" variant="ghost" icon="arrow-down-outline" onPress={onSelect} />;
  }
  return (
    <Button
      label={`${planId === 'plus' ? 'Plus' : 'Premium'} freischalten`}
      icon="star-outline"
      variant={highlight ? 'primary' : 'secondary'}
      onPress={onSelect}
    />
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  flex: { flex: 1 },

  notice: { backgroundColor: withAlpha(colors.gold, 0.1), borderColor: colors.goldSoft, borderWidth: 1.5 },
  noticeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  noticeIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },

  periodRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    padding: 4,
    gap: 4,
  },
  periodChip: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.pill },
  periodChipActive: { backgroundColor: colors.primary },

  cardWrap: { borderRadius: radius.xl },
  cardWrapHighlight: { marginTop: spacing.md },
  glowRing: {
    position: 'absolute',
    top: -3, left: -3, right: -3, bottom: -3,
    borderRadius: radius.xl + 3,
    borderWidth: 2.5,
    borderColor: colors.gold,
  },
  badge: {
    position: 'absolute',
    top: -14,
    alignSelf: 'center',
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },

  card: { gap: spacing.xs },
  cardHighlight: { borderColor: colors.gold, borderWidth: 1.5, backgroundColor: colors.warmWhite },
  cardActive: { borderColor: colors.success, borderWidth: 1.5 },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  saveBadge: {
    backgroundColor: withAlpha(colors.success, 0.14),
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  specRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.xs },
  spec: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },

  list: { gap: spacing.xs, marginTop: spacing.sm },
  li: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },

  noteBox: { marginTop: spacing.sm, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md },
  noteBoxHighlight: { backgroundColor: withAlpha(colors.gold, 0.12) },

  footer: { gap: spacing.xs, marginTop: spacing.md, paddingHorizontal: spacing.xs },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  demoNote: { marginTop: spacing.md },
});
