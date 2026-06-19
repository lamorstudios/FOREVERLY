import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';

export interface RecordingResult {
  uri: string;
  durationSeconds: number;
}

type RecorderStatus = 'idle' | 'recording' | 'paused' | 'stopped';

/** Audioaufnahme direkt in der App (expo-av) inkl. Pause/Fortsetzen. */
export function useAudioRecorder() {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [durationMillis, setDurationMillis] = useState(0);

  useEffect(() => {
    return () => {
      // Aufräumen bei Unmount
      recordingRef.current?.stopAndUnloadAsync().catch(() => undefined);
    };
  }, []);

  const start = useCallback(async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Mikrofon benötigt',
          'Bitte erlaube den Zugriff auf das Mikrofon, um Audio aufzunehmen.',
        );
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (s) => {
          if (s.isRecording) setDurationMillis(s.durationMillis ?? 0);
        },
        200,
      );
      recordingRef.current = recording;
      setStatus('recording');
    } catch {
      Alert.alert('Fehler', 'Aufnahme konnte nicht gestartet werden.');
    }
  }, []);

  const pause = useCallback(async () => {
    try {
      await recordingRef.current?.pauseAsync();
      setStatus('paused');
    } catch {
      /* ignorieren */
    }
  }, []);

  const resume = useCallback(async () => {
    try {
      // expo-av setzt eine pausierte Aufnahme mit startAsync() fort.
      await recordingRef.current?.startAsync();
      setStatus('recording');
    } catch {
      /* ignorieren */
    }
  }, []);

  const stop = useCallback(async (): Promise<RecordingResult | null> => {
    const recording = recordingRef.current;
    if (!recording) return null;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const finalStatus = await recording.getStatusAsync();
      recordingRef.current = null;
      setStatus('stopped');
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      if (!uri) return null;
      return {
        uri,
        durationSeconds: Math.round(
          (finalStatus.durationMillis ?? durationMillis) / 1000,
        ),
      };
    } catch {
      return null;
    }
  }, [durationMillis]);

  /** Bricht eine laufende/pausierte Aufnahme ohne Ergebnis ab. */
  const cancel = useCallback(async () => {
    try {
      await recordingRef.current?.stopAndUnloadAsync();
    } catch {
      /* ignorieren */
    }
    recordingRef.current = null;
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => undefined);
    setStatus('idle');
    setDurationMillis(0);
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setDurationMillis(0);
  }, []);

  return {
    status,
    durationSeconds: Math.round(durationMillis / 1000),
    isRecording: status === 'recording',
    isPaused: status === 'paused',
    start,
    pause,
    resume,
    stop,
    cancel,
    reset,
  };
}
