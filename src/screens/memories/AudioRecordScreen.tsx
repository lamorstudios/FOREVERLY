import { useState } from 'react';
import { View, StyleSheet, Alert, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Button, TextField } from '@/components';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { uploadAudio } from '@/api/media';
import { qk } from '@/api/queryKeys';
import { formatDuration } from '@/lib/format';
import { friendlyError } from '@/lib/errors';
import { colors, spacing } from '@/theme';
import type { MemoriesStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<MemoriesStackParamList, 'AudioRecord'>;

export function AudioRecordScreen({ navigation, route }: Props) {
  const personId = route.params?.personId;
  const { activeFamily } = useFamily();
  const { userId } = useAuth();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();

  const recorder = useAudioRecorder();
  const [title, setTitle] = useState('');
  const [result, setResult] = useState<{ uri: string; durationSeconds: number } | null>(
    null,
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!result) return;
      await uploadAudio({
        familyId,
        recordedBy: userId!,
        localUri: result.uri,
        durationSeconds: result.durationSeconds,
        title: title.trim() ? title.trim() : null,
        personId: personId ?? null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.audios(familyId) });
      navigation.goBack();
    },
    onError: (e) => Alert.alert('Fehler', friendlyError(e)),
  });

  async function handleStop() {
    const stopped = await recorder.stop();
    if (stopped) setResult(stopped);
  }

  function handleStart() {
    setResult(null);
    setTitle('');
    recorder.reset();
    recorder.start();
  }

  function handleReset() {
    setResult(null);
    setTitle('');
    recorder.reset();
  }

  const displaySeconds = recorder.isRecording
    ? recorder.durationSeconds
    : result?.durationSeconds;

  return (
    <Screen contentStyle={styles.content}>
      <AppText variant="heading" center>
        {recorder.isRecording
          ? 'Aufnahme läuft …'
          : result
            ? 'Aufnahme fertig'
            : 'Bereit zur Aufnahme'}
      </AppText>

      <AppText variant="display" center>
        {formatDuration(displaySeconds)}
      </AppText>

      {!result ? (
        <Pressable
          onPress={recorder.isRecording ? handleStop : handleStart}
          accessibilityRole="button"
          accessibilityLabel={recorder.isRecording ? 'Aufnahme stoppen' : 'Aufnahme starten'}
          style={[
            styles.recordButton,
            recorder.isRecording && styles.recordButtonActive,
          ]}
        >
          <Ionicons
            name={recorder.isRecording ? 'stop' : 'mic'}
            size={64}
            color={colors.textOnAccent}
          />
        </Pressable>
      ) : null}

      {result ? (
        <View style={styles.saveArea}>
          <TextField
            label="Titel (optional)"
            placeholder="z. B. Großmutters Geschichte"
            value={title}
            onChangeText={setTitle}
          />
          <Button
            label="Speichern"
            icon="checkmark"
            onPress={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
          />
          <Button
            label="Neu aufnehmen"
            icon="refresh"
            variant="secondary"
            onPress={handleReset}
            disabled={saveMutation.isPending}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingTop: spacing.xl, alignItems: 'center' },
  recordButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.lg,
  },
  recordButtonActive: { backgroundColor: colors.error },
  saveArea: { width: '100%', gap: spacing.md },
});
