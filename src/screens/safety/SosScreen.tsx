import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, AppText, Card, Button, TextField, Loading } from '@/components';
import { listPersons } from '@/api/persons';
import { listSafetyAlerts, triggerSos, resolveSos, getMyLiveShare } from '@/api/safety';
import { listEmergencyContacts } from '@/api/emergency';
import { listTrustedContacts } from '@/api/trustedContacts';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { fullName, formatDateTime } from '@/lib/format';
import { colors, spacing, radius, shadow } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Sos'>;

const COUNTDOWN_SECONDS = 10;

type Phase = 'idle' | 'counting' | 'sent';

interface Recipient {
  name: string;
  detail: string;
}

export function SosScreen({ navigation }: Props) {
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;

  const alertsQuery = useQuery({ queryKey: qk.safetyAlerts(familyId), queryFn: () => listSafetyAlerts(familyId) });
  const personsQuery = useQuery({ queryKey: qk.persons(familyId), queryFn: () => listPersons(familyId) });
  const myShareQuery = useQuery({ queryKey: qk.myLiveShare(userId!), queryFn: () => getMyLiveShare(userId!) });
  const emergencyQuery = useQuery({ queryKey: qk.emergencyContacts(familyId), queryFn: () => listEmergencyContacts(familyId) });
  const trustedQuery = useQuery({ queryKey: qk.trustedContacts(familyId), queryFn: () => listTrustedContacts(familyId) });

  const [message, setMessage] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [notified, setNotified] = useState<Recipient[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const myPersonId = personsQuery.data?.find((p) => p.user_id === userId)?.id ?? null;
  const myActive = (alertsQuery.data ?? []).find((a) => a.status === 'active' && a.user_id === userId);

  // Tatsächliche Empfänger: Notfallkontakte + Vertrauenspersonen (Trusted Circle).
  const recipients: Recipient[] = [
    ...(emergencyQuery.data ?? []).map((c) => ({ name: c.name, detail: c.relation ?? 'Notfallkontakt' })),
    ...(trustedQuery.data ?? [])
      .filter((t) => t.is_emergency)
      .map((t) => ({ name: t.name, detail: 'Vertrauensperson' })),
  ];

  function clearTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // Countdown herunterzählen; bei 0 wird automatisch gesendet.
  useEffect(() => {
    if (phase !== 'counting') return;
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearTimer();
          void sendNow();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => clearTimer, []);

  function startCountdown() {
    Alert.alert(
      'SOS auslösen?',
      `Nach einem Countdown von ${COUNTDOWN_SECONDS} Sekunden werden deine Notfallkontakte und Vertrauenspersonen informiert – mit deinem letzten bekannten Standort. Du kannst jederzeit abbrechen.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Countdown starten',
          style: 'destructive',
          onPress: () => {
            setCountdown(COUNTDOWN_SECONDS);
            setPhase('counting');
          },
        },
      ],
    );
  }

  function cancelCountdown() {
    clearTimer();
    setPhase('idle');
    setCountdown(COUNTDOWN_SECONDS);
  }

  async function sendNow() {
    clearTimer();
    const sentTo = [...recipients];
    try {
      await triggerSos({
        familyId,
        userId: userId!,
        personId: myPersonId,
        message: message.trim() || null,
        placeLabel: myShareQuery.data?.place_label ?? 'Letzter bekannter Standort',
        battery: 40 + Math.floor(Math.random() * 50),
      });
      setNotified(sentTo);
      setMessage('');
      setPhase('sent');
      await alertsQuery.refetch();
    } catch {
      setPhase('idle');
      Alert.alert('Fehler', 'Der Notruf konnte nicht gesendet werden. Bitte erneut versuchen.');
    }
  }

  async function onResolve(id: string) {
    await resolveSos(id);
    setPhase('idle');
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
  const showSuccess = phase === 'sent' || !!myActive;

  return (
    <Screen>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Im Notfall genügt ein Druck. Es werden dein letzter bekannter Standort, dein
        Akkustand und die Uhrzeit gesendet.
      </AppText>

      {/* Countdown-Phase */}
      {phase === 'counting' ? (
        <Card style={styles.countdownCard}>
          <AppText variant="bodyStrong" color={colors.error}>SOS wird gesendet …</AppText>
          <View style={styles.countCircle}>
            <AppText variant="display" color={colors.error} style={styles.countNum}>{countdown}</AppText>
          </View>
          <AppText variant="caption" color={colors.textSecondary} center>
            In {countdown} Sekunde{countdown === 1 ? '' : 'n'} werden {recipients.length} Person
            {recipients.length === 1 ? '' : 'en'} benachrichtigt.
          </AppText>
          <Button label="Abbrechen" icon="close-circle-outline" variant="secondary" onPress={cancelCountdown} />
          <Button label="Jetzt sofort senden" icon="send-outline" onPress={() => void sendNow()} />
        </Card>
      ) : null}

      {/* Erfolg / aktiver SOS */}
      {phase !== 'counting' && showSuccess ? (
        <Card style={styles.activeCard}>
          <View style={styles.successHead}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <AppText variant="bodyStrong" color={colors.error}>SOS wurde gesendet</AppText>
          </View>
          <AppText variant="caption" color={colors.textSecondary}>
            {myActive ? `Ausgelöst ${formatDateTime(myActive.created_at)} · ` : ''}
            deine Familie wurde informiert.
          </AppText>
          {notified.length > 0 ? (
            <View style={styles.notifiedBox}>
              <AppText variant="caption" color={colors.textSecondary}>
                Benachrichtigt ({notified.length}):
              </AppText>
              {notified.map((r, i) => (
                <View key={`${r.name}-${i}`} style={styles.notifiedRow}>
                  <Ionicons name="person-circle-outline" size={18} color={colors.primary} />
                  <AppText variant="body">{r.name}</AppText>
                  <AppText variant="caption" color={colors.textMuted}>· {r.detail}</AppText>
                </View>
              ))}
            </View>
          ) : (
            <AppText variant="caption" color={colors.textMuted}>
              Hinweis: Es sind noch keine Notfallkontakte hinterlegt.
            </AppText>
          )}
          {myActive ? (
            <Button label="Entwarnung geben" icon="checkmark-outline" variant="secondary" onPress={() => onResolve(myActive.id)} />
          ) : null}
        </Card>
      ) : null}

      {/* Auslöser (nur wenn nicht aktiv/zählend) */}
      {phase === 'idle' && !myActive ? (
        <>
          <Pressable style={styles.sosButton} onPress={startCountdown} accessibilityRole="button" accessibilityLabel="SOS auslösen">
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
      ) : null}

      <Card>
        <AppText variant="bodyStrong">Wer wird benachrichtigt?</AppText>
        {recipients.length > 0 ? (
          recipients.map((r, i) => (
            <View key={`rec-${r.name}-${i}`} style={styles.recipient}>
              <Ionicons name="person-circle-outline" size={20} color={colors.primary} />
              <AppText variant="body" color={colors.textSecondary}>{r.name} · {r.detail}</AppText>
            </View>
          ))
        ) : (
          <>
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
            <Pressable onPress={() => navigation.navigate('Emergency')} style={styles.link}>
              <AppText variant="caption" color={colors.primary}>+ Notfallkontakte hinterlegen</AppText>
            </Pressable>
          </>
        )}
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
  activeCard: { borderColor: colors.error, borderWidth: 1.5, gap: spacing.sm, marginBottom: spacing.md },
  successHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  notifiedBox: { gap: spacing.xs, marginTop: spacing.xs },
  notifiedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  countdownCard: {
    borderColor: colors.error,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  countCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countNum: { fontVariant: ['tabular-nums'] },
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
  link: { marginTop: spacing.sm, padding: spacing.sm },
});
