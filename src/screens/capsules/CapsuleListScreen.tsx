import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Screen,
  AppText,
  Button,
  Card,
  EmptyState,
  Loading,
  SectionHeader,
} from '@/components';
import { useFamily } from '@/context/FamilyContext';
import { listMyCapsules, listUpcomingForMe } from '@/api/timeCapsules';
import { qk } from '@/api/queryKeys';
import { formatDate, openingCountdown } from '@/lib/format';
import { colors, spacing, radius } from '@/theme';
import type { ContentType, TimeCapsule, UpcomingCapsule } from '@/types/models';
import type { CapsulesStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<CapsulesStackParamList, 'CapsuleList'>;

const TYPE_META: Record<
  ContentType,
  { label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  text: { label: 'Text', icon: 'document-text-outline' },
  photo: { label: 'Foto', icon: 'image-outline' },
  audio: { label: 'Audio', icon: 'mic-outline' },
};

export function CapsuleListScreen({ navigation }: Props) {
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;

  const upcomingQuery = useQuery({
    queryKey: qk.upcomingCapsules(),
    queryFn: () => listUpcomingForMe(),
  });

  const mineQuery = useQuery({
    queryKey: qk.capsules(familyId),
    queryFn: () => listMyCapsules(familyId),
  });

  const isLoading = upcomingQuery.isLoading || mineQuery.isLoading;
  const isRefetching = upcomingQuery.isRefetching || mineQuery.isRefetching;

  function refetch() {
    upcomingQuery.refetch();
    mineQuery.refetch();
  }

  if (isLoading) {
    return (
      <Screen>
        <Loading message="Zeitkapseln werden geladen …" />
      </Screen>
    );
  }

  const upcoming = upcomingQuery.data ?? [];
  const mine = mineQuery.data ?? [];
  const isEmpty = upcoming.length === 0 && mine.length === 0;

  return (
    <Screen
      refreshing={isRefetching}
      onRefresh={refetch}
      contentStyle={styles.content}
    >
      <Button
        label="+ Zeitkapsel erstellen"
        icon="add"
        onPress={() => navigation.navigate('CapsuleForm')}
      />

      {isEmpty ? (
        <EmptyState
          icon="time-outline"
          title="Noch keine Zeitkapseln"
          message="Erstelle eine Zeitkapsel für einen besonderen Moment in der Zukunft."
          actionLabel="Zeitkapsel erstellen"
          onAction={() => navigation.navigate('CapsuleForm')}
        />
      ) : null}

      {upcoming.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Für mich" />
          <View style={styles.list}>
            {upcoming.map((capsule) => (
              <UpcomingCapsuleCard key={capsule.id} capsule={capsule} />
            ))}
          </View>
        </View>
      ) : null}

      {mine.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Von mir erstellt" />
          <View style={styles.list}>
            {mine.map((capsule) => (
              <MyCapsuleCard
                key={capsule.id}
                capsule={capsule}
                onPress={() =>
                  navigation.navigate('CapsuleDetail', { capsuleId: capsule.id })
                }
              />
            ))}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

function UpcomingCapsuleCard({ capsule }: { capsule: UpcomingCapsule }) {
  return (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.lockIcon}>
          <Ionicons name="lock-closed" size={24} color={colors.gold} />
        </View>
        <AppText variant="subheading" style={styles.title}>
          {capsule.title}
        </AppText>
      </View>
      <AppText variant="body" color={colors.textSecondary}>
        Diese Zeitkapsel öffnet sich am {formatDate(capsule.open_at)}.
      </AppText>
      <AppText variant="caption" color={colors.primaryDark}>
        {openingCountdown(capsule.open_at)}
      </AppText>
    </Card>
  );
}

function MyCapsuleCard({
  capsule,
  onPress,
}: {
  capsule: TimeCapsule;
  onPress: () => void;
}) {
  const meta = TYPE_META[capsule.content_type];

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.cardHeader}>
        <AppText variant="subheading" style={styles.title}>
          {capsule.title}
        </AppText>
        <View style={styles.badge}>
          <Ionicons name={meta.icon} size={16} color={colors.primaryDark} />
          <AppText variant="caption" color={colors.primaryDark}>
            {meta.label}
          </AppText>
        </View>
      </View>

      <View style={styles.stateRow}>
        <Ionicons
          name={capsule.is_opened ? 'lock-open-outline' : 'lock-closed-outline'}
          size={18}
          color={capsule.is_opened ? colors.success : colors.textMuted}
        />
        <AppText
          variant="caption"
          color={capsule.is_opened ? colors.success : colors.textMuted}
        >
          {capsule.is_opened ? 'Geöffnet' : 'Gesperrt'}
        </AppText>
      </View>

      <AppText variant="caption" color={colors.primaryDark}>
        {openingCountdown(capsule.open_at)}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingTop: spacing.md },
  section: { gap: spacing.sm },
  list: { gap: spacing.md },
  card: { gap: spacing.sm },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  lockIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  stateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
