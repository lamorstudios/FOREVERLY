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
import {
  createLiveTranscriber,
  isLiveTranscriptionSupported,
  type LiveTranscriber,
} from '@/lib/speech';
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

/** Gleich große Pill-Buttons – nie abgeschnitten, kein horizontaler Overflow. */
function PillButton({
  label,
  icon,
  onPress,
  variant = 'neutral',
  tint,
  loading,
  disabled,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: 'neutral' | 'primary';
  tint?: string;
  loading?: boolean;
  disabled?: boolean;
}) {
  const primary = variant === 'primary';
  const fg = primary ? colors.textOnAccent : tint ?? colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.pill,
        primary ? styles.pillPrimary : styles.pillNeutral,
        (disabled || loading) && styles.pillDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <Ionicons name={icon} size={18} color={fg} />
      )}
      <AppText variant="label" color={fg} numberOfLines={1} style={styles.pillLabel}>
        {label}
      </AppText>
    </Pressable>
  );
}

/**
 * Zentrale, wiederverwendbare Audio-Aufnahme-Komponente:
 * Aufnehmen · Pause · Fortsetzen · Stoppen · Abbrechen · Anhören · Neu aufnehmen
 * · Speichern · Live-Transkription (Browser) mit Fallback. Wird von allen
 * Audio-Seiten genutzt.
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
  const [transStatus, setTransStatus] = useState<TranscriptionStatus>('idle');
  const abortRef = useRef<AbortController | null>(null);

  // --- Live-Transkription (Web Speech API) ---
  const liveSupported = isLiveTranscriptionSupported();
  const [liveText, setLiveText] = useState('');
  const liveFinalRef = useRef('');
  const committedRef = useRef('');
  const transcriberRef = useRef<LiveTranscriber | null>(null);

  function makeTranscriber(): LiveTranscriber | null {
    return createLiveTranscriber({
      onPartial: (txt) => {
        const full = committedRef.current ? `${committedRef.current} ${txt}`.trim() : txt;
        setLiveText(full);
      },
      onFinal: (txt) => {
        liveFinalRef.current = committedRef.current
          ? `${committedRef.current} ${txt}`.trim()
          : txt;
      },
    });
  }

  function startLive() {
    if (!enableTranscription || !liveSupported) return;
    committedRef.current = '';
    liveFinalRef.current = '';
    setLiveText('');
    transcriberRef.current = makeTranscriber();
    transcriberRef.current?.start();
  }
  function pauseLive() {
    committedRef.current = liveFinalRef.current;
    transcriberRef.current?.stop();
  }
  function resumeLive() {
    if (!enableTranscription || !liveSupported) return;
    transcriberRef.current = makeTranscriber();
    transcriberRef.current?.start();
  }
  function stopLive() {
    transcriberRef.current?.stop();
    transcriberRef.current = null;
  }

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
      transcriberRef.current?.stop();
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

  function handleStart() {
    setTransStatus('idle');
    startLive();
    void rec.start();
  }
  function handlePause() {
    pauseLive();
    void rec.pause();
  }
  function handleResume() {
    resumeLive();
    void rec.resume();
  }
  function handleCancel() {
    stopLive();
    setLiveText('');
    committedRef.current = '';
    liveFinalRef.current = '';
    void rec.cancel();
  }
  async function handleStop() {
    stopLive();
    const r = await rec.stop();
    if (!r) return;
    setResult(r);
    const live = (liveText || liveFinalRef.current).trim();
    if (live) {
      // Live-Transkription erfolgreich – Text direkt übernehmen (editierbar).
      setTranscript(live);
      setTransStatus('done');
      onChange?.(r, live);
    } else {
      onChange?.(r, transcript.trim());
      // Keine Live-Transkription → nach der Aufnahme transkribieren (oder Beta-Hinweis).
      if (enableTranscription) void runTranscription(r);
    }
  }
  function handleRetake() {
    unload();
    abortRef.current?.abort();
    stopLive();
    setResult(null);
    setTranscript('');
    setLiveText('');
    committedRef.current = '';
    liveFinalRef.current = '';
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
          <Card>
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
          </Card>
        ) : null}

        <View style={styles.actions}>
          {allowRetake ? (
            <PillButton label="Neu aufnehmen" icon="refresh" onPress={handleRetake} />
          ) : null}
          {showSave ? (
            <PillButton
              label={saveLabel}
              icon="checkmark"
              variant="primary"
              loading={saving}
              onPress={() => onSave?.(result, transcript.trim())}
            />
          ) : null}
        </View>
      </View>
    );
  }

  // ---------- RECORDING / PAUSED ----------
  if (rec.isRecording || rec.isPaused) {
    return (
      <View style={styles.wrap}>
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
            <PillButton
              label={rec.isPaused ? 'Verwerfen' : 'Abbrechen'}
              icon="close"
              tint={colors.error}
              onPress={handleCancel}
            />
            {allowPause ? (
              <PillButton
                label={rec.isPaused ? 'Fortsetzen' : 'Pause'}
                icon={rec.isPaused ? 'play' : 'pause'}
                onPress={rec.isPaused ? handleResume : handlePause}
              />
            ) : null}
            <PillButton label="Stoppen" icon="stop" variant="primary" onPress={handleStop} />
          </View>
        </Card>

        {enableTranscription ? (
          <Card>
            <View style={styles.transHeader}>
              <View style={styles.liveDot} />
              <AppText variant="label" color={colors.textSecondary}>Live-Transkription</AppText>
            </View>
            {liveSupported ? (
              <AppText
                variant="body"
                color={liveText ? colors.textPrimary : colors.textMuted}
                style={styles.liveText}
              >
                {liveText || 'Sprich jetzt – dein Text erscheint hier in Echtzeit …'}
              </AppText>
            ) : (
              <AppText variant="caption" color={colors.textMuted}>
                Live-Transkription wird in diesem Browser nicht unterstützt. Nach dem Stoppen wird
                – sofern verfügbar – automatisch transkribiert; sonst kannst du den Text manuell
                eingeben.
              </AppText>
            )}
          </Card>
        ) : null}
      </View>
    );
  }

  // ---------- IDLE ----------
  return <Button label="Aufnahme starten" icon="mic" onPress={handleStart} />;
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  flex: { flex: 1 },
  recHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  recDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.error },
  recDotPaused: { backgroundColor: colors.textMuted },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.error },
  liveText: { marginTop: spacing.xs, minHeight: 44, lineHeight: 24 },
  waves: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 56, marginVertical: spacing.sm },
  waveBar: { width: 6, borderRadius: 3, backgroundColor: colors.primary },
  // Aktionsreihe: gleich große Pills, dürfen schrumpfen, kein Overflow.
  actions: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.sm, marginTop: spacing.sm },
  pill: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 50,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  pillNeutral: { backgroundColor: colors.surfaceAlt },
  pillPrimary: { backgroundColor: colors.primary },
  pillDisabled: { opacity: 0.6 },
  pillLabel: { flexShrink: 1 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  playBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  playerBody: { flex: 1, gap: spacing.xs },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
  transHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  transInput: { minHeight: 80, textAlignVertical: 'top' },
  transStatusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  transNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
});
