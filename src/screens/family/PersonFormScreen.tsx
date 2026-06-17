import { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Pressable, Alert, Switch } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Screen,
  AppText,
  Button,
  TextField,
  DateField,
  SelectField,
  Loading,
} from '@/components';
import type { SelectOption } from '@/components';
import { SignedImage } from '@/components/SignedImage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPerson,
  listPersons,
  createPerson,
  updatePerson,
  deletePerson,
  uploadPersonAvatar,
  createRelationship,
} from '@/api/persons';
import type { PersonInput } from '@/api/persons';
import { qk } from '@/api/queryKeys';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { useImagePicker } from '@/hooks/useImagePicker';
import { friendlyError } from '@/lib/errors';
import { confirmAsync } from '@/lib/confirm';
import { fullName } from '@/lib/format';
import {
  RELATIONSHIP_LABELS,
  RELATIONSHIP_TYPE_OPTIONS,
  DEFAULT_CATEGORY_FOR_TYPE,
} from '@/constants/relationships';
import { colors, spacing, radius } from '@/theme';
import type { FamilyStackParamList } from '@/navigation/types';
import type { RelationshipType } from '@/types/models';

type Props = NativeStackScreenProps<FamilyStackParamList, 'PersonForm'>;

export function PersonFormScreen({ navigation, route }: Props) {
  const personId = route.params?.personId;
  const memorialParam = route.params?.memorial ?? false;
  const isEditing = !!personId;
  const { activeFamily } = useFamily();
  const { userId } = useAuth();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();
  const { pickFromLibrary } = useImagePicker();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [birthPlace, setBirthPlace] = useState('');
  const [deathDate, setDeathDate] = useState<string | null>(null);
  const [biography, setBiography] = useState('');
  const [isMemorial, setIsMemorial] = useState(memorialParam);
  const [traits, setTraits] = useState('');
  const [existingAvatar, setExistingAvatar] = useState<string | null>(null);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Beziehung (nur beim Anlegen) – damit die Person im Familienbaum erscheint.
  const [relRefId, setRelRefId] = useState<string | null>(null);
  const [relType, setRelType] = useState<RelationshipType | null>(memorialParam ? 'oma' : null);

  const personQuery = useQuery({
    queryKey: qk.person(personId ?? ''),
    queryFn: () => getPerson(personId as string),
    enabled: isEditing,
  });

  // Personen für die Beziehungsauswahl (Bezugsperson) – nur beim Anlegen.
  const personsQuery = useQuery({
    queryKey: qk.persons(familyId),
    queryFn: () => listPersons(familyId),
    enabled: !isEditing,
  });
  const persons = personsQuery.data ?? [];
  const anchorId = persons.find((p) => p.user_id === userId)?.id ?? persons[0]?.id ?? null;

  useEffect(() => {
    if (!isEditing && relRefId == null && anchorId) setRelRefId(anchorId);
  }, [anchorId, isEditing, relRefId]);

  const refOptions: SelectOption<string>[] = persons.map((p) => ({
    value: p.id,
    label: fullName(p.first_name, p.last_name),
  }));
  const typeOptions: SelectOption<RelationshipType>[] = RELATIONSHIP_TYPE_OPTIONS.map((t) => ({
    value: t,
    label: RELATIONSHIP_LABELS[t],
  }));

  useEffect(() => {
    const p = personQuery.data;
    if (!p) return;
    setFirstName(p.first_name ?? '');
    setLastName(p.last_name ?? '');
    setBirthDate(p.birth_date ?? null);
    setBirthPlace(p.birth_place ?? '');
    setDeathDate(p.death_date ?? null);
    setBiography(p.biography ?? '');
    setIsMemorial(!!p.is_memorial);
    setTraits(p.traits ?? '');
    setExistingAvatar(p.avatar_url ?? null);
  }, [personQuery.data]);

  async function handlePick() {
    const picked = await pickFromLibrary();
    if (picked) setLocalImageUri(picked.uri);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      let avatarUrl = existingAvatar;
      if (localImageUri) {
        avatarUrl = await uploadPersonAvatar(familyId, localImageUri);
      }
      const input: PersonInput = {
        first_name: firstName.trim(),
        last_name: lastName.trim() || null,
        birth_date: birthDate,
        birth_place: birthPlace.trim() || null,
        death_date: deathDate,
        biography: biography.trim() || null,
        avatar_url: avatarUrl,
        is_memorial: isMemorial,
        traits: traits.trim() || null,
      };
      if (isEditing) {
        return updatePerson(personId as string, input);
      }
      const created = await createPerson(familyId, userId!, input);
      // Beziehung anlegen, damit die Person im Familienbaum sichtbar wird.
      if (relRefId && relType && relRefId !== created.id) {
        await createRelationship({
          family_id: familyId,
          from_person_id: relRefId,
          to_person_id: created.id,
          type: relType,
          category: DEFAULT_CATEGORY_FOR_TYPE[relType],
          created_by: userId!,
        });
      }
      return created;
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: qk.persons(familyId) });
      queryClient.invalidateQueries({ queryKey: qk.relationships(familyId) });
      if (personId) {
        queryClient.invalidateQueries({ queryKey: qk.person(personId) });
      }
      // Neues Ehrenmitglied direkt zur Erinnerungsseite (Fotos/Erinnerungen/Zitate).
      if (!isEditing && isMemorial && saved) {
        navigation.replace('MemorialProfile', { personId: saved.id });
      } else {
        navigation.goBack();
      }
    },
    onError: (e) => setError(friendlyError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePerson(personId as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.persons(familyId) });
      if (personId) {
        queryClient.invalidateQueries({ queryKey: qk.person(personId) });
      }
      navigation.goBack();
    },
    onError: (e) => Alert.alert('Fehler', friendlyError(e)),
  });

  function handleSave() {
    setError(null);
    if (!firstName.trim()) {
      setError('Bitte gib mindestens den Vornamen ein.');
      return;
    }
    saveMutation.mutate();
  }

  async function handleDelete() {
    const ok = await confirmAsync({
      title: 'Person löschen',
      message: 'Möchtest du diese Person wirklich dauerhaft löschen?',
      confirmLabel: 'Löschen',
      destructive: true,
    });
    if (ok) deleteMutation.mutate();
  }

  if (isEditing && personQuery.isLoading) {
    return (
      <Screen>
        <Loading message="Person wird geladen …" />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="display" style={styles.title}>
        {isEditing
          ? 'Person bearbeiten'
          : memorialParam
            ? 'Ehrenmitglied hinzufügen'
            : 'Neue Person'}
      </AppText>
      {!isEditing && memorialParam ? (
        <AppText variant="body" color={colors.textSecondary} style={styles.subtitle}>
          Bewahre ein verstorbenes oder besonderes Familienmitglied. Nach dem
          Speichern erscheint es im Familienbaum – dort kannst du Fotos,
          Erinnerungen und Zitate hinzufügen.
        </AppText>
      ) : null}

      <View style={styles.avatarBlock}>
        <Pressable onPress={handlePick} style={styles.avatarPress}>
          {localImageUri ? (
            <Image source={{ uri: localImageUri }} style={styles.avatar} />
          ) : existingAvatar ? (
            <SignedImage
              bucket="photos"
              path={existingAvatar}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarEmpty]}>
              <AppText variant="caption" color={colors.textMuted} center>
                Foto wählen
              </AppText>
            </View>
          )}
        </Pressable>
        <Button
          label={
            localImageUri || existingAvatar ? 'Foto ändern' : 'Foto auswählen'
          }
          icon="image-outline"
          variant="ghost"
          fullWidth={false}
          onPress={handlePick}
        />
      </View>

      <View style={styles.form}>
        <TextField
          label="Vorname *"
          value={firstName}
          onChangeText={setFirstName}
          placeholder="z. B. Maria"
        />
        <TextField
          label="Nachname"
          value={lastName}
          onChangeText={setLastName}
          placeholder="z. B. Schmidt"
        />

        {/* Beziehung – nur beim Anlegen, damit die Person im Baum erscheint. */}
        {!isEditing && persons.length > 0 ? (
          <View style={styles.relBlock}>
            <SelectField
              label="Beziehung zu"
              placeholder="Bezugsperson wählen"
              value={relRefId}
              options={refOptions}
              onChange={setRelRefId}
            />
            <SelectField
              label="Beziehung (z. B. Oma, Opa, Tante)"
              placeholder="Beziehung wählen"
              value={relType}
              options={typeOptions}
              onChange={setRelType}
            />
            <AppText variant="caption" color={colors.textMuted}>
              {relRefId && relType
                ? `Diese Person ist ${RELATIONSHIP_LABELS[relType]} von ${
                    refOptions.find((o) => o.value === relRefId)?.label ?? 'der gewählten Person'
                  }.`
                : 'Wähle eine Beziehung, damit die Person im Familienbaum erscheint.'}
            </AppText>
          </View>
        ) : null}

        <DateField
          label="Geburtsdatum"
          value={birthDate}
          onChange={setBirthDate}
        />
        <TextField
          label="Geburtsort"
          value={birthPlace}
          onChangeText={setBirthPlace}
          placeholder="z. B. München"
        />
        <DateField
          label="Sterbedatum"
          value={deathDate}
          onChange={setDeathDate}
        />
        <TextField
          label="Lebensgeschichte"
          value={biography}
          onChangeText={setBiography}
          placeholder="Erzähle etwas über diese Person …"
          multiline
          numberOfLines={5}
          style={styles.bio}
        />

        {/* Phase 16: Ehrenmitglied / Familienerbe */}
        <View style={styles.memorialRow}>
          <View style={styles.memorialText}>
            <AppText variant="bodyStrong">❤️ Familienerbe</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Als Ehrenmitglied bewahren – mit Galerie, Zitaten und Erinnerungen.
            </AppText>
          </View>
          <Switch
            value={isMemorial}
            onValueChange={setIsMemorial}
            trackColor={{ true: colors.gold, false: colors.border }}
            thumbColor={colors.surface}
          />
        </View>

        {isMemorial ? (
          <TextField
            label="Besonderheiten"
            value={traits}
            onChangeText={setTraits}
            placeholder="Was diese Person ausgemacht hat …"
            multiline
            numberOfLines={3}
            style={styles.bio}
          />
        ) : null}

        {error ? (
          <AppText variant="caption" color={colors.error}>
            {error}
          </AppText>
        ) : null}

        <Button
          label={!isEditing && isMemorial ? 'Ehrenmitglied speichern' : 'Speichern'}
          icon="checkmark-circle-outline"
          loading={saveMutation.isPending}
          onPress={handleSave}
        />

        {isEditing ? (
          <Button
            label="Person löschen"
            icon="trash-outline"
            variant="danger"
            loading={deleteMutation.isPending}
            onPress={handleDelete}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.sm },
  subtitle: { marginBottom: spacing.lg },
  relBlock: { gap: spacing.sm },
  avatarBlock: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  avatarPress: {},
  avatar: { width: 120, height: 120, borderRadius: 60 },
  avatarEmpty: {
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  form: { gap: spacing.md },
  bio: { minHeight: 120, textAlignVertical: 'top' },
  memorialRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md,
  },
  memorialText: { flex: 1, gap: 2 },
});
