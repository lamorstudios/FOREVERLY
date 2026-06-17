import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import {
  Screen,
  AppText,
  Card,
  Button,
  Chip,
  Loading,
  Avatar,
} from '@/components';
import {
  getEstateCase,
  listTrustees,
  getEstateInfo,
  confirmEstateCase,
  revokeEstateCase,
} from '@/api/estate';
import { getProfile } from '@/api/profiles';
import { qk } from '@/api/queryKeys';
import { formatDateTime } from '@/lib/format';
import { colors, spacing } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';
import { CASE_STATUS } from './EstateHubScreen';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EstateCase'>;

export function EstateCaseScreen({ route }: Props) {
  const { caseId } = route.params;
  const [busy, setBusy] = useState<string | null>(null);

  const caseQuery = useQuery({ queryKey: qk.estateCase(caseId), queryFn: () => getEstateCase(caseId) });
  const c = caseQuery.data;
  const subjectUserId = c?.subject_user_id ?? '';

  const trusteesQuery = useQuery({
    queryKey: qk.trustees(subjectUserId),
    queryFn: () => listTrustees(subjectUserId),
    enabled: !!subjectUserId,
  });
  const estateQuery = useQuery({
    queryKey: qk.estateInfo(subjectUserId),
    queryFn: () => getEstateInfo(subjectUserId),
    enabled: !!subjectUserId,
  });
  const subjectQuery = useQuery({
    queryKey: qk.profile(subjectUserId),
    queryFn: () => getProfile(subjectUserId),
    enabled: !!subjectUserId,
  });

  if (caseQuery.isLoading || !c) {
    return (
      <Screen>
        <Loading message="Wird geladen …" />
      </Screen>
    );
  }

  const meta = CASE_STATUS[c.status];
  const confirmations = c.confirmations ?? [];
  const confirms = confirmations.filter((x) => x.decision === 'confirm').length;
  const trustees = (trusteesQuery.data ?? []).filter((t) => t.can_confirm_death);
  const estate = estateQuery.data;
  const released = c.status === 'released';
  const subjectName = subjectQuery.data?.full_name ?? 'Diese Person';

  async function decide(trusteeId: string, name: string, decision: 'confirm' | 'reject') {
    setBusy(trusteeId + decision);
    try {
      await confirmEstateCase({ caseId, trusteeId, confirmerName: name, decision });
      await caseQuery.refetch();
    } finally {
      setBusy(null);
    }
  }

  function onRevoke() {
    Alert.alert(
      'Freigabe widerrufen',
      'Möchtest du diesen Prozess anfechten und stoppen? Das wird protokolliert.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Widerrufen',
          style: 'destructive',
          onPress: async () => {
            await revokeEstateCase(caseId);
            void caseQuery.refetch();
          },
        },
      ],
    );
  }

  return (
    <Screen refreshing={caseQuery.isRefetching} onRefresh={() => void caseQuery.refetch()}>
      <View style={styles.header}>
        <AppText variant="title">Nachlass-Freigabe</AppText>
        <Chip label={meta.label} selected color={meta.color} />
      </View>

      <Card>
        <AppText variant="bodyStrong">Für {subjectName}</AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          Angestoßen von {c.reported_by_name} · {formatDateTime(c.created_at)}
        </AppText>
        {c.note ? (
          <AppText variant="body" style={styles.note}>
            {c.note}
          </AppText>
        ) : null}
        <View style={styles.progress}>
          <Ionicons name="people-circle-outline" size={22} color={colors.primary} />
          <AppText variant="bodyStrong" color={colors.primaryDark}>
            {confirms} von {c.required_confirmations} Bestätigungen
          </AppText>
        </View>
      </Card>

      {!released && c.status !== 'rejected' ? (
        <View style={styles.section}>
          <AppText variant="bodyStrong">Bestätigungen der Vertrauenspersonen</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            Erst wenn {c.required_confirmations} Vertrauenspersonen bestätigen, werden die hinterlegten
            Hinweise sichtbar.
          </AppText>
          {trustees.map((t) => {
            const done = confirmations.find((x) => x.trustee_id === t.id);
            return (
              <Card key={t.id}>
                <View style={styles.titleRow}>
                  <Avatar name={t.name} size={44} />
                  <AppText variant="bodyStrong" numberOfLines={2} style={styles.flex}>
                    {t.name}
                  </AppText>
                </View>
                {done ? (
                  <View style={styles.badgeRow}>
                    <Chip
                      label={done.decision === 'confirm' ? 'Bestätigt' : 'Abgelehnt'}
                      selected
                      color={done.decision === 'confirm' ? colors.success : colors.error}
                    />
                  </View>
                ) : null}
                <AppText variant="caption" color={colors.textSecondary}>
                  {t.relation}
                </AppText>
                {!done ? (
                  <View style={styles.actions}>
                    <Button
                      label="Bestätigen"
                      icon="checkmark-outline"
                      fullWidth={false}
                      loading={busy === t.id + 'confirm'}
                      onPress={() => decide(t.id, t.name, 'confirm')}
                    />
                    <Button
                      label="Ablehnen"
                      variant="ghost"
                      fullWidth={false}
                      loading={busy === t.id + 'reject'}
                      onPress={() => decide(t.id, t.name, 'reject')}
                    />
                  </View>
                ) : null}
              </Card>
            );
          })}
        </View>
      ) : null}

      {released && estate ? (
        <View style={styles.section}>
          <View style={styles.releasedBanner}>
            <Ionicons name="lock-open-outline" size={22} color={colors.success} />
            <AppText variant="bodyStrong" color={colors.success}>
              Nachlassbereich freigegeben
            </AppText>
          </View>

          {estate.farewell_message ? (
            <Card style={styles.farewell}>
              <AppText variant="label" color={colors.gold}>
                Abschiedsworte
              </AppText>
              <AppText variant="body">{estate.farewell_message}</AppText>
            </Card>
          ) : null}

          <Card>
            <AppText variant="bodyStrong" style={styles.cardTitle}>
              Wichtige Hinweise
            </AppText>
            <InfoRow label="Testament" has={estate.has_will} loc={estate.will_location} />
            <InfoRow label="Patientenverfügung" has={estate.has_patient_decree} loc={estate.patient_decree_location} />
            <InfoRow label="Vorsorgevollmacht" has={estate.has_power_of_attorney} loc={estate.power_of_attorney_location} />
            <InfoRow label="Versicherungsunterlagen" has={estate.has_insurance} loc={estate.insurance_location} />
            {estate.contact_person ? <InfoRow label="Kontaktperson" has loc={estate.contact_person} /> : null}
          </Card>

          {estate.personal_notes ? (
            <Card>
              <AppText variant="bodyStrong" style={styles.cardTitle}>
                Persönliche Hinweise
              </AppText>
              <AppText variant="body" color={colors.textSecondary}>
                {estate.personal_notes}
              </AppText>
            </Card>
          ) : null}

          <AppText variant="caption" center color={colors.textMuted}>
            Freigegebene Zeitkapseln können nun von den berechtigten Personen geöffnet werden.
          </AppText>
        </View>
      ) : null}

      {confirmations.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="bodyStrong">Protokoll</AppText>
          {confirmations.map((x) => (
            <View key={x.id} style={styles.logRow}>
              <Ionicons
                name={x.decision === 'confirm' ? 'checkmark-circle' : 'close-circle'}
                size={18}
                color={x.decision === 'confirm' ? colors.success : colors.error}
              />
              <AppText variant="caption" color={colors.textSecondary} style={styles.flex}>
                {x.confirmer_name} {x.decision === 'confirm' ? 'hat bestätigt' : 'hat abgelehnt'} ·{' '}
                {formatDateTime(x.created_at)}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}

      {c.status !== 'rejected' ? (
        <Button
          label="Prozess anfechten / widerrufen"
          icon="alert-circle-outline"
          variant="ghost"
          onPress={onRevoke}
          style={styles.revoke}
        />
      ) : null}
    </Screen>
  );
}

function InfoRow({ label, has, loc }: { label: string; has: boolean; loc: string | null }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons
        name={has ? 'checkmark-circle-outline' : 'ellipse-outline'}
        size={20}
        color={has ? colors.success : colors.textMuted}
      />
      <View style={styles.flex}>
        <AppText variant="body">{label}</AppText>
        {has && loc ? (
          <AppText variant="caption" color={colors.textSecondary}>
            {loc}
          </AppText>
        ) : !has ? (
          <AppText variant="caption" color={colors.textMuted}>
            nicht hinterlegt
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginBottom: spacing.md },
  note: { marginTop: spacing.xs },
  progress: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  section: { marginTop: spacing.lg, gap: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end', marginTop: spacing.sm },
  releasedBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  farewell: { borderColor: colors.goldSoft, borderWidth: 1 },
  cardTitle: { marginBottom: spacing.xs },
  infoRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', paddingVertical: spacing.xs },
  flex: { flex: 1 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 2 },
  revoke: { marginTop: spacing.lg },
});
