import { View, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, AppText, Card, Avatar, SignedImage, Loading } from '@/components';
import { getGenerations } from '@/api/museum';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { fullName } from '@/lib/format';
import { colors, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Generations'>;

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

export function GenerationsScreen({ navigation }: Props) {
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const query = useQuery({ queryKey: qk.museumGenerations(familyId), queryFn: () => getGenerations(familyId, userId ?? undefined) });

  if (query.isLoading) {
    return (<Screen tint={colors.tintMemories}><Loading message="Generationen werden geordnet …" /></Screen>);
  }
  const groups = query.data ?? [];

  return (
    <Screen tint={colors.tintMemories} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <AppText variant="title">Generationenarchiv</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Eure Familie nach Generationen – von den Wurzeln bis zu den Jüngsten.
      </AppText>

      {groups.map((g) => (
        <View key={g.index} style={styles.genBlock}>
          <View style={styles.genHeader}>
            <View style={styles.genBadge}><AppText variant="bodyStrong" color={colors.textOnAccent}>{ROMAN[g.index - 1] ?? g.index}</AppText></View>
            <AppText variant="subheading">Generation {g.index}</AppText>
          </View>
          <View style={styles.people}>
            {g.persons.map((p) => (
              <Card key={p.id} style={styles.personCard} onPress={() => navigation.navigate('LegacyPerson', { personId: p.id })}>
                {p.avatar_url ? <SignedImage bucket="photos" path={p.avatar_url} style={styles.avatar} /> : <Avatar name={fullName(p.first_name, p.last_name)} size={52} />}
                <AppText variant="caption" center numberOfLines={1} style={styles.name}>{p.first_name}</AppText>
                {p.is_legend ? <AppText variant="caption" center color={colors.gold}>★</AppText> : null}
              </Card>
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginVertical: spacing.xs },
  genBlock: { marginTop: spacing.lg, gap: spacing.sm },
  genHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  genBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  people: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  personCard: { width: 92, alignItems: 'center', gap: 2, paddingVertical: spacing.sm, flexGrow: 0 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  name: { width: 76 },
});
