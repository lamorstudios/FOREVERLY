import { useState } from 'react';
import { View, Image, Alert, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Screen,
  AppText,
  Button,
  TextField,
  SelectField,
} from '@/components';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { createMoment } from '@/api/moments';
import { qk } from '@/api/queryKeys';
import { MOMENT_KIND_META } from '@/constants/events';
import { VISIBILITY_LEVELS, LEVEL_VISIBILITY_OPTIONS } from '@/constants/closeness';
import { useImagePicker } from '@/hooks/useImagePicker';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { formatDuration } from '@/lib/format';
import { friendlyError } from '@/lib/errors';
import { colors, radius, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { MomentKind, VisibilityLevel } from '@/types/models';
import type { SelectOption } from '@/components';

type Props = NativeStackScreenProps<HomeStackParamList, 'MomentCompose'>;

const KIND_OPTIONS: SelectOption<MomentKind>[] = (
  Object.keys(MOMENT_KIND_META) as MomentKind[]
).map((kind) => ({ value: kind, label: MOMENT_KIND_META[kind].label }));

const VISIBILITY_OPTIONS: SelectOption<VisibilityLevel>[] = LEVEL_VISIBILITY_OPTIONS.map(
  (level) => ({ value: level, label: `${VISIBILITY_LEVELS[level].emoji} ${VISIBILITY_LEVELS[level].label}` }),
);

export function MomentComposeScreen({ navigation, route }: Props) {
  const { activeFamily } = useFamily();
  const { userId } = useAuth();
  const familyId = activeFamily!.id;
  const eventId = route.params?.eventId ?? null;
  const queryClient = useQueryClient();

  const { pickFromLibrary } = useImagePicker();
  const recorder = useAudioRecorder();

  const [kind, setKind] = useState<MomentKind>('text');
  const [text, setText] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [audio, setAudio] = useState<{ uri: string; durationSeconds: number } | null>(null);
  const [visibility, setVisibility] = useState<VisibilityLevel>('family');

  const createMutation = useMutation({
    mutationFn: () =>
      createMoment({
        familyId,
        authorUserId: userId!,
        kind,
        text: kind === 'text' ? text.trim() : null,
        localUri: kind === 'audio' ? audio?.uri ?? null : mediaUri,
        durationSeconds: kind === 'audio' ? audio?.durationSeconds ?? null : null,
        visibility,
        eventId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.moments(familyId, 'feed') });
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: qk.moments(familyId, eventId) });
      }
      navigation.goBack();
    },
    onError: (err) => Alert.alert('Fehler', friendlyError(err)),
  });

  const onPickMedia = async () => {
    const picked = await pickFromLibrary();
    if (picked) setMediaUri(picked.uri);
  };

  const onStopRecording = async () => {
    const result = await recorder.stop();
    if (result) setAudio(result);
  };

  const onSave = () => {
    const hasText = kind === 'text' && text.trim().length > 0;
    const hasMedia =
      (kind === 'photo' || kind === 'video') && !!mediaUri;
    const hasAudio = kind === 'audio' && !!audio;
    if (!hasText && !hasMedia && !hasAudio) {
      Alert.alert(
        'Inhalt fehlt',
        'Bitte schreibe etwas oder füge ein Foto, Video bzw. eine Aufnahme hinzu.',
      );
      return;
    }
    createMutation.mutate();
  };

  return (
    <Screen>
      <View style={styles.intro}>
        <AppText variant="heading">Moment teilen</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Teile einen schönen Augenblick mit deiner Familie.
        </AppText>
      </View>

      <View style={styles.form}>
        <SelectField<MomentKind>
          label="Art"
          value={kind}
          options={KIND_OPTIONS}
          onChange={(value) => {
            setKind(value);
            setMediaUri(null);
            setAudio(null);
            recorder.reset();
          }}
        />

        {kind === 'text' ? (
          <TextField
            label="Was möchtest du teilen?"
            value={text}
            onChangeText={setText}
            multiline
            placeholder="Schreibe deinen Familienmoment …"
          />
        ) : null}

        {kind === 'photo' || kind === 'video' ? (
          <View style={styles.mediaSection}>
            <Button
              label={mediaUri ? 'Anderes auswählen' : 'Aus Galerie auswählen'}
              icon="image-outline"
              variant="secondary"
              onPress={onPickMedia}
            />
            {mediaUri ? (
              <Image source={{ uri: mediaUri }} style={styles.preview} />
            ) : null}
          </View>
        ) : null}

        {kind === 'audio' ? (
          <View style={styles.audioSection}>
            {recorder.isRecording ? (
              <>
                <AppText variant="display" center color={colors.primary}>
                  {formatDuration(recorder.durationSeconds)}
                </AppText>
                <Button
                  label="Aufnahme stoppen"
                  icon="stop-circle-outline"
                  variant="danger"
                  onPress={onStopRecording}
                />
              </>
            ) : (
              <Button
                label={audio ? 'Erneut aufnehmen' : 'Aufnahme starten'}
                icon="mic-outline"
                variant="secondary"
                onPress={recorder.start}
              />
            )}
            {audio && !recorder.isRecording ? (
              <AppText variant="body" color={colors.textSecondary} center>
                Aufnahme bereit · {formatDuration(audio.durationSeconds)}
              </AppText>
            ) : null}
          </View>
        ) : null}

        <SelectField<VisibilityLevel>
          label="Sichtbar für"
          value={visibility}
          options={VISIBILITY_OPTIONS}
          onChange={setVisibility}
        />

        <Button
          label="Teilen"
          icon="send-outline"
          onPress={onSave}
          loading={createMutation.isPending}
          style={styles.saveButton}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.sm, marginBottom: spacing.lg },
  form: { gap: spacing.lg },
  mediaSection: { gap: spacing.md },
  preview: {
    width: '100%',
    height: 240,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  audioSection: { gap: spacing.md },
  saveButton: { marginTop: spacing.sm },
});
