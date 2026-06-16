import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Card } from '@/components';
import { ROLE_ORDER, ROLE_META } from '@/lib/roles';
import { colors, spacing } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Roles'>;

const ICONS = {
  admin: 'shield-outline', member: 'person-outline', inner: 'heart-outline',
  trustee: 'shield-checkmark-outline', trusted: 'people-outline', guest: 'eye-outline',
} as const;

export function RolesScreen(_: Props) {
  return (
    <Screen>
      <AppText variant="title">Rollen & Rechte</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Klare Rollen sorgen dafür, dass jeder genau das sieht und darf, was vorgesehen ist.
      </AppText>
      {ROLE_ORDER.map((role) => (
        <Card key={role}>
          <View style={styles.row}>
            <View style={styles.iconCircle}><Ionicons name={ICONS[role]} size={22} color={colors.primary} /></View>
            <View style={styles.flex}>
              <AppText variant="bodyStrong">{ROLE_META[role].label}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>{ROLE_META[role].description}</AppText>
            </View>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginVertical: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 2 },
});
