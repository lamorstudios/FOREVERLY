import { View, Pressable, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Screen, AppText } from '@/components';
import { colors, radius, spacing, shadow } from '@/theme';
import type { HomeStackParamList, MainTabParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'SeniorMode'>;

interface BigAction {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

/**
 * Seniorenmodus: maximale Einfachheit. Vier sehr große Schnellzugriffe,
 * keine komplizierten Menüs.
 */
export function SeniorModeScreen({ navigation }: Props) {
  const tabNav = navigation.getParent<BottomTabNavigationProp<MainTabParamList>>();

  const actions: BigAction[] = [
    {
      label: 'Audio aufnehmen',
      icon: 'mic',
      color: colors.primary,
      onPress: () =>
        tabNav?.navigate('MemoriesTab', { screen: 'AudioRecord' }),
    },
    {
      label: 'Familie ansehen',
      icon: 'people',
      color: colors.relationMarried,
      onPress: () => tabNav?.navigate('FamilyTab', { screen: 'Network' }),
    },
    {
      label: 'Status senden',
      icon: 'happy',
      color: colors.success,
      onPress: () => navigation.navigate('Status'),
    },
    {
      label: 'Notfall',
      icon: 'alert-circle',
      color: colors.error,
      onPress: () => navigation.navigate('Emergency'),
    },
  ];

  return (
    <Screen contentStyle={styles.content}>
      <AppText variant="display" center>
        Hallo! 👋
      </AppText>
      <AppText variant="subheading" color={colors.textSecondary} center>
        Bitte tippe auf eine große Schaltfläche.
      </AppText>

      <View style={styles.grid}>
        {actions.map((a) => (
          <Pressable
            key={a.label}
            onPress={a.onPress}
            accessibilityRole="button"
            accessibilityLabel={a.label}
            style={({ pressed }) => [
              styles.tile,
              { backgroundColor: a.color },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name={a.icon} size={64} color={colors.textOnAccent} />
            <AppText
              variant="heading"
              color={colors.textOnAccent}
              center
              style={styles.tileLabel}
            >
              {a.label}
            </AppText>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingTop: spacing.lg },
  grid: { gap: spacing.lg, marginTop: spacing.md },
  tile: {
    minHeight: 150,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    ...shadow.card,
  },
  tileLabel: { marginTop: spacing.xs },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});
