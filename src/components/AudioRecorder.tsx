import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Animated, Easing, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { Button } from './Button';
import { Card } from './Card';
import { TextField } from './TextField';
import { useAudioRecorder, type RecordingResult } from '@/hooks/useAudioRecorder';
import {
  transcribeAudio,
  isTranscriptionAvailable,
  TranscriptionUnavailableError,
} from '@/lib/transcription';
import { formatDuration } from '@/lib/format';
import { colors, spacing, radius } from '@/theme';

type TranscriptionStatus = 'idle' | 'loading' | 'done' | 'error' | 'unavailable';

interface AudioRecorderProps {
  /** Wird beim Tippen auf „Speichern" aufgerufen (nur wenn showSave !== false). */
  onSave?: (audio: RecordingResult, transcript: string) => void;
  /** Wird bei jeder Änderung der Aufnahme/Transkription aufgerufen (für Formulare). */
  onChange?: (audio: RecordingResult | null, transcript: string) => void;
  saving?: boolean;
  allowPause?: boolean;
  allowRetake?: boolean;
  allowPlayback?: boolean;
  enableTranscription?: boolean;
  /** Eigener Speichern-Button (Standalone). In Formularen auf false setzen. */
  showSave?: boolean;
  saveLabel?: string;
}

const WAVE_BARS = 7;

/**
 * Zentrale, wiederverwendbare Audio-Aufnahme-Komponente:
 * Aufnehmen · Pause · Fortsetzen · Stoppen · Abbrechen · Anhören · Neu aufnehmen
 * · Speichern · editierbare Transkription. Wird von allen Audio-Seiten genutzt.
 */
