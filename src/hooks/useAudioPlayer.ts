import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';

/** Audio-Player für eine entfernte/lokale URL inkl. Fortschritt (Position/Dauer). */
export function useAudioPlayer(url?: string | null) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);

  const onStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setIsPlaying(status.isPlaying);
    setPositionMillis(status.positionMillis ?? 0);
    if (status.durationMillis) setDurationMillis(status.durationMillis);
    if (status.didJustFinish) {
      setIsPlaying(false);
      setPositionMillis(0);
      soundRef.current?.setPositionAsync(0);
    }
  }, []);

  // Bei Wechsel der Quelle (z. B. neue Aufnahme) den alten Sound entladen + zurücksetzen.
  useEffect(() => {
    setIsPlaying(false);
    setPositionMillis(0);
    setDurationMillis(0);
    return () => {
      soundRef.current?.unloadAsync().catch(() => undefined);
      soundRef.current = null;
    };
  }, [url]);

  const toggle = useCallback(async () => {
    if (!url) return;
    try {
      if (!soundRef.current) {
        setLoading(true);
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true, progressUpdateIntervalMillis: 150 },
          onStatus,
        );
        soundRef.current = sound;
        setLoading(false);
        return;
      }
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    } catch {
      setLoading(false);
    }
  }, [url, onStatus]);

  const progress = durationMillis > 0 ? Math.min(1, positionMillis / durationMillis) : 0;

  return { isPlaying, loading, toggle, positionMillis, durationMillis, progress };
}
