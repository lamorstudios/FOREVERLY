import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { AppText } from './AppText';
import { Card } from './Card';
import { Button } from './Button';
import { colors, spacing, radius } from '@/theme';

export interface VideoValue {
  uri: string;
}

interface Props {
  value: VideoValue | null;
  onChange: (value: VideoValue | null) => void;
}

const PERM_MSG = 'Bitte erlaube den Zugriff auf Mikrofon/Kamera, um deine Geschichte aufzunehmen.';
const UNSUPPORTED_MSG =
  'Diese Aufnahmefunktion wird von deinem Browser aktuell nicht unterstützt. Du kannst stattdessen Text verwenden oder später ein Video hochladen.';

/**
 * Video aufnehmen/auswählen, vor dem Speichern ansehen, löschen, neu aufnehmen.
 * Nutzt die Gerätekamera (mobil) bzw. Datei-/Kamera-Auswahl (Web/Desktop) und
 * zeigt eine Vorschau mit Wiedergabe. Berechtigungen & Nicht-Unterstützung
 * werden freundlich behandelt (keine leere Fläche).
 */
export function VideoRecorder({ value, onChange }: Props) {
  const [error, setError] = useState<string | null>(null);

  async function record() {
    setError(null);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setError(PERM_MSG);
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        videoMaxDuration: 120,
        quality: 0.7,
      });
      if (!res.canceled && res.assets?.[0]) onChange({ uri: res.assets[0].uri });
    } catch {
      setError(UNSUPPORTED_MSG);
    }
  }

  async function pickLibrary() {
    setError(null);
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 0.7,
      });
      if (!res.canceled && res.assets?.[0]) onChange({ uri: res.assets[0].uri });
    } catch {
      setError(UNSUPPORTED_MSG);
    }
  }

  if (value) {
    return (
      <Card style={styles.card}>
        <View style={styles.successRow}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <AppText variant="caption" color={colors.success}>Video bereit – jetzt ansehen</AppText>
        </View>
        <Video
          source={{ uri: value.uri }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          style={styles.video}
        />
        <View style={styles.actions}>
          <Button label="Neu aufnehmen" icon="videocam-outline" variant="secondary" fullWidth={false} onPress={record} />
          <Button label="Löschen" icon="trash-outline" variant="ghost" fullWidth={false} onPress={() => { onChange(null); setError(null); }} />
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Ionicons name="videocam-outline" size={40} color={colors.primary} />
      <AppText variant="body" color={colors.textSecondary} center>
        Nimm ein kurzes Video auf und sieh es dir vor dem Speichern an.
      </AppText>
      <Button label="Video aufnehmen" icon="videocam" onPress={record} />
      <Button label="Aus Galerie wählen" icon="film-outline" variant="secondary" onPress={pickLibrary} />
      {error ? (
        <AppText variant="caption" color={colors.error} center>{error}</AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'stretch', gap: spacing.md, paddingVertical: spacing.lg },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, justifyContent: 'center' },
  video: { width: '100%', height: 220, borderRadius: radius.lg, backgroundColor: '#000' },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md },
});
