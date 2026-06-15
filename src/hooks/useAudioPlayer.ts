import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';

/** Einfacher Audio-Player für eine entfernte/lokale URL. */
export function useAudioPlayer(url?: string | null) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => undefined);
    };
  }, []);

  const onStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setIsPlaying(status.isPlaying);
    if (status.didJustFinish) {
      setIsPlaying(false);
      soundRef.current?.setPositionAsync(0);
    }
  }, []);

  const toggle = useCallback(async () => {
    if (!url) return;
    try {
      if (!soundRef.current) {
        setLoading(true);
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true },
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

  return { isPlaying, loading, toggle };
}
