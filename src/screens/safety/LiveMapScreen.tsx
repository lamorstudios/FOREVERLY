import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import {
  Screen,
  AppText,
  Card,
  Button,
  Chip,
  Avatar,
  SectionHeader,
  EmptyState,
  Loading,
} from '@/components';
import { listLiveShares, getMyLiveShare, listSafetyTrips, listSafetyAlerts } from '@/api/safety';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { fullName, formatRelative } from '@/lib/format';
import { colors, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import { STATUS_META, AUDIENCE_META } from './safetyMeta';

type Props = NativeStackScreenProps<HomeStackParamList, 'LiveMap'>;

function Battery({ value }: { value: number | null }) {
  if (value == null) return null;
  const icon = value > 60 ? 'battery-full-outline' : value > 20 ? 'battery-half-outline' : 'battery-dead-outline';
  const color = value > 20 ? colors.textSecondary : colors.error;
  return (
    <View style={styles.battery}>
      <Ionicons name={icon} size={16} color={color} />
      <AppText variant="caption" color={color}>
        {value}%
      </AppText>
    </View>
  );
}

export function LiveMapScreen({ navigation }: Props) {
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;

  const sharesQuery = useQuery({ queryKey: qk.liveShares(familyId), queryFn: () => listLiveShares(familyId) });
  const myShareQuery = useQuery({ queryKey: qk.myLiveShare(userId!), queryFn: () => getMyLiveShare(userId!) });
  const tripsQuery = useQuery({ queryKey: qk.safetyTrips(familyId), queryFn: () => listSafetyTrips(familyId) });
  const alertsQuery = useQuery({ queryKey: qk.safetyAlerts(familyId), queryFn: () => listSafetyAlerts(familyId) });

  const shares = sharesQuery.data ?? [];
  const myShare = myShareQuery.data ?? null;
  const activeTrips = (tripsQuery.data ?? []).filter((t) => t.status === 'active');
  const activeAlerts = (alertsQuery.data ?? []).filter((a) => a.status === 'active');
  const sharingActive = !!myShare?.active;

  if (sharesQuery.isLoading) {
    return (
      <Screen tint={colors.tintFamily}>
        <Loading message="Familienkarte wird geladen …" />
      </Screen>
    );
  }

  return (
    <Screen
      tint={colors.tintFamily}
      refreshing={sharesQuery.isRefetching}
      onRefresh={() => {
        void sharesQuery.refetch();
        void myShareQuery.refetch();
        void tripsQuery.refetch();
        void alertsQuery.refetch();
      }}
    >
      <View style={styles.intro}>
        <AppText variant="title">Familienkarte</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Teile freiwillig deinen Standort – nur mit den Menschen, die du auswählst. Du kannst die
          Freigabe jederzeit beenden.
        </AppText>
      </View>

      {activeAlerts.length > 0 ? (
        <Card onPress={() => navigation.navigate('Sos')} style={styles.sosBanner}>
          <View style={styles.row}>
            <Ionicons name="alert-circle" size={28} color={colors.error} />
            <View style={styles.rowText}>
              <AppText variant="bodyStrong" color={colors.error}>
                Aktiver SOS-Notruf
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {fullName(activeAlerts[0]!.person?.first_name, activeAlerts[0]!.person?.last_name) || 'Jemand'} braucht Hilfe
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
          </View>
        </Card>
      ) : null}

      {/* Meine Freigabe */}
      <Card onPress={() => navigation.navigate('LocationSettings')}>
        <View style={styles.row}>
          <View style={[styles.statusDot, { backgroundColor: sharingActive ? colors.success : colors.textMuted }]} />
          <View style={styles.rowText}>
            <AppText variant="bodyStrong">Mein Standort</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {sharingActive
                ? `Geteilt mit ${AUDIENCE_META[myShare!.audience]} · ${STATUS_META[myShare!.status].label}`
                : 'Nicht geteilt (Standard)'}
            </AppText>
          </View>
          <Chip
            label={sharingActive ? 'Aktiv' : 'Aus'}
            selected={sharingActive}
            color={sharingActive ? colors.success : colors.textMuted}
          />
        </View>
      </Card>

      {/* Schnellaktionen */}
      <View style={styles.actions}>
        <Button
          label="Heimweg teilen"
          icon="navigate-outline"
          variant="secondary"
          onPress={() => navigation.navigate('TripStart', { kind: 'heimweg' })}
        />
        <Button
          label="Sicher angekommen"
          icon="checkmark-done-outline"
          variant="secondary"
          onPress={() => navigation.navigate('TripStart', { kind: 'safe_arrival' })}
        />
        <Button label="SOS-Notfallknopf" icon="warning-outline" variant="danger" onPress={() => navigation.navigate('Sos')} />
      </View>

      {/* Wer teilt gerade */}
      <View style={styles.section}>
        <SectionHeader title="Gerade auf der Karte" />
        {shares.length === 0 ? (
          <EmptyState icon="location-outline" title="Niemand teilt gerade" message="Standortfreigaben erscheinen hier – freiwillig und nur mit Zustimmung." />
        ) : (
          shares.map((s) => {
            const meta = STATUS_META[s.status];
            return (
              <Card key={s.id}>
                <View style={styles.row}>
                  <Avatar uri={s.person?.avatar_url} name={fullName(s.person?.first_name, s.person?.last_name)} size={48} />
                  <View style={styles.rowText}>
                    <AppText variant="bodyStrong" numberOfLines={1}>
                      {meta.emoji} {fullName(s.person?.first_name, s.person?.last_name) || 'Familienmitglied'}
                    </AppText>
                    <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                      {meta.label}
                      {s.place_label ? ` · ${s.place_label}` : ''} · {formatRelative(s.updated_at)}
                    </AppText>
                  </View>
                  <Battery value={s.battery} />
                </View>
              </Card>
            );
          })
        )}
      </View>

      {/* Aktive Heimwege */}
      {activeTrips.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Unterwegs nach Hause" />
          {activeTrips.map((t) => (
            <Card key={t.id} onPress={() => navigation.navigate('TripDetail', { tripId: t.id })}>
              <View style={styles.row}>
                <Ionicons name="navigate" size={24} color={colors.primary} />
                <View style={styles.rowText}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {fullName(t.person?.first_name, t.person?.last_name) || 'Familienmitglied'} → {t.destination_label}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {t.eta ? `Ankunft ca. ${formatRelative(t.eta)}` : 'unterwegs'} · {formatRelative(t.updated_at)}
                  </AppText>
                </View>
                <Battery value={t.battery} />
              </View>
            </Card>
          ))}
        </View>
      ) : null}

      <Card onPress={() => navigation.navigate('TrustedCircle')}>
        <View style={styles.row}>
          <Ionicons name="shield-checkmark-outline" size={26} color={colors.primary} />
          <View style={styles.rowText}>
            <AppText variant="bodyStrong">Trusted Circle</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Nachbarn & Vertrauenspersonen können SOS erhalten und – wenn freigegeben – Standort sehen.
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
        </View>
      </Card>

      <AppText variant="caption" center color={colors.textMuted} style={styles.privacy}>
        🔒 Keine heimliche Ortung. Standort ist standardmäßig aus, jederzeit deaktivierbar und nur für
        die von dir gewählten Personen sichtbar.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.xs, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { flex: 1, gap: 2 },
  statusDot: { width: 14, height: 14, borderRadius: 7 },
  sosBanner: { borderColor: colors.error, borderWidth: 1.5 },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  section: { marginTop: spacing.md, gap: spacing.sm },
  battery: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  privacy: { marginTop: spacing.lg, paddingHorizontal: spacing.md },
});
