import { View, Image, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { colors, withAlpha } from '@/theme';

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
}

/** Rundes Profilbild mit hochwertigem Platzhalter (Initialen + weicher Tönung). */
export function Avatar({ uri, name, size = 56 }: AvatarProps) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };
  const initials = getInitials(name);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, dimension]}
        accessibilityIgnoresInvertColors
      />
    );
  }

  return (
    <View style={[styles.fallback, dimension]}>
      <AppText
        variant="subheading"
        color={colors.primaryDark}
        style={{ fontSize: size * 0.38, fontWeight: '700' }}
      >
        {initials}
      </AppText>
    </View>
  );
}

function getInitials(name?: string | null): string {
  if (!name) return '♥';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join('') || '♥';
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fallback: {
    backgroundColor: withAlpha(colors.primary, 0.13),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.goldSoft,
  },
});
