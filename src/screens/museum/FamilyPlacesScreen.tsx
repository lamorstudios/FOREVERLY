import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, AppText, Card, EmptyState, Loading } from '@/components';
import { getPlaces } from '@/api/museum';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { fullName } from '@/lib/format';
import { colors, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'FamilyPlaces'>;

export function FamilyPlacesScreen(_: Props) {
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const query = useQuery({ queryKey: qk.museumPlaces(familyId), queryFn: () => getPlaces(familyId, userId ?? undefined) });

  if (query.isLoading) {
    return (<Screen tint={colors.tintMemories}><Loading message="Familienorte werden gesammelt …" /></Screen>);
  }
  const places = query.data ?? [];

  return (
    <Screen tint={colors.tintMemories} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <AppText variant="title">Familienorte</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Wo eure Familie ihre Wurzeln hat – Geburtsorte, Heimatstädte und wichtige Orte.
      </AppText>

      {places.length === 0 ? (
        <EmptyState icon="map-outline" title="Noch keine Orte" message="Hinterlege Geburtsorte bei den Personen, dann erscheinen sie hier." />
      ) : (
        places.map((p) => (
          <Card key={p.place}>
            <View style={styles.row}>
              <View style={styles.pin}><Ionicons name="location" size={20} color={colors.error} /></View>
              <View style={styles.rowText}>
                <AppText variant="bodyStrong">{p.place}</AppText>
                <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>
                  {p.persons.map((x) => fullName(x.first_name, x.last_name)).join(' · ')}
                </AppText>
              </View>
              <View style={styles.count}><AppText variant="bodyStrong" color={colors.primaryDark}>{p.persons.length}</AppText></View>
            </View>
          </Card>
        ))
      )}

      <AppText variant="caption" center color={colors.textMuted} style={styles.note}>
        Eine interaktive Welt-/Geokarte folgt in einer späteren Phase – aktuell werden die Orte als
        Liste dargestellt.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginVertical: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pin: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 2 },
  count: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  note: { marginTop: spacing.lg, paddingHorizontal: spacing.md },
});
