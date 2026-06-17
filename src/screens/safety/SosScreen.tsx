import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

type Phase = 'idle' | 'confirm' | 'counting' | 'sent';

interface Recipient {
  name: string;
  detail: string;
}

interface SentInfo {
  time: string;
  locationStatus: string;
  recipients: Recipient[];
}

export function SosScreen({ navigation }: Props) {
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();

  const alertsQuery = useQuery({ queryKey: qk.safetyAlerts(familyId), queryFn: () => listSafetyAlerts(familyId) });
  const personsQuery = useQuery({ queryKey: qk.persons(familyId), queryFn: () => listPersons(familyId) });
  const myShareQuery = useQuery({ queryKey: qk.myLiveShare(userId!), queryFn: () => getMyLiveShare(userId!) });
  const emergencyQuery = useQuery({ queryKey: qk.emergencyContacts(familyId), queryFn: () => listEmergencyContacts(familyId) });
  const trustedQuery = useQuery({ queryKey: qk.trustedContacts(familyId), queryFn: () => listTrustedContacts(familyId) });

  const [message, setMessage] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [sent, setSent] = useState<SentInfo | null>(null);
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

  // Standortstatus (kein echtes GPS in der Demo → letzter bekannter / nicht verfügbar).
  const placeLabel = myShareQuery.data?.place_label ?? null;
  const locationStatus = placeLabel ? `Letzter bekannter Standort: ${placeLabel}` : 'Standort nicht verfügbar';

  function clearTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

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
    setCountdown(COUNTDOWN_SECONDS);
    setPhase('counting');
  }

  function cancel() {
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
        placeLabel: placeLabel ?? 'Standort nicht verfügbar',
        battery: 40 + Math.floor(Math.random() * 50),
      });
      setSent({ time: new Date().toISOString(), locationStatus, recipients: sentTo });
      setMessage('');
      setPhase('sent');
      await alertsQuery.refetch();
      // Notification Center aktualisieren (Sender- & Empfänger-Hinweis wurden erzeugt).
      queryClient.invalidateQueries({ queryKey: qk.notifications(familyId) });
    } catch {
      setPhase('idle');
      setSent(null);
    }
  }

  async function onResolve(id: string) {
    await resolveSos(id);
    setPhase('idle');
    setSent(null);
    void alertsQuery.refetch();
    queryClient.invalidateQueries({ queryKey: qk.notifications(familyId) });
  }

  if (alertsQuery.isLoading) {
    return (
      <Screen>
        <Loading message="Wird geladen …" />
      </Screen>
    );
  }

  const recent = (alertsQuery.data ?? []).slice(0, 5);
  const showSuccess = phase === 'sent' || (!!myActive && phase === 'idle');

  return (
    <Screen>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Im Notfall genügt ein Druck. Es werden dein Standortstatus, deine Nachricht
        und die Uhrzeit gesendet.
      </AppText>

      {/* Sicherheitsabfrage (In-Screen, funktioniert auch im Web) */}
      {phase === 'confirm' ? (
        <Card style={styles.dialogCard}>
          <View style={styles.dialogHead}>
            <Ionicons name="warning" size={24} color={colors.error} />
            <AppText variant="subheading" color={colors.error}>SOS senden?</AppText>
          </View>
          <AppText variant="body" color={colors.textSecondary}>
            Deine Vertrauenspersonen werden benachrichtigt. Dein aktueller oder letzter
            bekannter Standort, Uhrzeit und optionale Nachricht werden mitgesendet.
          </AppText>
          <Button label="SOS senden" icon="send" onPress={startCountdown} />
          <Button label="Abbrechen" variant="secondary" icon="close-outline" onPress={cancel} />
        </Card>
      ) : null}

      {/* Countdown */}
      {phase === 'counting' ? (
        <Card style={styles.dialogCard}>
          <AppText variant="bodyStrong" color={colors.error}>SOS wird gesendet …</AppText>
          <View style={styles.countCircle}>
            <AppText variant="display" color={colors.error} style={styles.countNum}>{countdown}</AppText>
          </View>
          <AppText variant="body" center color={colors.textSecondary}>
            SOS wird in {countdown} Sekunde{countdown === 1 ? '' : 'n'} gesendet.
          </AppText>
          <Button label="Abbrechen" icon="close-circle-outline" variant="secondary" onPress={cancel} />
          <Button label="Jetzt sofort senden" icon="send-outline" onPress={() => void sendNow()} />
        </Card>
      ) : null}

      {/* Erfolgsmeldung */}
      {phase !== 'counting' && phase !== 'confirm' && showSuccess ? (
        <Card style={styles.successCard}>
          <View style={styles.dialogHead}>
            <Ionicons name="checkmark-circle" size={26} color={colors.success} />
            <AppText variant="subheading" color={colors.error}>SOS wurde gesendet.</AppText>
          </View>
          <AppText variant="body">Deine Vertrauenspersonen wurden benachrichtigt.</AppText>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
            <AppText variant="body" color={colors.textSecondary}>
              {formatDateTime(sent?.time ?? myActive?.created_at ?? new Date().toISOString())}
            </AppText>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
            <AppText variant="body" color={colors.textSecondary} style={styles.flex}>
              {sent?.locationStatus ?? locationStatus}
            </AppText>
          </View>

          <View style={styles.notifiedBox}>
            <AppText variant="bodyStrong">
              Benachrichtigte Kontakte ({(sent?.recipients ?? recipients).length})
            </AppText>
            {(sent?.recipients ?? recipients).length > 0 ? (
              (sent?.recipients ?? recipients).map((r, i) => (
                <View key={`${r.name}-${i}`} style={styles.infoRow}>
                  <Ionicons name="person-circle-outline" size={18} color={colors.primary} />
                  <AppText variant="body">{r.name}</AppText>
                  <AppText variant="caption" color={colors.textMuted}>· {r.detail}</AppText>
                </View>
              ))
            ) : (
              <AppText variant="caption" color={colors.textMuted}>
                Noch keine Notfallkontakte hinterlegt – die Familie wurde im
                Benachrichtigungscenter informiert.
              </AppText>
            )}
          </View>

          {myActive ? (
            <Button label="Entwarnung geben" icon="checkmark-outline" variant="secondary" onPress={() => onResolve(myActive.id)} />
          ) : null}
          <Pressable onPress={() => navigation.navigate('Notifications')} style={styles.link}>
            <AppText variant="caption" center color={colors.primary}>Im Benachrichtigungscenter ansehen</AppText>
          </Pressable>
        </Card>
      ) : null}

      {/* Auslöser */}
      {phase === 'idle' && !myActive ? (
        <>
          <Pressable
            onPress={() => setPhase('confirm')}
            accessibilityRole="button"
            accessibilityLabel="SOS auslösen"
            style={({ pressed }) => [styles.sosButton, pressed && styles.sosButtonPressed]}
          >
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

      {/* Wer wird benachrichtigt? (vorab) */}
      {phase === 'idle' ? (
        <Card>
          <AppText variant="bodyStrong">Wer wird benachrichtigt?</AppText>
          {recipients.length > 0 ? (
            recipients.map((r, i) => (
              <View key={`rec-${r.name}-${i}`} style={styles.infoRow}>
                <Ionicons name="person-circle-outline" size={20} color={colors.primary} />
                <AppText variant="body" color={colors.textSecondary}>{r.name} · {r.detail}</AppText>
              </View>
            ))
          ) : (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="heart-circle-outline" size={20} color={colors.error} />
                <AppText variant="body" color={colors.textSecondary}>Inner Circle</AppText>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
                <AppText variant="body" color={colors.textSecondary}>Trusted Circle (Nachbarn, Pflege, Freunde)</AppText>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color={colors.warning} />
                <AppText variant="body" color={colors.textSecondary}>Notfallkontakte</AppText>
              </View>
              <Pressable onPress={() => navigation.navigate('Emergency')} style={styles.link}>
                <AppText variant="caption" color={colors.primary}>+ Notfallkontakte hinterlegen</AppText>
              </Pressable>
            </>
          )}
        </Card>
      ) : null}

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
  flex: { flex: 1, minWidth: 0 },
  dialogCard: { borderColor: colors.error, borderWidth: 1.5, gap: spacing.md, marginBottom: spacing.md, alignItems: 'stretch' },
  dialogHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  successCard: { borderColor: colors.success, borderWidth: 1.5, gap: spacing.sm, marginBottom: spacing.md },
  countCircle: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 4, borderColor: colors.error,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
  },
  countNum: { fontVariant: ['tabular-nums'] },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  notifiedBox: { gap: 2, marginTop: spacing.sm },
  sosButton: {
    backgroundColor: colors.error,
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  sosButtonPressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
  section: { marginTop: spacing.md, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { flex: 1, gap: 2 },
  link: { marginTop: spacing.sm, padding: spacing.sm },
});
