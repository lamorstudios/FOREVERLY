import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, TextField, AudioRecorder, useSuccess } from '@/components';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { uploadAudio } from '@/api/media';
import { qk } from '@/api/queryKeys';
import { friendlyError } from '@/lib/errors';
import { colors, spacing } from '@/theme';
import type { RecordingResult } from '@/hooks/useAudioRecorder';
import type { MemoriesStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<MemoriesStackParamList, 'AudioRecord'>;

export function AudioRecordScreen({ navigation, route }: Props) {
  const personId = route.params?.personId;
  const { activeFamily } = useFamily();
  const { userId } = useAuth();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();
  const { show } = useSuccess();

  const [title, setTitle] = useState('');

  const saveMutation = useMutation({
    mutationFn: async (payload: { audio: RecordingResult; transcript: string }) => {
      await uploadAudio({
        familyId,
        recordedBy: userId!,
        localUri: payload.audio.uri,
        durationSeconds: payload.audio.durationSeconds,
        title: title.trim() ? title.trim() : null,
        personId: personId ?? null,
        transcript: payload.transcript ? payload.transcript : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.audios(familyId) });
      show('Aufnahme gespeichert');
      navigation.goBack();
    },
    onError: (e) => Alert.alert('Fehler', friendlyError(e)),
  });

  return (
    <Screen contentStyle={styles.content}>
      <AppText variant="display">Audio aufnehmen</AppText>
      <AppText variant="body" color={colors.textSecondary}>
        Halte eine Stimme, eine Geschichte oder einen Gedanken fest. Das Original-Audio
        bleibt immer erhalten.
      </AppText>

      <TextField
        label="Titel (optional)"
        placeholder="z. B. Großmutters Geschichte"
        value={title}
        onChangeText={setTitle}
      />

      <View style={styles.recorder}>
        <AudioRecorder
          saving={saveMutation.isPending}
          onSave={(audio, transcript) => saveMutation.mutate({ audio, transcript })}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingTop: spacing.lg },
  recorder: { marginTop: spacing.sm },
});
