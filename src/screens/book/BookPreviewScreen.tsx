import { useState } from 'react';
import {
  View,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
  Alert,
  Platform,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  Screen,
  AppText,
  Button,
  Card,
  TextField,
  SectionHeader,
  EmptyState,
  Loading,
  SignedImage,
} from '@/components';
import { colors, spacing, radius } from '@/theme';
import { qk } from '@/api/queryKeys';
import { getBookByProjectId, updateBookProject, exportBook } from '@/api/book';
import { listPhotos } from '@/api/media';
import { BookBlocks, coverStyle } from './_blocks';
import { friendlyError } from '@/lib/errors';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import type { HomeStackParamList } from '@/navigation/types';
import type { BookExportFormat } from '@/types/models';

type EditField = 'title' | 'subtitle' | null;

export function BookPreviewScreen({
  route,
  navigation,
}: NativeStackScreenProps<HomeStackParamList, 'BookPreview'>) {
  const { projectId } = route.params;
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const [editField, setEditField] = useState<EditField>(null);
  const [editValue, setEditValue] = useState('');
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);

  const bookQuery = useQuery({
    queryKey: qk.book(familyId, projectId),
    queryFn: () => getBookByProjectId(familyId, projectId),
  });

  const photosQuery = useQuery({
    queryKey: qk.photos(familyId),
    queryFn: () => listPhotos(familyId),
    enabled: coverPickerOpen,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: qk.book(familyId, projectId) });
    queryClient.invalidateQueries({ queryKey: qk.bookProjects(familyId) });
  }

  const updateMutation = useMutation({
    mutationFn: (patch: Parameters<typeof updateBookProject>[1]) =>
      updateBookProject(projectId, patch),
    onSuccess: () => invalidate(),
    onError: (error) => Alert.alert('Fehler', friendlyError(error)),
  });

  const exportMutation = useMutation({
    mutationFn: (format: BookExportFormat) =>
      exportBook({ familyId, projectId, format, createdBy: userId! }),
    onSuccess: async (result, format) => {
      try {
        if (Platform.OS === 'web' && format !== 'share') {
          const w = window.open('', '_blank');
          if (w) {
            w.document.write(result.html);
            w.document.close();
            w.focus();
            w.print();
          }
        } else if (format === 'share') {
          await Share.share({ message: result.book.title });
        } else {
          Alert.alert(
            'Export bereit',
            'Dein Familienbuch wurde vorbereitet und ist zum Drucken bereit.',
          );
        }
      } catch (error) {
        Alert.alert('Fehler', friendlyError(error));
      } finally {
        queryClient.invalidateQueries({ queryKey: qk.bookProjects(familyId) });
      }
    },
    onError: (error) => Alert.alert('Fehler', friendlyError(error)),
  });

  if (bookQuery.isLoading) {
    return (
      <Screen>
        <Loading message="Euer Buch wird vorbereitet …" />
      </Screen>
    );
  }

  const result = bookQuery.data;
  if (!result) {
    return (
      <Screen>
        <EmptyState
          icon="book-outline"
          title="Buch nicht gefunden"
          message="Dieses Familienbuch ist nicht mehr verfügbar."
        />
      </Screen>
    );
  }

  const { project, book } = result;
  const chapters = book.chapters;
  const hidden = project.hidden_chapters;
  const firstVisibleChapter = chapters.find((c) => !hidden.includes(c.key));

  function openEdit(field: 'title' | 'subtitle') {
    setEditField(field);
    setEditValue(
      field === 'title' ? project.title : project.subtitle ?? '',
    );
  }

  function saveEdit() {
    if (!editField) return;
    if (editField === 'title') {
      updateMutation.mutate({ title: editValue.trim() || project.title });
    } else {
      updateMutation.mutate({ subtitle: editValue.trim() || null });
    }
    setEditField(null);
  }

  function toggleVisibility(key: string) {
    const next = hidden.includes(key)
      ? hidden.filter((k) => k !== key)
      : [...hidden, key];
    updateMutation.mutate({ hidden_chapters: next });
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= chapters.length) return;
    const order = chapters.map((c) => c.key);
    const a = order[index];
    const b = order[target];
    if (a === undefined || b === undefined) return;
    order[index] = b;
    order[target] = a;
    updateMutation.mutate({ chapter_order: order });
  }

  return (
    <Screen>
      {/* Cover */}
      <Card padded={false} style={styles.coverCard}>
        <SignedImage bucket="photos" path={book.coverPhotoPath} style={coverStyle} />
        <View style={styles.coverBody}>
          <AppText variant="title" color={colors.textPrimary} center>
            {book.title}
          </AppText>
          {book.subtitle ? (
            <AppText
              variant="subheading"
              color={colors.textSecondary}
              center
              style={styles.coverSubtitle}
            >
              {book.subtitle}
            </AppText>
          ) : null}
        </View>
      </Card>

      {/* Bearbeiten */}
      <View style={styles.editRow}>
        <Button
          label="Titel bearbeiten"
          variant="secondary"
          icon="create-outline"
          fullWidth={false}
          onPress={() => openEdit('title')}
          style={styles.editButton}
        />
        <Button
          label="Untertitel bearbeiten"
          variant="secondary"
          icon="create-outline"
          fullWidth={false}
          onPress={() => openEdit('subtitle')}
          style={styles.editButton}
        />
      </View>
      <Button
        label="Coverbild wählen"
        variant="secondary"
        icon="image-outline"
        onPress={() => setCoverPickerOpen(true)}
      />

      {/* Leseprobe */}
      {firstVisibleChapter ? (
        <View style={styles.preview}>
          <SectionHeader title={firstVisibleChapter.title} />
          <BookBlocks blocks={firstVisibleChapter.blocks.slice(0, 3)} />
        </View>
      ) : null}

      {/* Kapitel */}
      <View style={styles.chaptersSection}>
        <SectionHeader title="Kapitel" />
        <AppText variant="caption" color={colors.textMuted} style={styles.chaptersHint}>
          Blendet Kapitel aus, ändert die Reihenfolge oder öffnet ein Kapitel zum Lesen.
        </AppText>
        <View style={styles.chapterList}>
          {chapters.map((chapter, index) => {
            const isHidden = hidden.includes(chapter.key);
            return (
              <Card key={chapter.key} padded={false} style={styles.chapterCard}>
                <Pressable
                  style={styles.chapterTitle}
                  onPress={() =>
                    navigation.navigate('BookChapter', {
                      projectId,
                      chapterKey: chapter.key,
                    })
                  }
                >
                  <AppText
                    variant="bodyStrong"
                    color={isHidden ? colors.textMuted : colors.textPrimary}
                    style={isHidden ? styles.dimmed : undefined}
                  >
                    {chapter.title}
                  </AppText>
                </Pressable>
                <View style={styles.chapterControls}>
                  <Pressable
                    hitSlop={8}
                    onPress={() => move(index, -1)}
                    disabled={index === 0}
                    style={styles.controlButton}
                  >
                    <Ionicons
                      name="chevron-up"
                      size={22}
                      color={index === 0 ? colors.textMuted : colors.primaryDark}
                    />
                  </Pressable>
                  <Pressable
                    hitSlop={8}
                    onPress={() => move(index, 1)}
                    disabled={index === chapters.length - 1}
                    style={styles.controlButton}
                  >
                    <Ionicons
                      name="chevron-down"
                      size={22}
                      color={
                        index === chapters.length - 1
                          ? colors.textMuted
                          : colors.primaryDark
                      }
                    />
                  </Pressable>
                  <Pressable
                    hitSlop={8}
                    onPress={() => toggleVisibility(chapter.key)}
                    style={styles.controlButton}
                  >
                    <Ionicons
                      name={isHidden ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color={isHidden ? colors.textMuted : colors.primary}
                    />
                  </Pressable>
                </View>
              </Card>
            );
          })}
        </View>
      </View>

      {/* Export */}
      <View style={styles.exportSection}>
        <SectionHeader title="Buch fertigstellen" />
        <Button
          label="Als PDF / Drucken"
          icon="print-outline"
          loading={exportMutation.isPending}
          onPress={() =>
            exportMutation.mutate(Platform.OS === 'web' ? 'print' : 'pdf')
          }
        />
        <Button
          label="Teilen in der Familie"
          variant="secondary"
          icon="share-social-outline"
          loading={exportMutation.isPending}
          onPress={() => exportMutation.mutate('share')}
          style={styles.shareButton}
        />
      </View>

      {/* Titel/Untertitel-Modal */}
      <Modal
        visible={editField !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditField(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setEditField(null)}>
          <Pressable style={styles.sheet}>
            <AppText variant="subheading" style={styles.sheetTitle}>
              {editField === 'title' ? 'Titel bearbeiten' : 'Untertitel bearbeiten'}
            </AppText>
            <TextField
              value={editValue}
              onChangeText={setEditValue}
              autoFocus
              placeholder={
                editField === 'title' ? 'Titel des Buches' : 'Untertitel'
              }
            />
            <View style={styles.sheetActions}>
              <Button
                label="Abbrechen"
                variant="ghost"
                fullWidth={false}
                onPress={() => setEditField(null)}
              />
              <Button label="Speichern" fullWidth={false} onPress={saveEdit} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Cover-Auswahl-Modal */}
      <Modal
        visible={coverPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCoverPickerOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setCoverPickerOpen(false)}>
          <Pressable style={styles.sheet}>
            <AppText variant="subheading" style={styles.sheetTitle}>
              Coverbild wählen
            </AppText>
            {photosQuery.isLoading ? (
              <Loading message="Fotos werden geladen …" />
            ) : (photosQuery.data ?? []).length === 0 ? (
              <EmptyState
                icon="image-outline"
                title="Keine Fotos"
                message="Ladet zuerst Familienfotos hoch, um ein Coverbild zu wählen."
              />
            ) : (
              <FlatList
                data={photosQuery.data ?? []}
                keyExtractor={(item) => item.id}
                numColumns={3}
                columnWrapperStyle={styles.coverGridRow}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.coverGridItem}
                    onPress={() => {
                      updateMutation.mutate({ cover_photo_path: item.storage_path });
                      setCoverPickerOpen(false);
                    }}
                  >
                    <SignedImage
                      bucket="photos"
                      path={item.storage_path}
                      style={styles.coverGridImage}
                    />
                  </Pressable>
                )}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  coverCard: { overflow: 'hidden' },
  coverBody: { padding: spacing.lg, gap: spacing.xs },
  coverSubtitle: { marginTop: spacing.xs },

  editRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  editButton: { flexGrow: 1 },

  preview: { marginTop: spacing.lg, gap: spacing.sm },

  chaptersSection: { marginTop: spacing.lg },
  chaptersHint: { marginBottom: spacing.md },
  chapterList: { gap: spacing.sm },
  chapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  chapterTitle: { flex: 1 },
  dimmed: { opacity: 0.6 },
  chapterControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  controlButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  exportSection: { marginTop: spacing.xl, gap: spacing.md },
  shareButton: { marginTop: spacing.xs },

  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '80%',
    gap: spacing.md,
  },
  sheetTitle: { marginBottom: spacing.xs },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  coverGridRow: { gap: spacing.sm, marginBottom: spacing.sm },
  coverGridItem: { flex: 1 / 3 },
  coverGridImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
});
