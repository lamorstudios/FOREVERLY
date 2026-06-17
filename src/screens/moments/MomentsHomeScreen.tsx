import { View, Pressable, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen, AppText, Card } from '@/components';
import { challengeOfMonth, MONTH_NAMES } from '@/constants/events';
import { colors, radius, spacing, shadow } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'MomentsHome'>;

interface HubCard {
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: 'Feed' | 'Events' | 'Chronik' | 'Challenges' | 'PhotoMemories';
}

const CARDS: HubCard[] = [
  { label: 'Familienfeed', description: 'Teilt Momente mit der Familie', icon: 'images-outline', color: colors.gold, route: 'Feed' },
  { label: 'Familienevents', description: 'Grillfest, Geburtstag & mehr', icon: 'calendar-outline', color: colors.primary, route: 'Events' },
  { label: 'Familienchronik', description: 'Eure Geschichte chronologisch', icon: 'time-outline', color: colors.relationMarried, route: 'Chronik' },
  { label: 'Challenges', description: 'Monatliche Erinnerungs-Ideen', icon: 'trophy-outline', color: colors.success, route: 'Challenges' },
  { label: 'Foto-Erinnerungen', description: 'Wo Erinnerungen fehlen', icon: 'bulb-outline', color: colors.relationAdoption, route: 'PhotoMemories' },
];

export function MomentsHomeScreen({ navigation }: Props) {
  const month = new Date().getMonth() + 1;
  const challenge = challengeOfMonth(month);

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.intro}>
        <AppText variant="heading">Familienmomente</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Schafft gemeinsam neue Erinnerungen – teilt Momente, plant Events und
          bewahrt eure Familiengeschichte.
        </AppText>
      </View>

      {/* Challenge des Monats */}
      <Pressable onPress={() => navigation.navigate('Challenges')}>
        <Card style={styles.challenge}>
          <Ionicons name="trophy" size={26} color={colors.gold} />
          <View style={styles.challengeText}>
            <AppText variant="caption" color={colors.textMuted}>
              Challenge im {MONTH_NAMES[month - 1]}
            </AppText>
            <AppText variant="bodyStrong">{challenge.title}</AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Card>
      </Pressable>

      {CARDS.map((c) => (
        <Card key={c.route} onPress={() => navigation.navigate(c.route)}>
          <View style={styles.row}>
            <View style={[styles.icon, { backgroundColor: c.color }]}>
              <Ionicons name={c.icon} size={26} color={colors.textOnAccent} />
            </View>
            <View style={styles.rowText}>
              <AppText variant="subheading">{c.label}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {c.description}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingTop: spacing.md },
  intro: { gap: spacing.sm },
  challenge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.goldSoft,
    ...shadow.soft,
  },
  challengeText: { flex: 1, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
});
