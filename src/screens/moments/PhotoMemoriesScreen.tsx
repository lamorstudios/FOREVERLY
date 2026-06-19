import { View, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen, AppText, Card, Button, EmptyState, Loading } from '@/components';
import { useFamily } from '@/context/FamilyContext';
import { getPhotoMemoryGaps } from '@/api/photoMemories';
import { qk } from '@/api/queryKeys';
import { colors, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'PhotoMemories'>;

export function PhotoMemoriesScreen({ navigation }: Props) {
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: qk.photoMemories(familyId),
    queryFn: () => getPhotoMemoryGaps(familyId),
  });

  if (isLoading) return <Loading message="Familienerinnerungen werden analysiert …" />;

  const gaps = data ?? [];

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching}>
      <View style={styles.intro}>
        <AppText variant="heading">Foto-Erinnerungen</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Foreverly erkennt, wo noch wenig festgehalten ist, und schlägt neue
          Erinnerungen vor.
        </AppText>
      </View>

      {gaps.length === 0 ? (
        <EmptyState
          icon="checkmark-circle-outline"
          title="Alles gut dokumentiert!"
          message="Von allen Familienmitgliedern gibt es aktuelle Fotos."
        />
      ) : (
        gaps.map((g) => (
          <Card key={g.personId}>
            <View style={styles.row}>
              <View style={styles.icon}>
                <Ionicons name="bulb-outline" size={22} color={colors.gold} />
              </View>
              <AppText variant="body" style={styles.msg}>
                {g.message}
              </AppText>
            </View>
            <Button
              label="Neue Erinnerung erstellen"
              icon="add-circle-outline"
              variant="secondary"
              onPress={() => navigation.navigate('MomentCompose')}
            />
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.sm, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msg: { flex: 1 },
});
