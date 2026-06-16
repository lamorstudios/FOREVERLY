import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, AppText, Card, Button, EmptyState, Loading } from '@/components';
import { listArtifacts } from '@/api/museum';
import { listPersons } from '@/api/persons';
import { qk } from '@/api/queryKeys';
import { useFamily } from '@/context/FamilyContext';
import { fullName } from '@/lib/format';
import { colors, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import { ARTIFACT_META } from './museumMeta';

type Props = NativeStackScreenProps<HomeStackParamList, 'Artifacts'>;

export function ArtifactsScreen({ navigation }: Props) {
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const artifactsQuery = useQuery({ queryKey: qk.artifacts(familyId), queryFn: () => listArtifacts(familyId) });
  const personsQuery = useQuery({ queryKey: qk.persons(familyId), queryFn: () => listPersons(familyId) });
  const artifacts = artifactsQuery.data ?? [];
  const personName = (id: string | null) => {
    const p = id ? personsQuery.data?.find((x) => x.id === id) : null;
    return p ? fullName(p.first_name, p.last_name) : null;
  };

  if (artifactsQuery.isLoading) {
    return (<Screen tint={colors.tintMemories}><Loading message="Artefakte werden geladen …" /></Screen>);
  }

  return (
    <Screen tint={colors.tintMemories} refreshing={artifactsQuery.isRefetching} onRefresh={() => void artifactsQuery.refetch()}>
      <AppText variant="title">Familienartefakte</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Erbstücke, Fotoalben und wichtige Objekte – mit Geschichte und Generationenverlauf.
      </AppText>

      {artifacts.length === 0 ? (
        <EmptyState icon="cube-outline" title="Noch keine Artefakte" message="Füge ein wichtiges Familienobjekt hinzu." actionLabel="Artefakt hinzufügen" onAction={() => navigation.navigate('ArtifactForm', {})} />
      ) : (
        <>
          {artifacts.map((a) => {
            const meta = ARTIFACT_META[a.category];
            const owner = personName(a.owner_person_id);
            return (
              <Card key={a.id} onPress={() => navigation.navigate('ArtifactForm', { artifactId: a.id })}>
                <View style={styles.row}>
                  <View style={styles.iconCircle}><Ionicons name={meta.icon} size={24} color={colors.bronze} /></View>
                  <View style={styles.rowText}>
                    <AppText variant="bodyStrong" numberOfLines={1}>{a.title}</AppText>
                    <AppText variant="caption" color={colors.textSecondary}>
                      {meta.label}{a.year ? ` · ${a.year}` : ''}{owner ? ` · ${owner}` : ''}
                    </AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </View>
                {a.story ? <AppText variant="body" color={colors.textSecondary} style={styles.story} numberOfLines={2}>{a.story}</AppText> : null}
              </Card>
            );
          })}
          <Button label="Artefakt hinzufügen" icon="add-outline" onPress={() => navigation.navigate('ArtifactForm', {})} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginVertical: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 2 },
  story: { marginTop: spacing.xs },
});
