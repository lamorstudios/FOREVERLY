import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, AppText, Card, Chip, Avatar, SignedImage, Loading } from '@/components';
import { listPersons } from '@/api/persons';
import { qk } from '@/api/queryKeys';
import { useFamily } from '@/context/FamilyContext';
import { fullName } from '@/lib/format';
import { colors, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import { JOURNEY_THEMES } from './legacyMeta';

type Props = NativeStackScreenProps<HomeStackParamList, 'LegacyHub'>;

export function LegacyHubScreen({ navigation }: Props) {
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const personsQuery = useQuery({ queryKey: qk.persons(familyId), queryFn: () => listPersons(familyId) });
  const persons = personsQuery.data ?? [];
  const legends = persons.filter((p) => p.is_legend);
  const others = persons.filter((p) => !p.is_legend);

  if (personsQuery.isLoading) {
    return (
      <Screen tint={colors.tintHistorian}>
        <Loading message="Familienstimmen werden geladen …" />
      </Screen>
    );
  }

  const PersonRow = ({ id, name, avatar, legend }: { id: string; name: string; avatar: string | null; legend?: boolean }) => (
    <Card onPress={() => navigation.navigate('LegacyPerson', { personId: id })}>
      <View style={styles.row}>
        {avatar ? <SignedImage bucket="photos" path={avatar} style={styles.avatar} /> : <Avatar name={name} size={48} />}
        <View style={styles.rowText}>
          <AppText variant="bodyStrong" numberOfLines={2}>{name}</AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>Stimmen, Geschichten & Lebensweg</AppText>
        </View>
        {legend ? (
          <View style={styles.legendBadge}>
            <Ionicons name="star" size={11} color={colors.gold} />
            <AppText variant="caption" color={colors.bronze} style={styles.legendText}>Legende</AppText>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={styles.chevron} />
      </View>
    </Card>
  );

  return (
    <Screen tint={colors.tintHistorian} refreshing={personsQuery.isRefetching} onRefresh={() => void personsQuery.refetch()}>
      <View style={styles.intro}>
        <View style={styles.iconCircle}><Ionicons name="mic-outline" size={26} color={colors.primary} /></View>
        <AppText variant="title">Familienstimmen</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Stimmen, Geschichten und Lebenswege eurer Familie – für kommende Generationen bewahrt.
          Originalaufnahmen stehen immer im Mittelpunkt; nichts wird erfunden.
        </AppText>
      </View>

      <Card onPress={() => navigation.navigate('HistorianSearch')}>
        <View style={styles.row}>
          <Ionicons name="search-outline" size={26} color={colors.primary} />
          <View style={styles.rowText}>
            <AppText variant="bodyStrong">In allem suchen</AppText>
            <AppText variant="caption" color={colors.textSecondary}>z. B. „Zeige mir alles über Italien"</AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>
      </Card>

      <View style={styles.section}>
        <AppText variant="bodyStrong">Erinnerungsreise starten</AppText>
        <View style={styles.chips}>
          {JOURNEY_THEMES.map((t) => (
            <Chip key={t.label} label={`${t.emoji} ${t.label}`} onPress={() => navigation.navigate('MemoryJourney', { query: t.query, title: t.label })} />
          ))}
        </View>
      </View>

      {legends.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="bodyStrong">★ Familienlegenden</AppText>
          {legends.map((p) => <PersonRow key={p.id} id={p.id} name={fullName(p.first_name, p.last_name)} avatar={p.avatar_url} legend />)}
        </View>
      ) : null}

      <View style={styles.section}>
        <AppText variant="bodyStrong">Alle Personen</AppText>
        {others.map((p) => <PersonRow key={p.id} id={p.id} name={fullName(p.first_name, p.last_name)} avatar={p.avatar_url} />)}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.sm, marginBottom: spacing.md },
  iconCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  section: { gap: spacing.sm, marginTop: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  rowText: { flex: 1, minWidth: 0, gap: 2 },
  legendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
    backgroundColor: colors.goldSoft,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  legendText: { fontSize: 11 },
  chevron: { flexShrink: 0, marginLeft: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
});
