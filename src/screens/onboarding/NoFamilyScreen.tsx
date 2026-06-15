import { View, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen, AppText, Button, Card } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme';
import type { OnboardingStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'NoFamily'>;

export function NoFamilyScreen({ navigation }: Props) {
  const { signOut } = useAuth();

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Ionicons name="home" size={36} color={colors.gold} />
        </View>
        <AppText variant="title" center>
          Willkommen bei Foreverly
        </AppText>
        <AppText variant="body" color={colors.textSecondary} center>
          Erstelle eine neue Familie oder tritt einer bestehenden Familie bei,
          um loszulegen.
        </AppText>
      </View>

      <Card onPress={() => navigation.navigate('CreateFamily')}>
        <View style={styles.row}>
          <Ionicons name="add-circle-outline" size={32} color={colors.primary} />
          <View style={styles.rowText}>
            <AppText variant="subheading">Familie erstellen</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Gründe deine eigene Familie und lade andere ein.
            </AppText>
          </View>
        </View>
      </Card>

      <Card onPress={() => navigation.navigate('JoinFamily')}>
        <View style={styles.row}>
          <Ionicons name="key-outline" size={32} color={colors.primary} />
          <View style={styles.rowText}>
            <AppText variant="subheading">Familie beitreten</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Du hast einen Einladungscode? Tritt jetzt bei.
            </AppText>
          </View>
        </View>
      </Card>

      <Button label="Abmelden" variant="ghost" onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingTop: spacing.xl },
  header: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { flex: 1, gap: 2 },
});
