import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, AppText, Card, Chip, Loading, SectionHeader, EmptyState } from '@/components';
import { getAdminDashboard } from '@/api/admin';
import { qk } from '@/api/queryKeys';
import { useFamily } from '@/context/FamilyContext';
import { formatEuroCents, LIMIT_WARN_RATIO } from '@/lib/billing';
import { colors, spacing, radius } from '@/theme';
import type { SeriesPoint } from '@/types/admin';
import type { HomeStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'AdminDashboard'>;

const nf = new Intl.NumberFormat('de-DE');
const fmt = (n: number) => nf.format(Math.round(n));
const pct = (r: number) => `${(r * 100).toFixed(1).replace('.', ',')} %`;
const gb = (n: number) => `${n.toLocaleString('de-DE', { maximumFractionDigits: 1 })} GB`;

export function AdminDashboardScreen({ navigation }: Props) {
  const { isAdmin } = useFamily();
  void navigation;

  const query = useQuery({
    queryKey: qk.adminDashboard(),
    queryFn: getAdminDashboard,
    enabled: isAdmin,
  });

  // Zugriffsschutz: nur für Betreiber/Admin sichtbar.
  if (!isAdmin) {
    return (
      <Screen>
        <EmptyState
          icon="lock-closed-outline"
          title="Kein Zugriff"
          message="Das Admin-Dashboard ist ausschließlich für den App-Betreiber sichtbar."
        />
      </Screen>
    );
  }

  if (query.isLoading || !query.data) {
    return (
      <Screen>
        <Loading message="Kennzahlen werden geladen …" />
      </Screen>
    );
  }

  const d = query.data;
  const { users, families, growth, content, storage, subscriptions, limits, analytics } = d;
  const maxStorage = Math.max(...storage.perFamily.map((f) => f.gb), 1);
  const tierUsers = (id: string) => subscriptions.tiers.find((t) => t.tier === id)?.users ?? 0;

  return (
    <Screen
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
    >
      <View style={styles.head}>
        <AppText variant="title">Admin Dashboard</AppText>
        <Chip label="Nur Betreiber" selected color={colors.bronze} />
      </View>
      <AppText variant="body" color={colors.textSecondary}>
        Wachstum, Nutzung und Monetarisierung von Foreverly auf einen Blick.
      </AppText>

      {/* Geschäft & Umsatz – wichtigste Kennzahlen auf einen Blick */}
      <SectionHeader title="Überblick" />
      <StatGrid
        items={[
          { label: 'Registrierte Familien', value: fmt(families.families), accent: true },
          { label: 'Aktive Nutzer (Monat)', value: fmt(users.activeMonth) },
          { label: 'Aktive Familien', value: fmt(families.activeFamilies) },
          { label: 'Free-Nutzer', value: fmt(tierUsers('free')) },
          { label: 'Plus-Nutzer', value: fmt(tierUsers('plus')) },
          { label: 'Premium-Nutzer', value: fmt(tierUsers('premium')) },
          { label: 'Genutzter Speicher', value: gb(storage.totalGb) },
          { label: 'Umsatz / Monat', value: formatEuroCents(subscriptions.estimatedMrrCents), accent: true },
          { label: 'Umsatz / Jahr', value: formatEuroCents(subscriptions.estimatedArrCents) },
          { label: 'Conversion Free→Paid', value: pct(subscriptions.freeToPaidConversion), accent: true },
        ]}
      />

      {/* 2 · Nutzerübersicht */}
      <SectionHeader title="Nutzerübersicht" />
      <StatGrid
        items={[
          { label: 'Registriert gesamt', value: fmt(users.total), accent: true },
          { label: 'Aktiv heute', value: fmt(users.activeToday) },
          { label: 'Aktiv diese Woche', value: fmt(users.activeWeek) },
          { label: 'Aktiv diesen Monat', value: fmt(users.activeMonth) },
          { label: 'Neu heute', value: `+${fmt(users.newToday)}` },
          { label: 'Neu diese Woche', value: `+${fmt(users.newWeek)}` },
          { label: 'Neu diesen Monat', value: `+${fmt(users.newMonth)}` },
        ]}
      />

      {/* 3 · Familienübersicht */}
      <SectionHeader title="Familienübersicht" />
      <StatGrid
        items={[
          { label: 'Familien', value: fmt(families.families), accent: true },
          { label: 'Aktive Familien', value: fmt(families.activeFamilies) },
          { label: 'Mitglieder gesamt', value: fmt(families.members) },
          { label: 'Ø Familiengröße', value: families.avgSize.toFixed(1).replace('.', ',') },
        ]}
      />
      <Card>
        <AppText variant="bodyStrong">Größte Familien</AppText>
        {families.largest.map((f) => (
          <RankRow key={f.name} label={f.name} value={`${f.members} Mitglieder`} />
        ))}
      </Card>

      {/* 4 · Wachstum (Einladungen) */}
      <SectionHeader title="Wachstum · Einladungen" />
      <StatGrid
        items={[
          { label: 'Versendet', value: fmt(growth.invitesSent) },
          { label: 'Angenommen', value: fmt(growth.invitesAccepted) },
          { label: 'Conversion Rate', value: pct(growth.conversionRate), accent: true },
        ]}
      />
      <Card>
        <AppText variant="bodyStrong">Top-Familien nach Einladungen</AppText>
        {growth.topFamilies.map((f) => (
          <RankRow key={f.name} label={f.name} value={`${f.invites} Einladungen`} />
        ))}
        <AppText variant="caption" color={colors.textMuted}>
          So stark wächst Foreverly organisch über bestehende Familien.
        </AppText>
      </Card>

      {/* 5 · Inhalte */}
      <SectionHeader title="Inhalte" />
      <StatGrid
        items={[
          { label: 'Fotos', value: fmt(content.photos) },
          { label: 'Videos', value: fmt(content.videos) },
          { label: 'Audios', value: fmt(content.audios) },
          { label: 'Erinnerungen', value: fmt(content.memories) },
          { label: 'Zeitkapseln', value: fmt(content.capsules) },
          { label: 'Familienfilme', value: fmt(content.films) },
        ]}
      />

      {/* 6 · Speicher */}
      <SectionHeader title="Speicher" />
      <StatGrid
        items={[
          { label: 'Gesamt', value: gb(storage.totalGb), accent: true },
          { label: 'Fotos', value: gb(storage.photosGb) },
          { label: 'Videos', value: gb(storage.videosGb) },
          { label: 'Audios', value: gb(storage.audiosGb) },
        ]}
      />
      <Card>
        <AppText variant="bodyStrong">Speicher pro Familie (Top 5)</AppText>
        {storage.perFamily.map((f) => (
          <View key={f.name} style={styles.barRow}>
            <AppText variant="caption" style={styles.barLabel} numberOfLines={1}>{f.name}</AppText>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${(f.gb / maxStorage) * 100}%`, backgroundColor: colors.primary }]} />
            </View>
            <AppText variant="caption" color={colors.textSecondary} style={styles.barValue}>{gb(f.gb)}</AppText>
          </View>
        ))}
        <AppText variant="caption" color={colors.textMuted}>
          Grundlage für die spätere Speicher- und Kostenkontrolle.
        </AppText>
      </Card>

      {/* 7 · Abonnemente */}
      <SectionHeader title="Abonnemente" />
      <View style={styles.tierRow}>
        {subscriptions.tiers.map((t) => (
          <Card key={t.tier} style={styles.tierCard}>
            <AppText variant="bodyStrong">{t.name}</AppText>
            <AppText variant="caption" color={colors.textSecondary}>{t.priceLabel}</AppText>
            <AppText variant="display" color={colors.primaryDark}>{fmt(t.users)}</AppText>
            <AppText variant="caption" color={colors.textMuted}>Nutzer</AppText>
            <AppText variant="caption" color={colors.textSecondary}>{fmt(t.families)} Familien</AppText>
          </Card>
        ))}
      </View>
      <Card>
        <View style={styles.kvRow}>
          <AppText variant="body">Potenzielle Upgrades</AppText>
          <AppText variant="bodyStrong" color={colors.primaryDark}>{fmt(subscriptions.potentialUpgrades)}</AppText>
        </View>
        <View style={styles.kvRow}>
          <AppText variant="body">Umsatz / Monat (MRR)</AppText>
          <AppText variant="bodyStrong" color={colors.success}>{formatEuroCents(subscriptions.estimatedMrrCents)}</AppText>
        </View>
        <View style={styles.kvRow}>
          <AppText variant="body">Umsatz / Jahr (ARR)</AppText>
          <AppText variant="bodyStrong" color={colors.success}>{formatEuroCents(subscriptions.estimatedArrCents)}</AppText>
        </View>
        <View style={styles.kvRow}>
          <AppText variant="body">Conversion Free → Plus/Premium</AppText>
          <AppText variant="bodyStrong" color={colors.primaryDark}>{pct(subscriptions.freeToPaidConversion)}</AppText>
        </View>
        <AppText variant="caption" color={colors.textMuted}>
          Struktur vorbereitet – noch keine echte Abrechnung aktiv.
        </AppText>
      </Card>

      {/* 8 · Free-Limits */}
      <SectionHeader title="Free-Limits" />
      <Card>
        <AppText variant="caption" color={colors.textSecondary}>
          Hinweis ab {Math.round(LIMIT_WARN_RATIO * 100)} % der Obergrenze – noch keine Paywall aktiv.
        </AppText>
        {limits.map((l) => (
          <View key={l.key} style={styles.limitRow}>
            <View style={styles.flex}>
              <AppText variant="bodyStrong">{l.label}</AppText>
              <AppText variant="caption" color={colors.textMuted}>Free-Limit: {fmt(l.limit)}</AppText>
            </View>
            <View style={styles.limitStats}>
              <Chip label={`${fmt(l.familiesNearLimit)} nahe Limit`} color={colors.warning} />
              <Chip label={`${fmt(l.familiesReached)} erreicht`} color={colors.error} />
            </View>
          </View>
        ))}
      </Card>

      {/* 9 · Analytics */}
      <SectionHeader title="Analytics" />
      <BarChart title="Nutzerwachstum" series={analytics.userGrowth} color={colors.primary} />
      <BarChart title="Familienwachstum" series={analytics.familyGrowth} color={colors.relationMarried} />
      <BarChart title="Uploads / Monat" series={analytics.uploads} color={colors.success} />
      <BarChart title="Einladungen / Monat" series={analytics.invites} color={colors.gold} />

      <AppText variant="caption" center color={colors.textMuted} style={styles.foot}>
        Stand: {new Date(d.generatedAt).toLocaleString('de-DE')} · Demo-Werte
      </AppText>
    </Screen>
  );
}

// --- Präsentations-Bausteine ------------------------------------------------

interface StatItem { label: string; value: string; accent?: boolean }

function StatGrid({ items }: { items: StatItem[] }) {
  return (
    <View style={styles.grid}>
      {items.map((it) => (
        <View key={it.label} style={[styles.statTile, it.accent && styles.statTileAccent]}>
          <AppText variant="title" color={it.accent ? colors.primaryDark : colors.textPrimary}>
            {it.value}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>{it.label}</AppText>
        </View>
      ))}
    </View>
  );
}

function RankRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kvRow}>
      <AppText variant="body" style={styles.flex} numberOfLines={1}>{label}</AppText>
      <AppText variant="bodyStrong" color={colors.textSecondary}>{value}</AppText>
    </View>
  );
}

function BarChart({ title, series, color }: { title: string; series: SeriesPoint[]; color: string }) {
  const max = Math.max(...series.map((s) => s.value), 1);
  return (
    <Card>
      <AppText variant="bodyStrong">{title}</AppText>
      <View style={styles.chart}>
        {series.map((s) => (
          <View key={s.label} style={styles.chartCol}>
            <View style={styles.chartBarArea}>
              <View style={[styles.chartBar, { height: `${Math.max(4, (s.value / max) * 100)}%`, backgroundColor: color }]} />
            </View>
            <AppText variant="caption" color={colors.textMuted} numberOfLines={1}>{s.label}</AppText>
          </View>
        ))}
      </View>
      <View style={styles.kvRow}>
        <AppText variant="caption" color={colors.textMuted}>{series[0]?.label}: {fmt(series[0]?.value ?? 0)}</AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {series[series.length - 1]?.label}: {fmt(series[series.length - 1]?.value ?? 0)}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  flex: { flex: 1 },
  foot: { marginTop: spacing.lg },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statTile: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 2,
  },
  statTileAccent: { borderColor: colors.goldSoft, backgroundColor: colors.surfaceAlt },

  kvRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, paddingVertical: 2 },

  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 3 },
  barLabel: { width: 96 },
  barTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  barValue: { width: 64, textAlign: 'right' },

  tierRow: { flexDirection: 'row', gap: spacing.sm },
  tierCard: { flex: 1, alignItems: 'center', gap: 2 },

  limitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  limitStats: { gap: spacing.xs, alignItems: 'flex-end' },

  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, height: 120, marginVertical: spacing.sm },
  chartCol: { flex: 1, alignItems: 'center', gap: spacing.xs },
  chartBarArea: { flex: 1, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  chartBar: { width: '70%', borderTopLeftRadius: radius.sm, borderTopRightRadius: radius.sm, minHeight: 4 },
});
