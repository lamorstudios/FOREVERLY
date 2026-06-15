import { View, Image, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { colors, radius } from '@/theme';

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
}

/** Rundes Profilbild; fällt auf Initialen zurück. */
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
        style={{ fontSize: size * 0.4 }}
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
  image: { backgroundColor: colors.surfaceAlt },
  fallback: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
