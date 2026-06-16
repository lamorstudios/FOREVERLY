import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Card, Button, Chip } from '@/components';
import { usePremium } from '@/context/PremiumContext';
import { PLANS, type Plan, type PlanId } from '@/lib/premium';
import { colors, spacing, radius, withAlpha } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Premium'>;

const FOOTER_NOTES = [
  'Foreverly wächst mit eurer Familie mit.',
  'Kleinere Familien können Foreverly dauerhaft kostenlos nutzen.',
  'Ein Upgrade wird erst benötigt, wenn eure Familie oder euer Speicherbedarf wächst.',
];

export function PremiumScreen(_: Props) {
  const { plan, setPlan } = usePremium();

  return (
    <Screen>
      <View style={styles.hero}>
        <AppText variant="title" center>Wähle euren Tarif</AppText>
        <AppText variant="body" center color={colors.textSecondary}>
          Ein Abo für die ganze Familie – jederzeit änderbar.
        </AppText>
      </View>

      {PLANS.map((p) => (
        <PlanCard key={p.id} plan={p} active={plan === p.id} onSelect={() => setPlan(p.id)} />
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

function PlanCard({ plan, active, onSelect }: { plan: Plan; active: boolean; onSelect: () => void }) {
  const highlight = !!plan.recommended;

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
          <AppText variant="display" color={highlight ? colors.primaryDark : colors.textPrimary}>
            {plan.price}
          </AppText>
        </View>
        <AppText variant="body" color={colors.textSecondary}>{plan.tagline}</AppText>

        <View style={styles.list}>
          {plan.features.map((f) => (
            <View key={f} style={styles.li}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={highlight ? colors.gold : colors.success}
              />
              <AppText variant="body" style={styles.flex}>{f}</AppText>
            </View>
          ))}
        </View>

        {plan.limits ? (
          <View style={styles.limitBox}>
            <AppText variant="caption" color={colors.textMuted} style={styles.limitTitle}>Grenzen</AppText>
            {plan.limits.map((l) => (
              <View key={l} style={styles.li}>
                <Ionicons name="ellipse-outline" size={14} color={colors.textMuted} />
                <AppText variant="caption" color={colors.textSecondary} style={styles.flex}>{l}</AppText>
              </View>
            ))}
          </View>
        ) : null}

        {plan.note ? (
          <View style={[styles.noteBox, highlight && styles.noteBoxHighlight]}>
            <AppText variant="caption" color={highlight ? colors.bronze : colors.textSecondary}>
              {plan.note}
            </AppText>
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
      label={`${planId === 'plus' ? 'Plus' : 'Premium'} wählen`}
      icon="star-outline"
      variant={highlight ? 'primary' : 'secondary'}
      onPress={onSelect}
    />
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },

  cardWrap: { borderRadius: radius.xl },
  cardWrapHighlight: { marginTop: spacing.md },
  glowRing: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
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
  priceRow: { flexDirection: 'row', alignItems: 'flex-end' },
  list: { gap: spacing.xs, marginTop: spacing.sm },
  li: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },

  limitBox: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: spacing.xs,
  },
  limitTitle: { textTransform: 'uppercase', letterSpacing: 0.5 },

  noteBox: {
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noteBoxHighlight: { backgroundColor: withAlpha(colors.gold, 0.12) },

  footer: { gap: spacing.xs, marginTop: spacing.md, paddingHorizontal: spacing.xs },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  demoNote: { marginTop: spacing.md },
});
