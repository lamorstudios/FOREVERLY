import { useState } from 'react';
import { View, StyleSheet, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Screen,
  AppText,
  Button,
  Card,
  TextField,
  DateField,
  SelectField,
  AudioRecorder,
  useSuccess,
} from '@/components';
import type { SelectOption } from '@/components';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { useImagePicker } from '@/hooks/useImagePicker';
import { createMemory } from '@/api/memories';
import { uploadPhoto, uploadAudio } from '@/api/media';
import { qk } from '@/api/queryKeys';
import { friendlyError } from '@/lib/errors';
import { VISIBILITY_LEVELS, LEVEL_VISIBILITY_OPTIONS } from '@/constants/closeness';
import { colors, spacing, radius } from '@/theme';
import type { ContentType, VisibilityLevel } from '@/types/models';
import type { MemoriesStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<MemoriesStackParamList, 'MemoryForm'>;

const CONTENT_TYPE_OPTIONS: SelectOption<ContentType>[] = [
  { value: 'text', label: 'Text' },
  { value: 'photo', label: 'Foto' },
  { value: 'audio', label: 'Audio' },
];

const VISIBILITY_OPTIONS: SelectOption<VisibilityLevel>[] = LEVEL_VISIBILITY_OPTIONS.map(
  (v) => ({ value: v, label: `${VISIBILITY_LEVELS[v].emoji} ${VISIBILITY_LEVELS[v].label}` }),
);

interface PickedImage {
  uri: string;
  width: number;
  height: number;
}

export function MemoryFormScreen({ navigation, route }: Props) {
  const personId = route.params?.personId;
  const { activeFamily } = useFamily();
  const { userId } = useAuth();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();

  const { pickFromLibrary } = useImagePicker();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [occurredOn, setOccurredOn] = useState<string | null>(null);
  const [contentType, setContentType] = useState<ContentType>('text');
  const [visibility, setVisibility] = useState<VisibilityLevel>('family');
  const [titleError, setTitleError] = useState<string | undefined>();

  const [photo, setPhoto] = useState<PickedImage | null>(null);
  const [audio, setAudio] = useState<{ uri: string; durationSeconds: number } | null>(
    null,
  );
  const [audioTranscript, setAudioTranscript] = useState('');

  const { show } = useSuccess();
  const saveMutation = useMutation({
    mutationFn: async () => {
      const memory = await createMemory(familyId, userId!, {
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        content_type: contentType,
        person_id: personId ?? null,
        occurred_on: occurredOn,
        visibility,
      });

      if (contentType === 'photo' && photo) {
        await uploadPhoto({
          familyId,
          uploadedBy: userId!,
          localUri: photo.uri,
          memoryId: memory.id,
          personId: personId ?? null,
          width: photo.width,
          height: photo.height,
        });
      }

      if (contentType === 'audio' && audio) {
        await uploadAudio({
          familyId,
          recordedBy: userId!,
          localUri: audio.uri,
          durationSeconds: audio.durationSeconds,
          memoryId: memory.id,
          personId: personId ?? null,
          transcript: audioTranscript.trim() ? audioTranscript.trim() : null,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.memories(familyId) });
      queryClient.invalidateQueries({ queryKey: qk.photos(familyId) });
      queryClient.invalidateQueries({ queryKey: qk.audios(familyId) });
      show('Erinnerung gespeichert');
      navigation.goBack();
    },
    onError: (e) => Alert.alert('Fehler', friendlyError(e)),
  });

  async function handlePickPhoto() {
    const picked = await pickFromLibrary();
    if (picked) setPhoto(picked);
  }

  function handleSave() {
    if (!title.trim()) {
      setTitleError('Bitte gib einen Titel ein.');
      return;
    }
    setTitleError(undefined);
    saveMutation.mutate();
  }

  return (
    <Screen contentStyle={styles.content}>
      <TextField
        label="Titel"
        placeholder="z. B. Unser Sommerurlaub"
        value={title}
        onChangeText={(t) => {
          setTitle(t);
          if (titleError && t.trim()) setTitleError(undefined);
        }}
        error={titleError}
      />

      <TextField
        label="Beschreibung"
        placeholder="Erzähle mehr über diesen Moment …"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        style={styles.multiline}
      />

      <DateField
        label="Datum"
        value={occurredOn}
        onChange={setOccurredOn}
      />

      <SelectField<ContentType>
        label="Art der Erinnerung"
        value={contentType}
        options={CONTENT_TYPE_OPTIONS}
        onChange={setContentType}
      />

      <SelectField<VisibilityLevel>
        label="Sichtbar für"
        value={visibility}
        options={VISIBILITY_OPTIONS}
        onChange={setVisibility}
      />

      {contentType === 'photo' ? (
        <View style={styles.media}>
          {photo ? (
            <Card padded={false} style={styles.previewCard}>
              <Image source={{ uri: photo.uri }} style={styles.preview} />
            </Card>
          ) : null}
          <Button
            label={photo ? 'Anderes Foto wählen' : 'Foto auswählen'}
            icon="image-outline"
            variant="secondary"
            onPress={handlePickPhoto}
          />
        </View>
      ) : null}

      {contentType === 'audio' ? (
        <View style={styles.media}>
          <AudioRecorder
            showSave={false}
            onChange={(a, t) => {
              setAudio(a);
              setAudioTranscript(t);
            }}
          />
        </View>
      ) : null}

      <Button
        label="Speichern"
        icon="checkmark"
        onPress={handleSave}
        loading={saveMutation.isPending}
        style={styles.save}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingTop: spacing.md },
  multiline: { minHeight: 120, textAlignVertical: 'top' },
  media: { gap: spacing.md },
  previewCard: { overflow: 'hidden' },
  preview: { width: '100%', height: 220 },
  audioCard: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
  },
  save: { marginTop: spacing.md },
});
