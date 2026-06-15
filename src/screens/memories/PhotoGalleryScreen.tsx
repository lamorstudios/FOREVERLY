import { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Button, EmptyState, Loading } from '@/components';
import { SignedImage } from '@/components/SignedImage';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { useImagePicker } from '@/hooks/useImagePicker';
import { listPhotos, uploadPhoto, deletePhoto } from '@/api/media';
import { qk } from '@/api/queryKeys';
import { friendlyError } from '@/lib/errors';
import { colors, spacing, radius } from '@/theme';
import type { Photo } from '@/types/models';
import type { MemoriesStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<MemoriesStackParamList, 'PhotoGallery'>;

const COLUMNS = 2;
const GRID_GAP = spacing.sm;
const SCREEN_WIDTH = Dimensions.get('window').width;
// Screen has default horizontal padding (spacing.lg) on both sides.
const TILE_SIZE = Math.floor(
  (SCREEN_WIDTH - spacing.lg * 2 - GRID_GAP * (COLUMNS - 1)) / COLUMNS,
);

export function PhotoGalleryScreen({ route }: Props) {
  const personId = route.params?.personId;
  const { activeFamily } = useFamily();
  const { userId } = useAuth();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();
  const { pickFromLibrary } = useImagePicker();

  const [selected, setSelected] = useState<Photo | null>(null);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: qk.photos(familyId, personId),
    queryFn: () => listPhotos(familyId, { personId }),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const picked = await pickFromLibrary();
      if (!picked) return false;
      await uploadPhoto({
        familyId,
        uploadedBy: userId!,
        localUri: picked.uri,
        width: picked.width,
        height: picked.height,
        personId: personId ?? null,
      });
      return true;
    },
    onSuccess: (uploaded) => {
      if (uploaded) {
        queryClient.invalidateQueries({ queryKey: qk.photos(familyId, personId) });
      }
    },
    onError: (e) => Alert.alert('Fehler', friendlyError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePhoto(id),
    onSuccess: () => {
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: qk.photos(familyId, personId) });
    },
    onError: (e) => Alert.alert('Fehler', friendlyError(e)),
  });

  function confirmDelete(photo: Photo) {
    Alert.alert(
      'Foto löschen',
      'Möchtest du dieses Foto wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(photo.id),
        },
      ],
    );
  }

  if (isLoading) {
    return (
      <Screen>
        <Loading message="Fotos werden geladen …" />
      </Screen>
    );
  }

  const photos = data ?? [];

  return (
    <Screen
      refreshing={isRefetching}
      onRefresh={refetch}
      contentStyle={styles.content}
    >
      <Button
        label="Foto hochladen"
        icon="add"
        onPress={() => uploadMutation.mutate()}
        loading={uploadMutation.isPending}
      />

      {photos.length === 0 ? (
        <EmptyState
          icon="images-outline"
          title="Noch keine Fotos"
          message="Lade euer erstes gemeinsames Foto hoch."
          actionLabel="Foto hochladen"
          onAction={() => uploadMutation.mutate()}
        />
      ) : (
        <View style={styles.grid}>
          {photos.map((photo) => (
            <Pressable
              key={photo.id}
              onPress={() => setSelected(photo)}
              accessibilityRole="imagebutton"
              accessibilityLabel="Foto öffnen"
            >
              <SignedImage
                bucket="photos"
                path={photo.storage_path}
                style={styles.tile}
              />
            </Pressable>
          ))}
        </View>
      )}

      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.closeButton}
            onPress={() => setSelected(null)}
            accessibilityRole="button"
            accessibilityLabel="Schließen"
          >
            <Ionicons name="close" size={32} color={colors.textOnAccent} />
          </Pressable>

          {selected ? (
            <View style={styles.modalContent}>
              <SignedImage
                bucket="photos"
                path={selected.storage_path}
                style={styles.modalImage}
              />
              {selected.caption ? (
                <AppText variant="body" color={colors.textOnAccent} center>
                  {selected.caption}
                </AppText>
              ) : null}
              {selected.uploaded_by === userId ? (
                <Button
                  label="Foto löschen"
                  variant="danger"
                  icon="trash-outline"
                  onPress={() => confirmDelete(selected)}
                  loading={deleteMutation.isPending}
                />
              ) : null}
            </View>
          ) : null}
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingTop: spacing.md },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.xxl,
    right: spacing.lg,
    zIndex: 2,
  },
  modalContent: { gap: spacing.lg },
  modalImage: {
    width: '100%',
    height: SCREEN_WIDTH,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
  },
});
