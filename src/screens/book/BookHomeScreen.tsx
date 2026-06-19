import { View, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  Screen,
  AppText,
  Button,
  Card,
  Chip,
  EmptyState,
  Loading,
  SignedImage,
} from '@/components';
import { colors, spacing, radius } from '@/theme';
import { qk } from '@/api/queryKeys';
import { listBookProjects, deleteBookProject } from '@/api/book';
import { BOOK_TYPE_LABEL } from '@/book/types';
import { friendlyError } from '@/lib/errors';
import { useFamily } from '@/context/FamilyContext';
import type { HomeStackParamList } from '@/navigation/types';
import type { BookProject } from '@/types/models';

const STATUS_LABEL: Record<BookProject['status'], string> = {
  draft: 'Entwurf',
  ready: 'Bereit',
  exported: 'Exportiert',
};

export function BookHomeScreen({
  navigation,
}: NativeStackScreenProps<HomeStackParamList, 'BookHome'>) {
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();

  const projectsQuery = useQuery({
    queryKey: qk.bookProjects(familyId),
    queryFn: () => listBookProjects(familyId),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBookProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.bookProjects(familyId) });
    },
    onError: (error) => {
      Alert.alert('Fehler', friendlyError(error));
    },
  });

  const projects = projectsQuery.data ?? [];

  function confirmDelete(project: BookProject) {
    Alert.alert(
      'Buch löschen',
      `Möchtet ihr „${project.title}“ wirklich löschen? Eure Familiendaten bleiben dabei erhalten.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(project.id),
        },
      ],
    );
  }

  if (projectsQuery.isLoading) {
    return (
      <Screen>
        <Loading message="Eure Bücher werden geladen …" />
      </Screen>
    );
  }

  return (
    <Screen
      refreshing={projectsQuery.isFetching}
      onRefresh={() => projectsQuery.refetch()}
    >
      <AppText variant="display">Familienbuch</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Aus euren Erinnerungen, Fotos und Geschichten entsteht hier ein
        liebevoll gestaltetes Buch – ganz automatisch aus euren Familiendaten.
      </AppText>

      <Button
        label="Neues Buch erstellen"
        icon="add-circle-outline"
        onPress={() => navigation.navigate('BookCreate')}
        style={styles.createButton}
      />

      {projects.length === 0 ? (
        <EmptyState
          icon="book-outline"
          title="Noch kein Familienbuch"
          message="Erstellt euer erstes Buch und haltet eure schönsten Geschichten für immer fest."
          actionLabel="Buch erstellen"
          onAction={() => navigation.navigate('BookCreate')}
        />
      ) : (
        <View style={styles.list}>
          {projects.map((project) => (
            <Card
              key={project.id}
              padded={false}
              onPress={() =>
                navigation.navigate('BookPreview', { projectId: project.id })
              }
              style={styles.card}
            >
              <View style={styles.banner}>
                <SignedImage
                  bucket="photos"
                  path={project.cover_photo_path}
                  style={styles.bannerImage}
                />
                <Pressable
                  hitSlop={10}
                  onPress={() => confirmDelete(project)}
                  style={styles.trash}
                >
                  <Ionicons name="trash-outline" size={22} color={colors.surface} />
                </Pressable>
              </View>

              <View style={styles.cardBody}>
                <AppText variant="title" color={colors.textPrimary}>
                  {project.title}
                </AppText>
                {project.subtitle ? (
                  <AppText variant="body" color={colors.textSecondary}>
                    {project.subtitle}
                  </AppText>
                ) : null}

                <View style={styles.metaRow}>
                  <Chip label={BOOK_TYPE_LABEL[project.type]} />
                  <Chip
                    label={STATUS_LABEL[project.status]}
                    color={project.status === 'exported' ? colors.success : colors.gold}
                  />
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: spacing.sm },
  createButton: { marginTop: spacing.lg, marginBottom: spacing.lg },
  list: { gap: spacing.lg },
  card: { overflow: 'hidden' },
  banner: { height: 180, backgroundColor: colors.surfaceAlt },
  bannerImage: { width: '100%', height: 180 },
  trash: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.overlay,
    borderRadius: radius.pill,
    padding: spacing.sm,
  },
  cardBody: { padding: spacing.lg, gap: spacing.sm },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
