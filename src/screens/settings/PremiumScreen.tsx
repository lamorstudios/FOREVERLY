import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Card, Button } from '@/components';
import { usePremium } from '@/context/PremiumContext';
import { planById } from '@/lib/premium';
import {
  FREE_STORAGE_GB,
  STORAGE_LIMIT_NOTICE,
  limitStatus,
  tierById,
} from '@/lib/billing';
import { colors, spacing, radius, withAlpha } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Premium'>;

/**
 * Ruhige Speicher-Seite. FAMII ist vollständig kostenlos – diese Seite wirbt
 * NICHT für Premium. FAMII Plus erscheint nur als Option für ZUSÄTZLICHEN
 * Speicher; der freundliche Upgrade-Hinweis taucht erst auf, wenn das
 * kostenlose Speicherlimit erreicht ist.
 *
 * Demo: Der Speicherstand wird lokal simuliert (deutlich unter dem Limit),
 * damit sich die App kostenlos und unbeschränkt anfühlt.
 */
const DEMO_STORAGE_USED_GB = 0.6;

export function PremiumScreen(_: Props) {
  const { plan, setPlan } = usePremium();
  const plus = planById('plus');

  const limitGb = plan === 'free' ? FREE_STORAGE_GB : tierById(plan).storageGb;
  const status = limitStatus(DEMO_STORAGE_USED_GB, limitGb);
  const usedLabel = DEMO_STORAGE_USED_GB.toLocaleString('de-DE', { maximumFractionDigits: 1 });
  const pct = Math.min(100, Math.round(status.ratio * 100));

  return (
    <Screen>
      <View style={styles.hero}>
        <AppText variant="title" center>Speicher</AppText>
        <AppText variant="body" center color={colors.textSecondary}>
          FAMII ist für eure Familie kostenlos – mit allen Funktionen.
        </AppText>
      </View>

      {/* Aktueller Speicherstand */}
      <Card style={styles.storageCard}>
        <View style={styles.storageHead}>
          <View style={styles.storageIcon}>
            <Ionicons name="cloud-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.flex}>
            <AppText variant="bodyStrong">Euer Speicher</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {usedLabel} von {limitGb} GB genutzt
            </AppText>
          </View>
          <AppText variant="bodyStrong" color={colors.primary}>{pct} %</AppText>
        </View>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${Math.max(2, pct)}%` }]} />
        </View>
      </Card>

      {/* Freundlicher Hinweis NUR bei erreichtem Limit (keine harte Paywall). */}
      {status.reached ? (
        <Card style={styles.notice}>
          <AppText variant="subheading" style={styles.noticeTitle}>{STORAGE_LIMIT_NOTICE.title}</AppText>
          <AppText variant="body" color={colors.textSecondary}>{STORAGE_LIMIT_NOTICE.body}</AppText>
          {plan === 'free' ? (
            <Button label="FAMII Plus freischalten" icon="cloud-upload-outline" onPress={() => setPlan('plus')} />
          ) : null}
        </Card>
      ) : (
        <AppText variant="caption" center color={colors.textMuted} style={styles.reassure}>
          Ihr habt genug Speicher. Ein Upgrade wird erst nötig, wenn der freie
          Speicher voll ist.
        </AppText>
      )}

      {/* FAMII Plus – dezent, nur als Option für mehr Speicher. */}
      <Card style={styles.plusCard}>
        <View style={styles.plusHead}>
          <Ionicons name="heart" size={18} color={colors.gold} />
          <AppText variant="subheading">FAMII Plus</AppText>
        </View>
        <AppText variant="body" color={colors.textSecondary}>
          Mehr Speicher für Fotos, Videos & Dokumente, wenn eure
          Familiengeschichte wächst.
        </AppText>
        <View style={styles.priceRow}>
          <AppText variant="display" color={colors.primaryDark}>{plus.priceMonthly}</AppText>
          <AppText variant="body" color={colors.textSecondary}>oder {plus.priceAnnual}</AppText>
        </View>
        <View style={styles.familyNote}>
          <Ionicons name="people-outline" size={15} color={colors.bronze} />
          <AppText variant="caption" color={colors.bronze} style={styles.flex}>
            Ein Abo gilt für die ganze Familie – nicht pro Person.
          </AppText>
        </View>
        {plan === 'plus' ? (
          <Button label="FAMII Plus aktiv" variant="ghost" icon="checkmark-outline" disabled onPress={() => {}} />
        ) : (
          <Button label="FAMII Plus freischalten" variant="secondary" icon="cloud-upload-outline" onPress={() => setPlan('plus')} />
        )}
      </Card>

      <AppText variant="caption" center color={colors.textMuted} style={styles.demoNote}>
        Demo: Der Tarif wird lokal umgeschaltet. Im Realbetrieb erfolgt die Abwicklung über
        App Store / Google Play.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  flex: { flex: 1 },

  storageCard: { gap: spacing.sm },
  storageHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  storageIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center',
  },
  bar: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4, backgroundColor: colors.primary },

  notice: { marginTop: spacing.md, gap: spacing.sm, backgroundColor: withAlpha(colors.gold, 0.1), borderColor: colors.goldSoft, borderWidth: 1.5 },
  noticeTitle: {},
  reassure: { marginTop: spacing.md },

  plusCard: { marginTop: spacing.lg, gap: spacing.sm },
  plusHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, flexWrap: 'wrap', marginTop: spacing.xs },
  familyNote: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: withAlpha(colors.gold, 0.1), borderRadius: radius.md, padding: spacing.md,
  },

  demoNote: { marginTop: spacing.lg },
});
