import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors, radius, spacing } from '@/theme';

/** Dezenter rechtlicher Hinweis (Haftungsausschluss / Aufklärung). */
export function Disclaimer({
  text,
  icon = 'information-circle-outline',
  tone = 'neutral',
}: {
  text: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: 'neutral' | 'warning';
}) {
  const accent = tone === 'warning' ? colors.error : colors.textSecondary;
  const bg = tone === 'warning' ? `${colors.error}14` : colors.surfaceAlt;
  return (
    <View style={[styles.box, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={16} color={accent} style={styles.icon} />
      <AppText variant="caption" color={colors.textSecondary} style={styles.text}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', gap: spacing.sm, borderRadius: radius.md, padding: spacing.md },
  icon: { marginTop: 1 },
  text: { flex: 1 },
});
