import { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors, radius, spacing } from '@/theme';

const KEY = 'foreverly.betaDismissed';

/**
 * Dezenter Beta-Hinweis. Einmal schließbar (pro Gerät gemerkt).
 * Erscheint in allen Modi während der Beta-Phase.
 */
export function BetaBanner() {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => setHidden(v === 'true'));
  }, []);

  if (hidden) return null;

  function dismiss() {
    setHidden(true);
    void AsyncStorage.setItem(KEY, 'true');
  }

  return (
    <View style={styles.banner}>
      <Ionicons name="flask-outline" size={18} color={colors.bronze} />
      <AppText variant="caption" color={colors.textSecondary} style={styles.text}>
        Foreverly befindet sich aktuell in der Beta. Funktionen können sich noch ändern.
      </AppText>
      <Pressable onPress={dismiss} hitSlop={10}>
        <Ionicons name="close" size={18} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  text: { flex: 1 },
});
