import { View, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen, AppText, Card, Button } from '@/components';
import { MEMORY_CHALLENGES, challengeOfMonth, MONTH_NAMES } from '@/constants/events';
import { colors, radius, spacing, shadow } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { MemoryChallenge } from '@/types/models';

type Props = NativeStackScreenProps<HomeStackParamList, 'Challenges'>;

const PROMPT_ICON: Record<MemoryChallenge['prompt_type'], keyof typeof Ionicons.glyphMap> = {
  photo: 'camera-outline',
  audio: 'mic-outline',
  memory: 'sparkles-outline',
};

export function ChallengesScreen({ navigation }: Props) {
  const month = new Date().getMonth() + 1;
  const current = challengeOfMonth(month);
  const others = MEMORY_CHALLENGES.filter((c) => c.key !== current.key);

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.intro}>
        <AppText variant="heading">Erinnerungs-Challenges</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Kleine monatliche Ideen, um gemeinsam mehr Erinnerungen zu sammeln.
        </AppText>
      </View>

      {/* Challenge des Monats */}
      <Card style={styles.current}>
        <View style={styles.currentHead}>
          <Ionicons name="trophy" size={24} color={colors.gold} />
          <AppText variant="caption" color={colors.textMuted}>
            Challenge im {MONTH_NAMES[month - 1]}
          </AppText>
        </View>
        <AppText variant="title" color={colors.primaryDark}>
          {current.title}
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          {current.description}
        </AppText>
        <Button label="Jetzt festhalten" icon={PROMPT_ICON[current.prompt_type]} onPress={() => navigation.navigate('MomentCompose')} />
      </Card>

      <AppText variant="subheading" style={styles.more}>
        Weitere Ideen
      </AppText>
      {others.map((c) => (
        <Card key={c.key}>
          <View style={styles.row}>
            <View style={styles.icon}>
              <Ionicons name={PROMPT_ICON[c.prompt_type]} size={22} color={colors.primary} />
            </View>
            <View style={styles.rowText}>
              <AppText variant="bodyStrong">{c.title}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {c.description}
              </AppText>
            </View>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingTop: spacing.md },
  intro: { gap: spacing.sm },
  current: { gap: spacing.sm, backgroundColor: colors.goldSoft, ...shadow.soft },
  currentHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  more: { marginTop: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
});
