import { View, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  Screen,
  AppText,
  Card,
  Avatar,
  SignedImage,
  EmptyState,
  Loading,
} from '@/components';
import { colors, spacing, radius } from '@/theme';
import { qk } from '@/api/queryKeys';
import { getImportantPeople } from '@/api/historian';
import { fullName } from '@/lib/format';
import { useFamily } from '@/context/FamilyContext';
import type { HomeStackParamList } from '@/navigation/types';

const AVATAR_SIZE = 64;

function firstSentence(text: string): string {
  const match = text.trim().match(/^.*?[.!?](\s|$)/);
  return (match ? match[0] : text).trim();
}

function countsSummary(memory: number, photo: number, audio: number): string {
  return `${memory} Erinnerungen · ${photo} Fotos · ${audio} Audios`;
}

export function ImportantPeopleScreen({
  navigation,
}: NativeStackScreenProps<HomeStackParamList, 'ImportantPeople'>) {
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;

  const peopleQuery = useQuery({
    queryKey: qk.importantPeople(familyId),
    queryFn: () => getImportantPeople(familyId),
  });

  if (peopleQuery.isLoading) {
    return (
      <Screen>
        <Loading message="Wichtige Personen werden ermittelt …" />
      </Screen>
    );
  }

  const people = peopleQuery.data ?? [];

  return (
    <Screen
      refreshing={peopleQuery.isFetching}
      onRefresh={() => peopleQuery.refetch()}
    >
      <AppText variant="display">Wichtige Personen</AppText>
      <AppText variant="body" color={colors.textSecondary}>
        Die Menschen, über die in eurer Familie am meisten festgehalten ist.
      </AppText>

      {people.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="Noch keine Personen erfasst"
          message="Legt Profile an und fügt Erinnerungen, Fotos oder Aufnahmen hinzu, damit der Historiker hier Personen hervorheben kann."
        />
      ) : (
        <View style={styles.list}>
          {people.map((insight) => {
            const name = fullName(
              insight.person.first_name,
              insight.person.last_name,
            );
            return (
              <Card
                key={insight.person.id}
                onPress={() =>
                  navigation.navigate('PersonInsight', {
                    personId: insight.person.id,
                  })
                }
              >
                <View style={styles.row}>
                  {insight.person.avatar_url ? (
                    <SignedImage
                      bucket="photos"
                      path={insight.person.avatar_url}
                      style={styles.avatar}
                    />
                  ) : (
                    <Avatar name={name} size={AVATAR_SIZE} />
                  )}
                  <View style={styles.body}>
                    <AppText variant="subheading">{name}</AppText>
                    <AppText variant="caption" color={colors.textMuted}>
                      {countsSummary(
                        insight.memoryCount,
                        insight.photoCount,
                        insight.audioCount,
                      )}
                    </AppText>
                    {insight.biography ? (
                      <AppText
                        variant="body"
                        color={colors.textSecondary}
                        numberOfLines={2}
                      >
                        {firstSentence(insight.biography)}
                      </AppText>
                    ) : null}
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, marginTop: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.pill,
  },
  body: { flex: 1, minWidth: 0, gap: spacing.xs },
});
