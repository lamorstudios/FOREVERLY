import { useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { Card } from './Card';
import { Button } from './Button';
import { useAudioRecorder, type RecordingResult } from '@/hooks/useAudioRecorder';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { formatDuration } from '@/lib/format';
import { colors, spacing, radius, shadow, withAlpha } from '@/theme';

interface Props {
  value: RecordingResult | null;
  onChange: (value: RecordingResult | null) => void;
}

const BARS = 28;
// Pseudo-zufällige, aber stabile Balkenhöhen (0.2–1) für eine Wellenform-Optik.
const SEED = [0.4, 0.7, 0.3, 0.9, 0.5, 1, 0.35, 0.6, 0.8, 0.45, 0.95, 0.55, 0.25, 0.75];

/**
 * Moderne Sprachnachricht-Aufnahme (WhatsApp/Telegram-Stil):
 * Aufnahme mit pulsierendem Mikro + animierter Wellenform und Live-Dauer,
 * danach Player mit Play/Pause, Fortschritt, Position/Gesamtdauer sowie
 * Löschen / Neu aufnehmen. Audio kann vor dem Speichern angehört werden.
 */
export function VoiceRecorder({ value, onChange }: Props) {
  const recorder = useAudioRecorder();
  const player = useAudioPlayer(value?.uri);
  const wave = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!recorder.isRecording) return;
    const w = Animated.loop(
      Animated.sequence([
        Animated.timing(wave, { toValue: 1, duration: 550, useNativeDriver: false }),
        Animated.timing(wave, { toValue: 0, duration: 550, useNativeDriver: false }),
      ]),
    );
    const p = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    );
    w.start();
    p.start();
    return () => {
      w.stop();
      p.stop();
    };
  }, [recorder.isRecording, wave, pulse]);

  async function handleStart() {
    onChange(null);
    recorder.reset();
    await recorder.start();
  }
  async function handleStop() {
    const r = await recorder.stop();
    if (r) onChange(r);
  }
  function handleDelete() {
    onChange(null);
    recorder.reset();
  }

  // --- Aufnahme läuft ---
  if (recorder.isRecording) {
    return (
      <Card style={styles.card}>
        <View style={styles.recRow}>
          <Animated.View
            style={[
              styles.micPulse,
              {
                transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) }],
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] }),
              },
            ]}
          >
            <Ionicons name="mic" size={26} color={colors.textOnAccent} />
          </Animated.View>
          <View style={styles.waveWrap}>
            {Array.from({ length: BARS }).map((_, i) => {
              const base = SEED[i % SEED.length]!;
              const peak = 8 + base * 22 * (((i % 3) + 1) / 3);
              const h = wave.interpolate({ inputRange: [0, 1], outputRange: [8 + base * 6, peak] });
              return <Animated.View key={i} style={[styles.bar, { height: h, backgroundColor: colors.error }]} />;
            })}
          </View>
          <AppText variant="heading" style={styles.recTime}>{formatDuration(recorder.durationSeconds)}</AppText>
        </View>
        <Button label="Stopp" icon="stop-circle" variant="danger" onPress={handleStop} />
      </Card>
    );
  }

  // --- Aufnahme vorhanden: Player ---
  if (value) {
    const totalMs = player.durationMillis || value.durationSeconds * 1000;
    return (
      <Card style={styles.card}>
        <View style={styles.successRow}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <AppText variant="caption" color={colors.success}>Aufnahme bereit – jetzt anhören</AppText>
        </View>
        <View style={styles.playerRow}>
          <Pressable onPress={player.toggle} style={styles.playBtn} accessibilityRole="button" accessibilityLabel={player.isPlaying ? 'Pause' : 'Abspielen'}>
            <Ionicons name={player.isPlaying ? 'pause' : 'play'} size={30} color={colors.textOnAccent} />
          </Pressable>
          <View style={styles.flex}>
            <View style={styles.waveWrap}>
              {Array.from({ length: BARS }).map((_, i) => {
                const base = SEED[i % SEED.length]!;
                const filled = i / BARS <= player.progress;
                return <View key={i} style={[styles.bar, { height: 8 + base * 20, backgroundColor: filled ? colors.primary : withAlpha(colors.primary, 0.25) }]} />;
              })}
            </View>
            <View style={styles.timeRow}>
              <AppText variant="caption" color={colors.textMuted}>{formatDuration(Math.round(player.positionMillis / 1000))}</AppText>
              <AppText variant="caption" color={colors.textMuted}>{formatDuration(Math.round(totalMs / 1000))}</AppText>
            </View>
          </View>
        </View>
        <View style={styles.actions}>
          <Button label="Neu aufnehmen" icon="mic-outline" variant="secondary" fullWidth={false} onPress={handleStart} />
          <Button label="Löschen" icon="trash-outline" variant="ghost" fullWidth={false} onPress={handleDelete} />
        </View>
      </Card>
    );
  }

  // --- Leerzustand ---
  return (
    <Card style={styles.card}>
      <Ionicons name="mic-outline" size={40} color={colors.primary} />
      <AppText variant="body" color={colors.textSecondary} center>
        Nimm deine Sprachnachricht auf und höre sie vor dem Speichern an.
      </AppText>
      <Button label="Aufnahme starten" icon="mic" onPress={handleStart} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'stretch', gap: spacing.md, paddingVertical: spacing.lg },
  recRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  micPulse: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center',
  },
  recTime: { fontVariant: ['tabular-nums'], minWidth: 56, textAlign: 'right' },
  waveWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 3, height: 40, overflow: 'hidden' },
  bar: { width: 3, borderRadius: 2, backgroundColor: colors.primary },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, justifyContent: 'center' },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  playBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    ...shadow.soft,
  },
  flex: { flex: 1, minWidth: 0 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md },
});
