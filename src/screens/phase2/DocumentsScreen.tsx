import { View, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  Screen,
  AppText,
  Button,
  Card,
  EmptyState,
  Loading,
} from '@/components';
import { colors, spacing, radius, withAlpha } from '@/theme';
import { qk } from '@/api/queryKeys';
import { listDocuments, deleteDocument } from '@/api/documents';
import { DOCUMENT_KINDS } from '@/constants/phase2';

// Funktionsfarben je Dokumentart (Mockup: Nachlass=Pink, Vorsorge=Orange, Dokumente=Blau).
const KIND_COLOR: Record<string, string> = {
  testament: colors.sectionMemories, // Nachlass -> Pink
  patientenverfuegung: colors.warning, // Vorsorge -> Orange
  vorsorgevollmacht: colors.warning, // Vorsorge -> Orange
  versicherung: colors.sectionDocuments, // Dokumente -> Blau
  sonstige: colors.sectionDocuments, // Dokumente -> Blau
};
import { friendlyError } from '@/lib/errors';
import { useFamily } from '@/context/FamilyContext';
import type { HomeStackParamList } from '@/navigation/types';
import type { FamilyDocument } from '@/types/models';

export function DocumentsScreen({
  navigation,
}: NativeStackScreenProps<HomeStackParamList, 'Documents'>) {
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();

  const documentsQuery = useQuery({
    queryKey: qk.documents(familyId),
    queryFn: () => listDocuments(familyId),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.documents(familyId) });
    },
    onError: (error) => {
      Alert.alert('Fehler', friendlyError(error));
    },
  });

  const documents = documentsQuery.data ?? [];

  function confirmDelete(doc: FamilyDocument) {
    Alert.alert(
      'Eintrag löschen',
      `Möchten Sie den Eintrag „${doc.title}“ wirklich löschen? Es wird nur dieser Hinweis entfernt – das Dokument selbst bleibt unberührt.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(doc.id),
        },
      ],
    );
  }

  if (documentsQuery.isLoading) {
    return (
      <Screen tint={colors.tintDocuments}>
        <Loading message="Dokumente werden geladen …" />
      </Screen>
    );
  }

  return (
    <Screen
      tint={colors.tintDocuments}
      refreshing={documentsQuery.isFetching}
      onRefresh={() => documentsQuery.refetch()}
    >
      <AppText variant="display">Dokumentenübersicht</AppText>

      <View style={styles.infoBox}>
        <Ionicons
          name="lock-closed-outline"
          size={22}
          color={colors.primary}
          style={styles.infoIcon}
        />
        <AppText variant="body" color={colors.textSecondary} style={styles.infoText}>
          Hier wird nur festgehalten, OB ein Dokument existiert und wo es liegt –
          keine Inhalte werden gespeichert.
        </AppText>
      </View>

      <Button
        label="Dokument hinzufügen"
        icon="add-circle-outline"
        onPress={() => navigation.navigate('DocumentForm')}
        style={styles.addButton}
      />

      {documents.length === 0 ? (
        <EmptyState
          icon="folder-open-outline"
          title="Noch keine Dokumente vermerkt"
          message="Halten Sie fest, welche wichtigen Dokumente es gibt und wo sie aufbewahrt werden – ganz ohne deren Inhalte zu speichern."
          actionLabel="Dokument hinzufügen"
          onAction={() => navigation.navigate('DocumentForm')}
        />
      ) : (
        <View style={styles.list}>
          {documents.map((doc) => {
            const meta = DOCUMENT_KINDS[doc.kind];
            const kindColor = KIND_COLOR[doc.kind] ?? colors.sectionDocuments;
            return (
              <Card
                key={doc.id}
                onPress={() =>
                  navigation.navigate('DocumentForm', { documentId: doc.id })
                }
              >
                <View style={styles.row}>
                  <View style={[styles.iconCircle, { backgroundColor: withAlpha(kindColor, 0.14) }]}>
                    <Ionicons name={meta.icon} size={28} color={kindColor} />
                  </View>

                  <View style={styles.body}>
                    <AppText variant="subheading">{doc.title}</AppText>
                    <AppText variant="caption" color={colors.textMuted}>
                      {meta.label}
                    </AppText>

                    {doc.is_available ? (
                      <View style={[styles.badge, styles.badgeAvailable]}>
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={colors.success}
                        />
                        <AppText variant="caption" color={colors.success}>
                          Vorhanden
                        </AppText>
                      </View>
                    ) : (
                      <View style={[styles.badge, styles.badgeMissing]}>
                        <Ionicons
                          name="ellipse-outline"
                          size={18}
                          color={colors.textMuted}
                        />
                        <AppText variant="caption" color={colors.textMuted}>
                          Nicht vorhanden
                        </AppText>
                      </View>
                    )}

                    {doc.location ? (
                      <View style={styles.detailRow}>
                        <Ionicons
                          name="location-outline"
                          size={18}
                          color={colors.textSecondary}
                        />
                        <AppText
                          variant="body"
                          color={colors.textSecondary}
                          style={styles.detailText}
                        >
                          Aufbewahrungsort: {doc.location}
                        </AppText>
                      </View>
                    ) : null}

                    {doc.contact_person ? (
                      <View style={styles.detailRow}>
                        <Ionicons
                          name="person-outline"
                          size={18}
                          color={colors.textSecondary}
                        />
                        <AppText
                          variant="body"
                          color={colors.textSecondary}
                          style={styles.detailText}
                        >
                          Ansprechpartner: {doc.contact_person}
                        </AppText>
                      </View>
                    ) : null}

                    {doc.note ? (
                      <AppText
                        variant="body"
                        color={colors.textSecondary}
                        style={styles.note}
                      >
                        {doc.note}
                      </AppText>
                    ) : null}
                  </View>

                  <Pressable
                    hitSlop={10}
                    onPress={() => confirmDelete(doc)}
                    style={styles.trash}
                  >
                    <Ionicons name="trash-outline" size={24} color={colors.error} />
                  </Pressable>
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  infoIcon: { marginTop: 2 },
  infoText: { flex: 1 },
  addButton: { marginTop: spacing.lg, marginBottom: spacing.lg },
  list: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: spacing.xs },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
  },
  badgeAvailable: { backgroundColor: `${colors.success}22` },
  badgeMissing: { backgroundColor: colors.surfaceAlt },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  detailText: { flex: 1 },
  note: { marginTop: spacing.xs, fontStyle: 'italic' },
  trash: { padding: spacing.xs },
});
