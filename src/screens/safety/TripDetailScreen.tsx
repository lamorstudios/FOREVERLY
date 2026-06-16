import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, AppText, Card, Button, Chip, Loading } from '@/components';
import { getSafetyTrip, arriveTrip, cancelTrip } from '@/api/safety';
import { qk } from '@/api/queryKeys';
import { fullName, formatRelative, formatDateTime } from '@/lib/format';
import { colors, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import { AUDIENCE_META } from './safetyMeta';

type Props = NativeStackScreenProps<HomeStackParamList, 'TripDetail'>;

const STATUS_LABEL = {
  active: { label: 'Unterwegs', color: colors.primary },
  arrived: { label: 'Sicher angekommen', color: colors.success },
  cancelled: { label: 'Beendet', color: colors.textMuted },
};

export function TripDetailScreen({ route }: Props) {
  const { tripId } = route.params;
  const [busy, setBusy] = useState(false);
  const tripQuery = useQuery({ queryKey: qk.safetyTrip(tripId), queryFn: () => getSafetyTrip(tripId) });
  const t = tripQuery.data;

  if (tripQuery.isLoading || !t) {
    return (
      <Screen tint={colors.tintFamily}>
        <Loading message="Wird geladen …" />
      </Screen>
    );
  }

  const meta = STATUS_LABEL[t.status];
  const name = fullName(t.person?.first_name, t.person?.last_name) || 'Familienmitglied';

  async function onArrive() {
    setBusy(true);
    try {
      await arriveTrip(tripId);
      await tripQuery.refetch();
    } finally {
      setBusy(false);
    }
  }
  async function onCancel() {
    setBusy(true);
    try {
      await cancelTrip(tripId);
      await tripQuery.refetch();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen tint={colors.tintFamily} refreshing={tripQuery.isRefetching} onRefresh={() => void tripQuery.refetch()}>
      <View style={styles.header}>
        <AppText variant="title">{t.kind === 'heimweg' ? 'Heimweg' : 'Sicher angekommen'}</AppText>
        <Chip label={meta.label} selected color={meta.color} />
      </View>

      <Card>
        <AppText variant="bodyStrong">{name} → {t.destination_label}</AppText>
        <View style={styles.line}>
          <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
          <AppText variant="body" color={colors.textSecondary}>
            {t.status === 'arrived'
              ? `Angekommen ${t.arrived_at ? formatDateTime(t.arrived_at) : ''}`
              : t.eta
                ? `Ankunft ca. ${formatRelative(t.eta)}`
                : 'unterwegs'}
          </AppText>
        </View>
        <View style={styles.line}>
          <Ionicons name="refresh-outline" size={18} color={colors.textSecondary} />
          <AppText variant="body" color={colors.textSecondary}>Letzte Aktualisierung {formatRelative(t.updated_at)}</AppText>
        </View>
        {t.battery != null ? (
          <View style={styles.line}>
            <Ionicons name="battery-half-outline" size={18} color={colors.textSecondary} />
            <AppText variant="body" color={colors.textSecondary}>Akku {t.battery}%</AppText>
          </View>
        ) : null}
        <View style={styles.line}>
          <Ionicons name="eye-outline" size={18} color={colors.textSecondary} />
          <AppText variant="body" color={colors.textSecondary}>Sichtbar für {AUDIENCE_META[t.audience]}</AppText>
        </View>
      </Card>

      {t.status === 'active' ? (
        <View style={styles.actions}>
          <Button label="Sicher angekommen" icon="checkmark-done-outline" loading={busy} onPress={onArrive} />
          <Button label="Freigabe beenden" icon="close-outline" variant="ghost" loading={busy} onPress={onCancel} />
        </View>
      ) : t.status === 'arrived' ? (
        <Card style={styles.arrived}>
          <AppText variant="bodyStrong" color={colors.success}>✅ {name} ist sicher angekommen.</AppText>
          <AppText variant="caption" color={colors.textSecondary}>Die Live-Freigabe wurde automatisch beendet.</AppText>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginBottom: spacing.md },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
  arrived: { marginTop: spacing.lg, borderColor: colors.success, borderWidth: 1 },
});
