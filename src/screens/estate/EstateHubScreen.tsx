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
  SectionHeader,
  EmptyState,
  Loading,
} from '@/components';
import { listTrustees, getEstateInfo, listEstateCases, reportDeath } from '@/api/estate';
import { getProfile } from '@/api/profiles';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { formatRelative } from '@/lib/format';
import { colors, spacing } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';
import type { EstateCaseStatus } from '@/types/models';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EstateHub'>;

export const CASE_STATUS: Record<EstateCaseStatus, { label: string; color: string }> = {
  awaiting: { label: 'Wartet auf Bestätigungen', color: colors.warning },
  released: { label: 'Freigegeben', color: colors.success },
  rejected: { label: 'Abgelehnt / widerrufen', color: colors.error },
};

export function EstateHubScreen({ navigation }: Props) {
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;

  const trusteesQuery = useQuery({ queryKey: qk.trustees(userId!), queryFn: () => listTrustees(userId!) });
  const estateQuery = useQuery({ queryKey: qk.estateInfo(userId!), queryFn: () => getEstateInfo(userId!) });
  const casesQuery = useQuery({ queryKey: qk.estateCases(familyId), queryFn: () => listEstateCases(familyId) });
  const profileQuery = useQuery({ queryKey: qk.profile(userId!), queryFn: () => getProfile(userId!) });

  const trustees = trusteesQuery.data ?? [];
  const estate = estateQuery.data ?? null;
  const cases = casesQuery.data ?? [];
  const loading = trusteesQuery.isLoading || estateQuery.isLoading || casesQuery.isLoading;

  const [starting, setStarting] = useState(false);
  const required = estate?.required_confirmations ?? 2;
  const filledCount = estate
    ? [estate.has_will, estate.has_patient_decree, estate.has_power_of_attorney, estate.has_insurance].filter(Boolean).length
    : 0;

  function startProcess() {
    if (trustees.length === 0) {
      Alert.alert('Keine Vertrauenspersonen', 'Lege zuerst mindestens eine Vertrauensperson fest.');
      return;
    }
    Alert.alert(
      'Nachlass-Freigabe anstoßen',
      'Damit wird ein behutsamer Freigabeprozess gestartet. Deine Vertrauenspersonen werden um Bestätigung gebeten.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Anstoßen',
          onPress: async () => {
            setStarting(true);
            try {
              const reporter = trustees[0]!;
              const c = await reportDeath({
                familyId,
                subjectUserId: userId!,
                subjectPersonId: null,
                reportedByUserId: userId,
                reportedByTrusteeId: reporter.id,
                reportedByName: reporter.name,
                note: null,
              });
              await casesQuery.refetch();
              navigation.navigate('EstateCase', { caseId: c.id });
            } finally {
              setStarting(false);
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <Screen>
        <Loading message="Wird geladen …" />
      </Screen>
    );
  }

  return (
    <Screen
      refreshing={casesQuery.isRefetching}
      onRefresh={() => {
        void casesQuery.refetch();
        void trusteesQuery.refetch();
        void estateQuery.refetch();
      }}
    >
      <View style={styles.intro}>
        <View style={styles.iconCircle}>
          <Ionicons name="leaf-outline" size={28} color={colors.primary} />
        </View>
        <AppText variant="title">Nachlass & wichtige Hinweise</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Diese Informationen helfen deiner Familie, im Ernstfall Orientierung zu finden. Du
          entscheidest selbst, was hinterlegt und wann es sichtbar wird. Es werden keine Passwörter
          oder Zugangsdaten gespeichert.
        </AppText>
      </View>

      <Card onPress={() => navigation.navigate('EstateInfoForm')}>
        <View style={styles.row}>
          <Ionicons name="document-text-outline" size={28} color={colors.primary} />
          <View style={styles.rowText}>
            <AppText variant="bodyStrong">Deine Hinterlegungen</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {estate ? `${filledCount} von 4 Bereichen hinterlegt` : 'Noch nichts hinterlegt – jetzt beginnen'}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
        </View>
      </Card>

      <Card onPress={() => navigation.navigate('Trustees')}>
        <View style={styles.row}>
          <Ionicons name="shield-checkmark-outline" size={28} color={colors.primary} />
          <View style={styles.rowText}>
            <AppText variant="bodyStrong">Vertrauenspersonen</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {trustees.length > 0 ? `${trustees.length} festgelegt` : 'Noch keine festgelegt'}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
        </View>
      </Card>

      <Card>
        <View style={styles.row}>
          <Ionicons name="people-circle-outline" size={28} color={colors.gold} />
          <View style={styles.rowText}>
            <AppText variant="bodyStrong">Freigabe-Regel</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {required} von {Math.max(trustees.length, required)} Vertrauenspersonen müssen bestätigen
            </AppText>
          </View>
        </View>
      </Card>

      <View style={styles.section}>
        <SectionHeader title="Freigabeprozesse" />
        {cases.length === 0 ? (
          <EmptyState
            icon="heart-outline"
            title="Kein laufender Prozess"
            message="Im Ernstfall kann eine Vertrauensperson hier behutsam eine Nachlass-Freigabe anstoßen."
          />
        ) : (
          cases.map((c) => {
            const meta = CASE_STATUS[c.status];
            const confirms = (c.confirmations ?? []).filter((x) => x.decision === 'confirm').length;
            return (
              <Card key={c.id} onPress={() => navigation.navigate('EstateCase', { caseId: c.id })}>
                <View style={styles.caseHeader}>
                  <AppText variant="bodyStrong" style={styles.flex}>
                    Angestoßen von {c.reported_by_name}
                  </AppText>
                  <Chip label={meta.label} selected color={meta.color} />
                </View>
                <AppText variant="caption" color={colors.textSecondary}>
                  {confirms} von {c.required_confirmations} Bestätigungen · {formatRelative(c.created_at)}
                </AppText>
              </Card>
            );
          })
        )}
      </View>

      <View style={styles.cta}>
        <Button
          label="Nachlass-Freigabe anstoßen"
          icon="heart-outline"
          variant="secondary"
          loading={starting}
          onPress={startProcess}
        />
        <AppText variant="caption" center color={colors.textMuted}>
          Wird im Ernstfall von deinen Vertrauenspersonen ausgelöst und gemeinsam bestätigt.
        </AppText>
      </View>

      <AppText variant="caption" center color={colors.textMuted} style={styles.disclaimer}>
        Bitte hinterlege niemals Passwörter, Bankzugänge, PINs/TANs oder Krypto-Schlüssel.
        Hinterlege nur Orientierungshinweise.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.sm, marginBottom: spacing.md },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { flex: 1, gap: 2 },
  section: { marginTop: spacing.md, gap: spacing.sm },
  caseHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  cta: { marginTop: spacing.lg, gap: spacing.sm },
  disclaimer: { marginTop: spacing.lg, paddingHorizontal: spacing.md },
});
