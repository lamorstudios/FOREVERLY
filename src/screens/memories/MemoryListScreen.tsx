import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Button, Card, EmptyState, Loading } from '@/components';
import { useFamily } from '@/context/FamilyContext';
import { listMemories } from '@/api/memories';
import { qk } from '@/api/queryKeys';
import { formatDate, formatRelative } from '@/lib/format';
import { colors, spacing, radius } from '@/theme';
import type { ContentType, Memory } from '@/types/models';
import type { MemoriesStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<MemoriesStackParamList, 'MemoryList'>;

const TYPE_META: Record<
  ContentType,
  { label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  text: { label: 'Text', icon: 'document-text-outline' },
  photo: { label: 'Foto', icon: 'image-outline' },
  audio: { label: 'Audio', icon: 'mic-outline' },
};

export function MemoryListScreen({ navigation, route }: Props) {
  const personId = route.params?.personId;
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: qk.memories(familyId, personId),
    queryFn: () => listMemories(familyId, personId),
  });

  if (isLoading) {
    return (
      <Screen>
        <Loading message="Erinnerungen werden geladen …" />
      </Screen>
    );
  }

  const memories = data ?? [];

  return (
    <Screen refreshing={isRefetching} onRefresh={refetch} contentStyle={styles.content}>
      <Button
        label="Erinnerung hinzufügen"
        icon="add"
        onPress={() => navigation.navigate('MemoryForm', { personId })}
      />

      {memories.length === 0 ? (
        <EmptyState
          icon="sparkles-outline"
          title="Noch keine Erinnerungen"
          message="Halte den ersten Moment fest, der euch wichtig ist."
          actionLabel="Erinnerung hinzufügen"
          onAction={() => navigation.navigate('MemoryForm', { personId })}
        />
      ) : (
        <View style={styles.list}>
          {memories.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              onPress={() =>
                navigation.navigate('MemoryDetail', { memoryId: memory.id })
              }
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

function MemoryCard({
  memory,
  onPress,
}: {
  memory: Memory;
  onPress: () => void;
}) {
  const meta = TYPE_META[memory.content_type];
  const dateLabel = memory.occurred_on
    ? formatDate(memory.occurred_on)
    : formatRelative(memory.created_at);

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.cardHeader}>
        <AppText variant="subheading" style={styles.title}>
          {memory.title}
        </AppText>
        <View style={styles.badge}>
          <Ionicons name={meta.icon} size={16} color={colors.primaryDark} />
          <AppText variant="caption" color={colors.primaryDark}>
            {meta.label}
          </AppText>
        </View>
      </View>
      {memory.description ? (
        <AppText variant="body" color={colors.textSecondary} numberOfLines={2}>
          {memory.description}
        </AppText>
      ) : null}
      <AppText variant="caption" color={colors.textMuted}>
        {dateLabel}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingTop: spacing.md },
  list: { gap: spacing.md },
  card: { gap: spacing.sm },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: { flex: 1, minWidth: 0 },
  badge: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
});
