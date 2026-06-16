import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import {
  Screen,
  AppText,
  Button,
  Card,
  SelectField,
  TextField,
  Loading,
} from '@/components';
import type { SelectOption } from '@/components';
import { listPersons } from '@/api/persons';
import { getMyLiveShare, setLiveShare, stopLiveShare } from '@/api/safety';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { colors, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { LiveStatus, SafetyAudience, ShareDuration } from '@/types/models';
import { STATUS_META, AUDIENCE_META, DURATION_META, expiryFor } from './safetyMeta';

type Props = NativeStackScreenProps<HomeStackParamList, 'LocationSettings'>;

const DURATIONS: ShareDuration[] = ['off', '1h', 'today', 'custom', 'permanent'];
const AUDIENCES: SafetyAudience[] = ['inner', 'trusted', 'family', 'selected'];
const STATUSES: LiveStatus[] = ['home', 'moving', 'work', 'school', 'doctor', 'vacation', 'custom'];

export function LocationSettingsScreen({ navigation }: Props) {
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;

  const myShareQuery = useQuery({ queryKey: qk.myLiveShare(userId!), queryFn: () => getMyLiveShare(userId!) });
  const personsQuery = useQuery({ queryKey: qk.persons(familyId), queryFn: () => listPersons(familyId) });
  const s = myShareQuery.data;

  const [duration, setDuration] = useState<ShareDuration>(s?.active ? s.duration : 'off');
  const [audience, setAudience] = useState<SafetyAudience>(s?.audience ?? 'inner');
  const [status, setStatus] = useState<LiveStatus>(s?.status ?? 'moving');
  const [place, setPlace] = useState(s?.place_label ?? '');
  const [saving, setSaving] = useState(false);

  const myPersonId = personsQuery.data?.find((p) => p.user_id === userId)?.id ?? null;

  const durationOptions: SelectOption<ShareDuration>[] = DURATIONS.map((d) => ({ value: d, label: DURATION_META[d] }));
  const audienceOptions: SelectOption<SafetyAudience>[] = AUDIENCES.map((a) => ({ value: a, label: AUDIENCE_META[a] }));
  const statusOptions: SelectOption<LiveStatus>[] = STATUSES.map((st) => ({
    value: st,
    label: `${STATUS_META[st].emoji} ${STATUS_META[st].label}`,
  }));

  async function onSave() {
    setSaving(true);
    try {
      if (duration === 'off') {
        await stopLiveShare(userId!);
      } else {
        await setLiveShare({
          familyId,
          userId: userId!,
          personId: myPersonId,
          status,
          placeLabel: place.trim() || null,
          battery: 60 + Math.floor(Math.random() * 35),
          audience: duration === 'permanent' ? 'inner' : audience,
          duration,
          expiresAt: expiryFor(duration),
        });
      }
      await myShareQuery.refetch();
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  if (myShareQuery.isLoading) {
    return (
      <Screen tint={colors.tintFamily}>
        <Loading message="Wird geladen …" />
      </Screen>
    );
  }

  return (
    <Screen tint={colors.tintFamily}>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Du bestimmst, wie lange und mit wem du deinen Standort teilst. Standardmäßig ist die Freigabe
        aus. Du kannst sie jederzeit beenden.
      </AppText>

      <View style={styles.form}>
        <SelectField label="Wie lange teilen?" value={duration} options={durationOptions} onChange={setDuration} />

        {duration !== 'off' ? (
          <>
            {duration !== 'permanent' ? (
              <SelectField label="Sichtbar für" value={audience} options={audienceOptions} onChange={setAudience} />
            ) : (
              <Card>
                <AppText variant="caption" color={colors.textSecondary}>
                  Dauerhafte Freigabe ist nur mit deinem Inner Circle möglich.
                </AppText>
              </Card>
            )}
            <SelectField label="Status" value={status} options={statusOptions} onChange={setStatus} />
            <TextField label="Ort (optional)" value={place} onChangeText={setPlace} placeholder="z.B. Zuhause, Praxis Dr. Wagner" />
          </>
        ) : null}
      </View>

      <Button
        label={duration === 'off' ? 'Teilen beenden' : 'Standort teilen'}
        icon={duration === 'off' ? 'close-outline' : 'location-outline'}
        loading={saving}
        onPress={onSave}
      />

      <Card style={styles.who}>
        <AppText variant="bodyStrong">Wer hat aktuell Zugriff?</AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {duration === 'off'
            ? 'Niemand – dein Standort wird nicht geteilt.'
            : `${duration === 'permanent' ? AUDIENCE_META.inner : AUDIENCE_META[audience]} · endet ${
                expiryFor(duration) ? 'automatisch' : 'erst, wenn du es beendest'
              }`}
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: spacing.sm },
  form: { gap: spacing.md, marginBottom: spacing.lg },
  who: { marginTop: spacing.lg },
});