export function AudioRecorder({
  onSave,
  onChange,
  saving,
  allowPause = true,
  allowRetake = true,
  allowPlayback = true,
  enableTranscription = true,
  showSave = true,
  saveLabel = 'Speichern',
}: AudioRecorderProps) {
  const rec = useAudioRecorder();
  const [result, setResult] = useState<RecordingResult | null>(null);
  const [transcript, setTranscript] = useState('');

  // --- automatische Transkription ---
  const [transStatus, setTransStatus] = useState<TranscriptionStatus>('idle');
  const abortRef = useRef<AbortController | null>(null);

  async function runTranscription(audio: RecordingResult) {
    if (!isTranscriptionAvailable()) {
      setTransStatus('unavailable');
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setTransStatus('loading');
    try {
      const text = await transcribeAudio(audio.uri, { language: 'de', signal: controller.signal });
      if (controller.signal.aborted) return;
      setTranscript(text);
      setTransStatus('done');
      onChange?.(audio, text.trim());
    } catch (e) {
      if (controller.signal.aborted) return;
      setTransStatus(e instanceof TranscriptionUnavailableError ? 'unavailable' : 'error');
    }
  }

  // --- lokale Wiedergabe der Aufnahme (mit Fortschritt) ---
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [posMs, setPosMs] = useState(0);
  const [durMs, setDurMs] = useState(0);

  const unload = () => {
    soundRef.current?.unloadAsync().catch(() => undefined);
    soundRef.current = null;
    setPlaying(false);
    setPosMs(0);
    setDurMs(0);
  };
  useEffect(
    () => () => {
      unload();
      abortRef.current?.abort();
    },
    [],
  );

  async function togglePlay() {
    if (!result) return;
    try {
      if (!soundRef.current) {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(
          { uri: result.uri },
          { shouldPlay: true, progressUpdateIntervalMillis: 120 },
          (s) => {
            if (!s.isLoaded) return;
            setPlaying(s.isPlaying);
            setPosMs(s.positionMillis ?? 0);
            if (s.durationMillis) setDurMs(s.durationMillis);
            if (s.didJustFinish) {
              setPlaying(false);
              setPosMs(0);
              soundRef.current?.setPositionAsync(0);
            }
          },
        );
        soundRef.current = sound;
        return;
      }
      const st = await soundRef.current.getStatusAsync();
      if (st.isLoaded && st.isPlaying) await soundRef.current.pauseAsync();
      else await soundRef.current.playAsync();
    } catch {
      /* ignorieren */
    }
  }

  // --- animierte Wellenform während der Aufnahme ---
  const wave = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (rec.isRecording) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(wave, { toValue: 1, duration: 420, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(wave, { toValue: 0, duration: 420, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    return undefined;
  }, [rec.isRecording, wave]);

  async function handleStop() {
    const r = await rec.stop();
    if (r) {
      setResult(r);
      onChange?.(r, transcript.trim());
      if (enableTranscription) void runTranscription(r);
    }
  }
  function handleRetake() {
    unload();
    abortRef.current?.abort();
    setResult(null);
    setTranscript('');
    setTransStatus('idle');
    rec.reset();
    onChange?.(null, '');
  }
  function handleTranscriptChange(t: string) {
    setTranscript(t);
    if (result) onChange?.(result, t.trim());
  }

  const progress = durMs > 0 ? Math.min(1, posMs / durMs) : 0;

  // ---------- STOPPED: Player + Neu aufnehmen + Speichern + Transkription ----------
  if (result) {
    return (
      <View style={styles.wrap}>
        <Card>
          <View style={styles.playerRow}>
            {allowPlayback ? (
              <Pressable onPress={togglePlay} style={styles.playBtn} accessibilityLabel={playing ? 'Pause' : 'Anhören'}>
                <Ionicons name={playing ? 'pause' : 'play'} size={26} color={colors.textOnAccent} />
              </Pressable>
            ) : null}
            <View style={styles.playerBody}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <AppText variant="caption" color={colors.textMuted}>
                {formatDuration(Math.round((durMs || result.durationSeconds * 1000) / 1000))}
              </AppText>
            </View>
          </View>
        </Card>

        {enableTranscription ? (
          <View style={styles.section}>
            <View style={styles.transHeader}>
              <Ionicons name="document-text-outline" size={16} color={colors.textMuted} />
              <AppText variant="label" color={colors.textSecondary}>Transkription</AppText>
            </View>

            {transStatus === 'loading' ? (
              <View style={styles.transStatusRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <AppText variant="caption" color={colors.textSecondary}>
                  Transkription wird erstellt …
                </AppText>
              </View>
            ) : null}

            {transStatus === 'unavailable' ? (
              <View style={styles.transNotice}>
                <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
                <AppText variant="caption" color={colors.textSecondary} style={styles.flex}>
                  Automatische Transkription ist in dieser Beta noch nicht aktiv. Du kannst den
                  Text unten manuell eingeben.
                </AppText>
              </View>
            ) : null}

            {transStatus === 'error' ? (
              <View style={styles.transNotice}>
                <Ionicons name="warning-outline" size={16} color={colors.error} />
                <View style={styles.flex}>
                  <AppText variant="caption" color={colors.error}>
                    Transkription konnte nicht erstellt werden. Du kannst den Text manuell ergänzen.
                  </AppText>
                  <Pressable onPress={() => runTranscription(result)} accessibilityRole="button">
                    <AppText variant="label" color={colors.primary}>Erneut versuchen</AppText>
                  </Pressable>
                </View>
              </View>
            ) : null}

            <TextField
              value={transcript}
              onChangeText={handleTranscriptChange}
              multiline
              editable={transStatus !== 'loading'}
              placeholder={
                transStatus === 'loading'
                  ? 'Transkription wird erstellt …'
                  : 'Tippe den gesprochenen Text hier ein – oder bearbeite die automatische Transkription.'
              }
              style={styles.transInput}
            />
            <AppText variant="caption" color={colors.textMuted}>
              Du kannst den Text jederzeit anpassen. Das Original-Audio bleibt immer erhalten.
            </AppText>
          </View>
        ) : null}

        <View style={styles.actions}>
          {allowRetake ? (
            <Pressable onPress={handleRetake} style={styles.secondaryBtn} accessibilityRole="button">
              <Ionicons name="refresh" size={18} color={colors.primary} />
              <AppText variant="label" color={colors.primary}>Neu aufnehmen</AppText>
            </Pressable>
          ) : null}
          {showSave ? (
            <View style={styles.flex}>
              <Button label={saveLabel} icon="checkmark" loading={saving} onPress={() => onSave?.(result, transcript.trim())} />
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  // ---------- RECORDING / PAUSED ----------
  if (rec.isRecording || rec.isPaused) {
    return (
      <Card>
        <View style={styles.recHeader}>
          <View style={[styles.recDot, rec.isPaused && styles.recDotPaused]} />
          <AppText variant="heading">{formatDuration(rec.durationSeconds)}</AppText>
        </View>
        <View style={styles.waves}>
          {Array.from({ length: WAVE_BARS }).map((_, i) => {
            const h = wave.interpolate({ inputRange: [0, 1], outputRange: [10, 10 + ((i % 3) + 1) * 12] });
            return <Animated.View key={i} style={[styles.waveBar, { height: rec.isPaused ? 10 : h }]} />;
          })}
        </View>
        <View style={styles.actions}>
          <Pressable onPress={rec.cancel} style={styles.secondaryBtn} accessibilityRole="button">
            <Ionicons name="close" size={18} color={colors.error} />
            <AppText variant="label" color={colors.error}>{rec.isPaused ? 'Verwerfen' : 'Abbrechen'}</AppText>
          </Pressable>
          {allowPause ? (
            <Pressable onPress={rec.isPaused ? rec.resume : rec.pause} style={styles.secondaryBtn} accessibilityRole="button">
              <Ionicons name={rec.isPaused ? 'play' : 'pause'} size={18} color={colors.primary} />
              <AppText variant="label" color={colors.primary}>{rec.isPaused ? 'Fortsetzen' : 'Pause'}</AppText>
            </Pressable>
          ) : null}
          <View style={styles.flex}>
            <Button label="Stoppen" icon="stop" onPress={handleStop} />
          </View>
        </View>
      </Card>
    );
  }

  // ---------- IDLE ----------
  return (
    <Button label="Aufnahme starten" icon="mic" onPress={rec.start} />
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  section: { gap: spacing.xs },
  flex: { flex: 1 },
  recHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  recDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.error },
  recDotPaused: { backgroundColor: colors.textMuted },
  waves: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 56, marginVertical: spacing.sm },
  waveBar: { width: 6, borderRadius: 3, backgroundColor: colors.primary },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  playBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  playerBody: { flex: 1, gap: spacing.xs },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
  transHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  transInput: { minHeight: 80, textAlignVertical: 'top' },
  transStatusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  transNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
});
