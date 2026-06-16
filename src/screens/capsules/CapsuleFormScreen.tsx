import { useState } from 'react';
import { View, StyleSheet, Image, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Screen,
  AppText,
  Button,
  TextField,
  SelectField,
  DateField,
  Card,
  Loading,
} from '@/components';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { useImagePicker } from '@/hooks/useImagePicker';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { createCapsule } from '@/api/timeCapsules';
import type { CapsuleRecipientInput } from '@/api/timeCapsules';
import { listMembers } from '@/api/families';
import { listPersons } from '@/api/persons';
import { qk } from '@/api/queryKeys';
import { scheduleCapsuleReminder } from '@/lib/notifications';
import { formatDuration, fullName } from '@/lib/format';
import { friendlyError } from '@/lib/errors';
import { VISIBILITY_LEVELS } from '@/constants/closeness';
import { colors, spacing, radius } from '@/theme';
import type { ContentType, FamilyMember, Person, VisibilityLevel } from '@/types/models';
import type { SelectOption } from '@/components';
import type { CapsulesStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<CapsulesStackParamList, 'CapsuleForm'>;

const CONTENT_TYPE_OPTIONS: SelectOption<ContentType>[] = [
  { value: 'text', label: 'Text' },
  { value: 'photo', label: 'Foto' },
  { value: 'audio', label: 'Audio' },
];

const VISIBILITY_OPTIONS: SelectOption<VisibilityLevel>[] = (
  ['family', 'inner', 'sehr_nah', 'selected', 'private'] as VisibilityLevel[]
).map((v) => ({ value: v, label: `${VISIBILITY_LEVELS[v].emoji} ${VISIBILITY_LEVELS[v].label}` }));

export function CapsuleFormScreen({ navigation }: Props) {
  const { activeFamily } = useFamily();
  const { userId } = useAuth();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();
  const { pickFromLibrary } = useImagePicker();
  const recorder = useAudioRecorder();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState<ContentType>('text');
  const [textContent, setTextContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<VisibilityLevel>('selected');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedPersons, setSelectedPersons] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const membersQuery = useQuery({
    queryKey: qk.members(familyId),
    queryFn: () => listMembers(familyId),
  });
  const personsQuery = useQuery({
    queryKey: qk.persons(familyId),
    queryFn: () => listPersons(familyId),
  });

  async function handlePickImage() {
    const picked = await pickFromLibrary();
    if (picked) setImageUri(picked.uri);
  }

  async function handleStopRecording() {
    const result = await recorder.stop();
    if (result) {
      setAudioUri(result.uri);
      setAudioDuration(result.durationSeconds);
    }
  }

  function toggleMember(id: string) {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  }

  function togglePerson(id: string) {
    setSelectedPersons((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const openAt = new Date(`${openDate}T09:00:00`).toISOString();

      const recipients: CapsuleRecipientInput[] = [
        ...selectedMembers.map((memberId) => {
          const member = (membersQuery.data ?? []).find(
            (m) => m.id === memberId,
          );
          return { userId: member?.user_id };
        }),
        ...selectedPersons.map((personId) => ({ personId })),
      ];

      const mediaUri =
        contentType === 'photo'
          ? imageUri
          : contentType === 'audio'
            ? audioUri
            : null;

      const capsule = await createCapsule({
        familyId,
        creatorId: userId!,
        title: title.trim(),
        description: description.trim() || null,
        contentType,
        textContent: contentType === 'text' ? textContent.trim() : null,
        mediaUri,
        openAt,
        visibility,
        recipients,
      });

      try {
        await scheduleCapsuleReminder({
          capsuleId: capsule.id,
          title: capsule.title,
          openAt,
        });
      } catch {
        // Erinnerung ist optional – Fehler bewusst ignorieren.
      }

      return capsule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.capsules(familyId) });
      queryClient.invalidateQueries({ queryKey: qk.upcomingCapsules() });
      navigation.goBack();
    },
    onError: (e) => Alert.alert('Fehler', friendlyError(e)),
  });

  function handleSave() {
    setError(null);
    if (!title.trim()) {
      setError('Bitte gib einen Titel ein.');
      return;
    }
    if (contentType === 'text' && !textContent.trim()) {
      setError('Bitte schreibe deine Nachricht.');
      return;
    }
    if (contentType === 'photo' && !imageUri) {
      setError('Bitte wähle ein Foto aus.');
      return;
    }
    if (contentType === 'audio' && !audioUri) {
      setError('Bitte nimm eine Audionachricht auf.');
      return;
    }
    if (!openDate) {
      setError('Bitte wähle ein Öffnungsdatum.');
      return;
    }
    const openAt = new Date(`${openDate}T09:00:00`);
    if (Number.isNaN(openAt.getTime()) || openAt.getTime() <= Date.now()) {
      setError('Das Öffnungsdatum muss in der Zukunft liegen.');
      return;
    }
    saveMutation.mutate();
  }

  if (membersQuery.isLoading || personsQuery.isLoading) {
    return (
      <Screen>
        <Loading message="Empfänger werden geladen …" />
      </Screen>
    );
  }

  const members = membersQuery.data ?? [];
  const persons = personsQuery.data ?? [];

  return (
    <Screen contentStyle={styles.content}>
      <AppText variant="display">Neue Zeitkapsel</AppText>

      <View style={styles.noteBox}>
        <Ionicons name="lock-closed" size={22} color={colors.gold} />
        <AppText variant="body" color={colors.textSecondary} style={styles.noteText}>
          Deine Zeitkapsel bleibt verschlossen, bis das gewählte Öffnungsdatum
          erreicht ist.
        </AppText>
      </View>

      <View style={styles.form}>
        <TextField
          label="Titel *"
          value={title}
          onChangeText={setTitle}
          placeholder="z. B. Zum 18. Geburtstag"
        />

        <TextField
          label="Beschreibung"
          value={description}
          onChangeText={setDescription}
          placeholder="Worum geht es in dieser Zeitkapsel?"
          multiline
          numberOfLines={3}
          style={styles.multiline}
        />

        <SelectField
          label="Art des Inhalts"
          value={contentType}
          options={CONTENT_TYPE_OPTIONS}
          onChange={setContentType}
        />

        {contentType === 'text' ? (
          <TextField
            label="Deine Nachricht"
            value={textContent}
            onChangeText={setTextContent}
            placeholder="Schreibe deine Botschaft für die Zukunft …"
            multiline
            numberOfLines={8}
            style={styles.bigMultiline}
          />
        ) : null}

        {contentType === 'photo' ? (
          <View style={styles.mediaBlock}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.preview} />
            ) : (
              <View style={[styles.preview, styles.previewEmpty]}>
                <Ionicons
                  name="image-outline"
                  size={48}
                  color={colors.textMuted}
                />
              </View>
            )}
            <Button
              label={imageUri ? 'Foto ändern' : 'Foto auswählen'}
              icon="image-outline"
              variant="secondary"
              onPress={handlePickImage}
            />
          </View>
        ) : null}

        {contentType === 'audio' ? (
          <View style={styles.mediaBlock}>
            <Card style={styles.audioCard}>
              <Ionicons
                name={recorder.isRecording ? 'mic' : 'mic-outline'}
                size={40}
                color={recorder.isRecording ? colors.error : colors.primary}
              />
              <AppText variant="heading">
                {recorder.isRecording
                  ? formatDuration(recorder.durationSeconds)
                  : audioUri
                    ? formatDuration(audioDuration)
                    : '0:00'}
              </AppText>
              {audioUri && !recorder.isRecording ? (
                <AppText variant="caption" color={colors.success}>
                  Aufnahme gespeichert
                </AppText>
              ) : null}
            </Card>
            {recorder.isRecording ? (
              <Button
                label="Stopp"
                icon="stop-circle-outline"
                variant="danger"
                onPress={handleStopRecording}
              />
            ) : (
              <Button
                label={audioUri ? 'Neu aufnehmen' : 'Aufnahme starten'}
                icon="mic-outline"
                variant="secondary"
                onPress={recorder.start}
              />
            )}
          </View>
        ) : null}

        <DateField
          label="Öffnungsdatum *"
          value={openDate}
          onChange={setOpenDate}
        />

        <SelectField
          label="Freigeben für"
          value={visibility}
          options={VISIBILITY_OPTIONS}
          onChange={setVisibility}
        />

        <View style={styles.recipientsBlock}>
          <AppText variant="heading">Empfänger auswählen</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            Wer soll diese Zeitkapsel erhalten?
          </AppText>

          {members.length > 0 ? (
            <View style={styles.recipientGroup}>
              <AppText variant="label" color={colors.textSecondary}>
                Familienmitglieder
              </AppText>
              {members.map((member) => (
                <RecipientRow
                  key={member.id}
                  label={member.profile?.full_name ?? 'Mitglied'}
                  icon="person-circle-outline"
                  selected={selectedMembers.includes(member.id)}
                  onPress={() => toggleMember(member.id)}
                />
              ))}
            </View>
          ) : null}

          {persons.length > 0 ? (
            <View style={styles.recipientGroup}>
              <AppText variant="label" color={colors.textSecondary}>
                Personen
              </AppText>
              {persons.map((person) => (
                <RecipientRow
                  key={person.id}
                  label={fullName(person.first_name, person.last_name)}
                  icon="people-outline"
                  selected={selectedPersons.includes(person.id)}
                  onPress={() => togglePerson(person.id)}
                />
              ))}
            </View>
          ) : null}
        </View>

        {error ? (
          <AppText variant="caption" color={colors.error}>
            {error}
          </AppText>
        ) : null}

        <Button
          label="Zeitkapsel speichern"
          icon="checkmark-circle-outline"
          loading={saveMutation.isPending}
          onPress={handleSave}
        />
      </View>
    </Screen>
  );
}

function RecipientRow({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="checkbox">
      <Card
        style={{
          ...styles.recipientRow,
          ...(selected ? styles.recipientSelected : {}),
        }}
      >
        <Ionicons name={icon} size={28} color={colors.primary} />
        <AppText variant="bodyStrong" style={styles.recipientLabel}>
          {label}
        </AppText>
        {selected ? (
          <Ionicons name="checkmark-circle" size={28} color={colors.success} />
        ) : (
          <Ionicons
            name="ellipse-outline"
            size={28}
            color={colors.textMuted}
          />
        )}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingTop: spacing.md },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.goldSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noteText: { flex: 1 },
  form: { gap: spacing.md },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  bigMultiline: { minHeight: 160, textAlignVertical: 'top' },
  mediaBlock: { gap: spacing.sm },
  preview: { width: '100%', height: 220, borderRadius: radius.md },
  previewEmpty: {
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  audioCard: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  recipientsBlock: { gap: spacing.sm },
  recipientGroup: { gap: spacing.sm, marginTop: spacing.sm },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  recipientSelected: {
    borderWidth: 1.5,
    borderColor: colors.success,
  },
  recipientLabel: { flex: 1 },
});
