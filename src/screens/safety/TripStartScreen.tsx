import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, AppText, Button, SelectField, TextField } from '@/components';
import type { SelectOption } from '@/components';
import { listPersons } from '@/api/persons';
import { startTrip } from '@/api/safety';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { colors, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { SafetyAudience, SafetyTripKind } from '@/types/models';
import { AUDIENCE_META } from './safetyMeta';

type Props = NativeStackScreenProps<HomeStackParamList, 'TripStart'>;

const AUDIENCES: SafetyAudience[] = ['inner', 'trusted', 'family', 'selected'];
const ETA_OPTIONS: SelectOption<string>[] = [
  { value: '15', label: 'in ca. 15 Minuten' },
  { value: '30', label: 'in ca. 30 Minuten' },
  { value: '45', label: 'in ca. 45 Minuten' },
  { value: '60', label: 'in ca. 1 Stunde' },
];

export function TripStartScreen({ navigation, route }: Props) {
  const kind: SafetyTripKind = route.params?.kind ?? 'heimweg';
  const isHome = kind === 'heimweg';
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const personsQuery = useQuery({ queryKey: qk.persons(familyId), queryFn: () => listPersons(familyId) });

  const [destination, setDestination] = useState(isHome ? 'Zuhause' : '');
  const [audience, setAudience] = useState<SafetyAudience>('inner');
  const [eta, setEta] = useState('30');
  const [saving, setSaving] = useState(false);

  const myPersonId = personsQuery.data?.find((p) => p.user_id === userId)?.id ?? null;
  const audienceOptions: SelectOption<SafetyAudience>[] = AUDIENCES.map((a) => ({ value: a, label: AUDIENCE_META[a] }));

  async function onStart() {
    if (!destination.trim()) return;
    setSaving(true);
    try {
      const trip = await startTrip({
        familyId,
        userId: userId!,
        personId: myPersonId,
        kind,
        destinationLabel: destination.trim(),
        eta: isHome ? new Date(Date.now() + Number(eta) * 60000).toISOString() : null,
        audience,
        battery: 60 + Math.floor(Math.random() * 35),
      });
      navigation.replace('TripDetail', { tripId: trip.id });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen tint={colors.tintFamily}>
      <AppText variant="title" style={styles.title}>
        {isHome ? 'Heimweg teilen' : 'Sicher angekommen'}
      </AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        {isHome
          ? 'Ausgewählte Personen sehen deine Live-Position und voraussichtliche Ankunft. Nach der Ankunft endet die Freigabe automatisch.'
          : 'Sag deinen Liebsten Bescheid, sobald du sicher angekommen bist. Bis dahin sehen sie nur, dass du unterwegs bist.'}
      </AppText>

      <View style={styles.form}>
        <TextField label="Ziel" value={destination} onChangeText={setDestination} placeholder="z.B. Zuhause, Praxis Dr. Wagner" />
        {isHome ? <SelectField label="Voraussichtliche Ankunft" value={eta} options={ETA_OPTIONS} onChange={setEta} /> : null}
        <SelectField label="Sichtbar für" value={audience} options={audienceOptions} onChange={setAudience} />
      </View>

      <Button
        label={isHome ? 'Heimweg starten' : 'Unterwegs – melde mich bei Ankunft'}
        icon="navigate-outline"
        loading={saving}
        disabled={!destination.trim()}
        onPress={onStart}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.xs },
  intro: { marginBottom: spacing.md },
  form: { gap: spacing.md, marginBottom: spacing.lg },
});
