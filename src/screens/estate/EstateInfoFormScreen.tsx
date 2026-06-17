import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import {
  Screen,
  AppText,
  Button,
  Card,
  Chip,
  TextField,
  SelectField,
  Loading,
} from '@/components';
import type { SelectOption } from '@/components';
import { getEstateInfo, saveEstateInfo } from '@/api/estate';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { colors, spacing, radius } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';
import type { EstateAudience } from '@/types/models';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EstateInfoForm'>;

const AUDIENCE_OPTIONS: SelectOption<EstateAudience>[] = [
  { value: 'trustees', label: 'Vertrauenspersonen' },
  { value: 'spouse', label: 'Ehepartner' },
  { value: 'children', label: 'Alle Kinder' },
  { value: 'inner', label: 'Inner Circle' },
  { value: 'selected', label: 'Ausgewählte Personen' },
];

const CONFIRM_OPTIONS: SelectOption<string>[] = [
  { value: '1', label: '1 Bestätigung' },
  { value: '2', label: '2 Bestätigungen (empfohlen)' },
  { value: '3', label: '3 Bestätigungen' },
];

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggle}>
      <Chip label="Vorhanden" selected={value} color={colors.success} onPress={() => onChange(true)} />
      <Chip label="Nicht vorhanden" selected={!value} color={colors.textMuted} onPress={() => onChange(false)} />
    </View>
  );
}

export function EstateInfoFormScreen({ navigation }: Props) {
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const estateQuery = useQuery({ queryKey: qk.estateInfo(userId!), queryFn: () => getEstateInfo(userId!) });
  const e = estateQuery.data;

  const [hasWill, setHasWill] = useState(e?.has_will ?? false);
  const [willLoc, setWillLoc] = useState(e?.will_location ?? '');
  const [hasDecree, setHasDecree] = useState(e?.has_patient_decree ?? false);
  const [decreeLoc, setDecreeLoc] = useState(e?.patient_decree_location ?? '');
  const [hasPoa, setHasPoa] = useState(e?.has_power_of_attorney ?? false);
  const [poaLoc, setPoaLoc] = useState(e?.power_of_attorney_location ?? '');
  const [hasIns, setHasIns] = useState(e?.has_insurance ?? false);
  const [insLoc, setInsLoc] = useState(e?.insurance_location ?? '');
  const [contact, setContact] = useState(e?.contact_person ?? '');
  const [notes, setNotes] = useState(e?.personal_notes ?? '');
  const [farewell, setFarewell] = useState(e?.farewell_message ?? '');
  const [audience, setAudience] = useState<EstateAudience>(e?.release_audience ?? 'trustees');
  const [required, setRequired] = useState(String(e?.required_confirmations ?? 2));
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setSaving(true);
    try {
      await saveEstateInfo(userId!, familyId, {
        has_will: hasWill,
        will_location: hasWill ? willLoc.trim() || null : null,
        has_patient_decree: hasDecree,
        patient_decree_location: hasDecree ? decreeLoc.trim() || null : null,
        has_power_of_attorney: hasPoa,
        power_of_attorney_location: hasPoa ? poaLoc.trim() || null : null,
        has_insurance: hasIns,
        insurance_location: hasIns ? insLoc.trim() || null : null,
        contact_person: contact.trim() || null,
        personal_notes: notes.trim() || null,
        farewell_message: farewell.trim() || null,
        release_audience: audience,
        required_confirmations: Number(required) || 2,
      });
      await estateQuery.refetch();
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  if (estateQuery.isLoading) {
    return (
      <Screen>
        <Loading message="Wird geladen …" />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Hinterlege nur Orientierungshinweise – keine Passwörter, Bankzugänge, PINs/TANs oder
        Krypto-Schlüssel.
      </AppText>

      <Card>
        <AppText variant="bodyStrong">Testament</AppText>
        <Toggle value={hasWill} onChange={setHasWill} />
        {hasWill ? (
          <TextField label="Aufbewahrungsort" value={willLoc} onChangeText={setWillLoc} placeholder="z.B. beim Notar" />
        ) : null}
      </Card>

      <Card>
        <AppText variant="bodyStrong">Patientenverfügung</AppText>
        <Toggle value={hasDecree} onChange={setHasDecree} />
        {hasDecree ? (
          <TextField label="Aufbewahrungsort" value={decreeLoc} onChangeText={setDecreeLoc} placeholder="z.B. Ordner Zuhause" />
        ) : null}
      </Card>

      <Card>
        <AppText variant="bodyStrong">Vorsorgevollmacht</AppText>
        <Toggle value={hasPoa} onChange={setHasPoa} />
        {hasPoa ? (
          <TextField label="Aufbewahrungsort" value={poaLoc} onChangeText={setPoaLoc} />
        ) : null}
      </Card>

      <Card>
        <AppText variant="bodyStrong">Versicherungsunterlagen</AppText>
        <Toggle value={hasIns} onChange={setHasIns} />
        {hasIns ? (
          <TextField label="Aufbewahrungsort / Ansprechpartner" value={insLoc} onChangeText={setInsLoc} />
        ) : null}
      </Card>

      <View style={styles.form}>
        <TextField label="Zuständige Kontaktperson" value={contact} onChangeText={setContact} placeholder="z. B. Mutter" />
        <TextField
          label="Persönliche Hinweise"
          value={notes}
          onChangeText={setNotes}
          placeholder="Was sollte deine Familie wissen?"
          multiline
          numberOfLines={4}
          style={styles.multiline}
        />
        <TextField
          label="Abschiedsnachricht (optional)"
          value={farewell}
          onChangeText={setFarewell}
          placeholder="Ein paar warme Worte für deine Liebsten"
          multiline
          numberOfLines={4}
          style={styles.multiline}
        />
      </View>

      <Card>
        <AppText variant="bodyStrong">Freigabe-Regeln</AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          Wer darf den Nachlassbereich nach einer bestätigten Freigabe sehen – und wie viele
          Vertrauenspersonen müssen bestätigen?
        </AppText>
        <View style={styles.rules}>
          <SelectField label="Sichtbar für" value={audience} options={AUDIENCE_OPTIONS} onChange={setAudience} />
          <SelectField label="Nötige Bestätigungen" value={required} options={CONFIRM_OPTIONS} onChange={setRequired} />
        </View>
      </Card>

      <Button label="Speichern" icon="checkmark-outline" loading={saving} onPress={onSave} style={styles.save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: spacing.xs },
  toggle: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.sm },
  form: { gap: spacing.md, marginTop: spacing.xs },
  multiline: { minHeight: 96, textAlignVertical: 'top', borderRadius: radius.md },
  rules: { gap: spacing.md, marginTop: spacing.sm },
  save: { marginTop: spacing.md },
});
