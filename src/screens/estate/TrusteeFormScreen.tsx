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
} from '@/components';
import type { SelectOption } from '@/components';
import { listPersons } from '@/api/persons';
import { listTrustees, createTrustee, updateTrustee } from '@/api/estate';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { fullName } from '@/lib/format';
import { colors, spacing } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'TrusteeForm'>;

export function TrusteeFormScreen({ navigation, route }: Props) {
  const trusteeId = route.params?.trusteeId;
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;

  const personsQuery = useQuery({ queryKey: qk.persons(familyId), queryFn: () => listPersons(familyId) });
  const trusteesQuery = useQuery({ queryKey: qk.trustees(userId!), queryFn: () => listTrustees(userId!) });
  const existing = trusteesQuery.data?.find((t) => t.id === trusteeId);

  const [name, setName] = useState(existing?.name ?? '');
  const [relation, setRelation] = useState(existing?.relation ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [personId, setPersonId] = useState<string | null>(existing?.person_id ?? null);
  const [canConfirm, setCanConfirm] = useState(existing?.can_confirm_death ?? true);
  const [saving, setSaving] = useState(false);

  const personOptions: SelectOption<string>[] = (personsQuery.data ?? []).map((p) => ({
    value: p.id,
    label: fullName(p.first_name, p.last_name),
  }));

  function onPickPerson(id: string) {
    setPersonId(id);
    const p = personsQuery.data?.find((x) => x.id === id);
    if (p && !name.trim()) setName(fullName(p.first_name, p.last_name));
  }

  async function onSave() {
    if (!name.trim() || !relation.trim()) return;
    setSaving(true);
    try {
      const patch = {
        name: name.trim(),
        relation: relation.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        person_id: personId,
        can_confirm_death: canConfirm,
      };
      if (existing) {
        await updateTrustee(existing.id, patch);
      } else {
        await createTrustee({
          familyId,
          ownerUserId: userId!,
          personId,
          name: patch.name,
          relation: patch.relation,
          phone: patch.phone,
          email: patch.email,
          canConfirmDeath: canConfirm,
        });
      }
      await trusteesQuery.refetch();
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <View style={styles.form}>
        {personOptions.length > 0 ? (
          <SelectField
            label="Mit Familienprofil verknüpfen (optional)"
            placeholder="Person auswählen"
            value={personId}
            options={personOptions}
            onChange={onPickPerson}
          />
        ) : null}
        <TextField label="Name" value={name} onChangeText={setName} placeholder="z.B. Max Mielke" />
        <TextField label="Beziehung" value={relation} onChangeText={setRelation} placeholder="z.B. Bruder, Mutter, Notar-Kontakt" />
        <TextField label="Telefon (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <TextField label="E-Mail (optional)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

        <Card>
          <AppText variant="bodyStrong">Darf einen Todesfall bestätigen?</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            Nur Personen mit dieser Berechtigung zählen bei der Mehrfach-Bestätigung.
          </AppText>
          <View style={styles.toggle}>
            <Chip label="Ja" selected={canConfirm} color={colors.success} onPress={() => setCanConfirm(true)} />
            <Chip label="Nein" selected={!canConfirm} color={colors.textMuted} onPress={() => setCanConfirm(false)} />
          </View>
        </Card>
      </View>

      <Button
        label={existing ? 'Speichern' : 'Vertrauensperson hinzufügen'}
        icon="checkmark-outline"
        loading={saving}
        disabled={!name.trim() || !relation.trim()}
        onPress={onSave}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md, marginBottom: spacing.lg },
  toggle: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
