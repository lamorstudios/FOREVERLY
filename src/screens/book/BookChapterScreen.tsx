import { StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen, AppText, EmptyState, Loading } from '@/components';
import { colors, spacing } from '@/theme';
import { qk } from '@/api/queryKeys';
import { getBookByProjectId } from '@/api/book';
import { BookBlocks } from './_blocks';
import { useFamily } from '@/context/FamilyContext';
import type { HomeStackParamList } from '@/navigation/types';

export function BookChapterScreen({
  route,
}: NativeStackScreenProps<HomeStackParamList, 'BookChapter'>) {
  const { projectId, chapterKey } = route.params;
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;

  const bookQuery = useQuery({
    queryKey: qk.book(familyId, projectId),
    queryFn: () => getBookByProjectId(familyId, projectId),
  });

  if (bookQuery.isLoading) {
    return (
      <Screen>
        <Loading message="Kapitel wird geladen …" />
      </Screen>
    );
  }

  const chapter = bookQuery.data?.book.chapters.find((c) => c.key === chapterKey);

  if (!chapter) {
    return (
      <Screen>
        <EmptyState
          icon="book-outline"
          title="Kapitel nicht gefunden"
          message="Dieses Kapitel ist nicht mehr verfügbar."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="title" color={colors.textPrimary} style={styles.title}>
        {chapter.title}
      </AppText>
      <BookBlocks blocks={chapter.blocks} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.lg },
});
