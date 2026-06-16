import { useState } from 'react';
import { View, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, AppText, Card, Button, TextField, Loading, Disclaimer } from '@/components';
import { listPersons } from '@/api/persons';
import { listSafetyAlerts, triggerSos, resolveSos, getMyLiveShare } from '@/api/safety';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { fullName, formatDateTime } from '@/lib/format';
import { colors, spacing, radius, shadow } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Sos'>;

export function SosScreen({ navigation }: Props) {
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;

  const alertsQuery = useQuery({ queryKey: qk.safetyAlerts(familyId), queryFn: () => listSafetyAlerts(familyId) });
  const personsQuery = useQuery({ queryKey: qk.persons(familyId), queryFn: () => listPersons(familyId) });
  const myShareQuery = useQuery({ queryKey: qk.myLiveShare(userId!), queryFn: () => getMyLiveShare(userId!) });

  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const myPersonId = personsQuery.data?.find((p) => p.user_id === userId)?.id ?? null;
  const myActive = (alertsQuery.data ?? []).find((a) => a.status === 'active' && a.user_id === userId);

  function onTrigger() {
    Alert.alert(
      'SOS auslösen?',
      'Deine ausgewählten Personen, dein Inner Circle, Trusted Circle und deine Notfallkontakte werden sofort informiert – mit deiner letzten bekannten Position.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'SOS senden',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await triggerSos({
                familyId,
                userId: userId!,
                personId: myPersonId,
                message: message.trim() || null,
                placeLabel: myShareQuery.data?.place_label ?? null,
                battery: 40 + Math.floor(Math.random() * 50),
              });
              setMessage('');
              await alertsQuery.refetch();
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }

  async function onResolve(id: string) {
    await resolveSos(id);
    void alertsQuery.refetch();
  }

  if (alertsQuery.isLoading) {
    return (
      <Screen>
        <Loading message="Wird geladen …" />
      </Screen>
    );
  }

  const recent = (alertsQuery.data ?? []).slice(0, 5);

  return (
    <Screen>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Im Notfall genügt ein Druck. Es werden dein aktueller bzw. letzter bekannter Standort, dein
        Akkustand und die Uhrzeit gesendet.
      </AppText>
      <Disclaimer
        tone="warning"
        icon="alert-circle-outline"
        text="Die SOS-Funktion ersetzt keine Rettungsdienste oder Notrufeinrichtungen. Wähle im Ernstfall den offiziellen Notruf (z. B. 112)."
      />

      {myActive ? (
        <Card style={styles.activeCard}>
          <AppText variant="bodyStrong" color={colors.error}>SOS ist aktiv</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            Ausgelöst {formatDateTime(myActive.created_at)} · deine Familie wurde informiert.
          </AppText>
          <Button label="Entwarnung geben" icon="checkmark-outline" variant="secondary" onPress={() => onResolve(myActive.id)} />
        </Card>
      ) : (
        <>
          <Pressable style={styles.sosButton} onPress={onTrigger} disabled={busy} accessibilityRole="button" accessibilityLabel="SOS auslösen">
            <Ionicons name="warning" size={56} color={colors.textOnAccent} />
            <AppText variant="display" color={colors.textOnAccent}>SOS</AppText>
            <AppText variant="caption" color={colors.textOnAccent}>Antippen, um Hilfe zu rufen</AppText>
          </Pressable>

          <TextField
            label="Kurze Nachricht (optional)"
            value={message}
            onChangeText={setMessage}
            placeholder="z.B. Mir ist schwindelig"
          />
        </>
      )}

      <Card>
        <AppText variant="bodyStrong">Wer wird benachrichtigt?</AppText>
        <View style={styles.recipient}>
          <Ionicons name="heart-circle-outline" size={20} color={colors.error} />
          <AppText variant="body" color={colors.textSecondary}>Inner Circle</AppText>
        </View>
        <View style={styles.recipient}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
          <AppText variant="body" color={colors.textSecondary}>Trusted Circle (Nachbarn, Pflege, Freunde)</AppText>
        </View>
        <View style={styles.recipient}>
          <Ionicons name="call-outline" size={20} color={colors.warning} />
          <AppText variant="body" color={colors.textSecondary}>Notfallkontakte</AppText>
        </View>
      </Card>

      {recent.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="bodyStrong">Verlauf</AppText>
          {recent.map((a) => (
            <Card key={a.id}>
              <View style={styles.row}>
                <Ionicons
                  name={a.status === 'active' ? 'alert-circle' : 'checkmark-circle'}
                  size={22}
                  color={a.status === 'active' ? colors.error : colors.success}
                />
                <View style={styles.rowText}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {fullName(a.person?.first_name, a.person?.last_name) || 'Familienmitglied'}
                    {a.status === 'active' ? ' · aktiv' : ' · entwarnt'}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                    {a.message || a.place_label || 'SOS'} · {formatDateTime(a.created_at)}
                  </AppText>
                </View>
                {a.status === 'active' && a.user_id !== userId ? (
                  <Button label="Erledigt" variant="ghost" fullWidth={false} onPress={() => onResolve(a.id)} />
                ) : null}
              </View>
            </Card>
          ))}
        </View>
      ) : null}

      <Pressable onPress={() => navigation.navigate('Emergency')} style={styles.link}>
        <AppText variant="caption" center color={colors.primary}>
          Notfallkontakte verwalten
        </AppText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: spacing.md },
  activeCard: { borderColor: colors.error, borderWidth: 1.5, gap: spacing.sm },
  sosButton: {
    backgroundColor: colors.error,
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  recipient: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  section: { marginTop: spacing.md, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { flex: 1, gap: 2 },
  link: { marginTop: spacing.lg, padding: spacing.sm },
});
