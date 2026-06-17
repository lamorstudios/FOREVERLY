import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Screen,
  AppText,
  Button,
  TextField,
  SelectField,
  Chip,
} from '@/components';
import type { SelectOption } from '@/components';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { listPersons } from '@/api/persons';
import { createTrustedContact } from '@/api/trustedContacts';
import { qk } from '@/api/queryKeys';
import { TRUSTED_ROLES, TRUSTED_ROLE_ORDER } from '@/constants/trusted';
import { fullName } from '@/lib/format';
import { friendlyError } from '@/lib/errors';
import { colors, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { TrustedRole } from '@/types/models';

type Props = NativeStackScreenProps<HomeStackParamList, 'TrustedContactForm'>;

export function TrustedContactFormScreen({ navigation, route }: Props) {
  const { activeFamily } = useFamily();
  const { userId } = useAuth();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [role, setRole] = useState<TrustedRole>('nachbar');
  const [personId, setPersonId] = useState<string | null>(route.params?.personId ?? null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [availability, setAvailability] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const personsQuery = useQuery({
    queryKey: qk.persons(familyId),
    queryFn: () => listPersons(familyId),
  });

  const roleOptions: SelectOption<TrustedRole>[] = TRUSTED_ROLE_ORDER.map((r) => ({
    value: r,
    label: TRUSTED_ROLES[r].label,
  }));
  const personOptions: SelectOption<string>[] = (personsQuery.data ?? []).map((p) => ({
    value: p.id,
    label: fullName(p.first_name, p.last_name),
  }));

  const save = useMutation({
    mutationFn: () =>
      createTrustedContact({
        familyId,
        personId,
        name: name.trim(),
        role,
        phone: phone.trim() || null,
        email: email.trim() || null,
        location: location.trim() || null,
        note: note.trim() || null,
        availability: availability.trim() || null,
        isEmergency,
        createdBy: userId!,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustedContacts', familyId] });
      navigation.goBack();
    },
    onError: (e) => setError(friendlyError(e)),
  });

  function handleSave() {
    setError(null);
    if (!name.trim()) return setError('Bitte gib einen Namen ein.');
    save.mutate();
  }

  return (
    <Screen contentStyle={styles.content}>
      <AppText variant="body" color={colors.textSecondary}>
        Diese Person wird nur als Kontakt hinterlegt und erhält keinen Zugriff
        auf eure Familieninhalte.
      </AppText>

      <TextField label="Name" value={name} onChangeText={setName} placeholder="z.B. Herr Müller" />
      <SelectField label="Rolle" value={role} options={roleOptions} onChange={setRole} />
      <SelectField
        label="Zugeordnet zu (Familienmitglied)"
        placeholder="Person auswählen"
        value={personId}
        options={personOptions}
        onChange={setPersonId}
      />
      <TextField label="Telefon" value={phone} onChangeText={setPhone} placeholder="+49 …" keyboardType="phone-pad" />
      <TextField label="E-Mail (optional)" value={email} onChangeText={setEmail} placeholder="name@beispiel.de" keyboardType="email-address" autoCapitalize="none" />
      <TextField label="Wohnort / Nähe (optional)" value={location} onChangeText={setLocation} placeholder="z.B. gleiches Haus" />
      <TextField label="Verfügbarkeit (optional)" value={availability} onChangeText={setAvailability} placeholder="z.B. werktags erreichbar" />
      <TextField label="Notiz (optional)" value={note} onChangeText={setNote} placeholder="z.B. kann im Notfall nachsehen" multiline />

      <View style={styles.emergencyRow}>
        <AppText variant="label" color={colors.textSecondary}>
          Als Notfallkontakt markieren
        </AppText>
        <View style={styles.toggle}>
          <Chip label="Ja" selected={isEmergency} onPress={() => setIsEmergency(true)} />
          <Chip label="Nein" selected={!isEmergency} onPress={() => setIsEmergency(false)} />
        </View>
      </View>

      {error ? (
        <AppText variant="caption" color={colors.error}>
          {error}
        </AppText>
      ) : null}

      <Button label="Speichern" onPress={handleSave} loading={save.isPending} />
      <Button label="Abbrechen" variant="ghost" onPress={() => navigation.goBack()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingTop: spacing.md },
  emergencyRow: { gap: spacing.sm },
  toggle: { flexDirection: 'row', gap: spacing.sm },
});
