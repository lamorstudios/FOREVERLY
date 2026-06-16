import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, AppText, Card, Loading } from '@/components';
import { getMuseumOverview } from '@/api/museum';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { colors, spacing, radius } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'MuseumHub'>;
type IoniconName = keyof typeof Ionicons.glyphMap;

export function MuseumHubScreen({ navigation }: Props) {
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const overview = useQuery({ queryKey: qk.museumOverview(familyId), queryFn: () => getMuseumOverview(familyId, userId ?? undefined) });

  if (overview.isLoading) {
    return (<Screen tint={colors.tintMemories}><Loading message="Familienmuseum wird geöffnet …" /></Screen>);
  }
  const data = overview.data;

  const Nav = ({ icon, title, subtitle, onPress, color = colors.primary }: { icon: IoniconName; title: string; subtitle: string; onPress: () => void; color?: string }) => (
    <Card onPress={onPress}>
      <View style={styles.row}>
        <View style={[styles.iconCircle, { backgroundColor: colors.surfaceAlt }]}><Ionicons name={icon} size={24} color={color} /></View>
        <View style={styles.rowText}>
          <AppText variant="bodyStrong">{title}</AppText>
          <AppText variant="caption" color={colors.textSecondary}>{subtitle}</AppText>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
      </View>
    </Card>
  );

  return (
    <Screen tint={colors.tintMemories} refreshing={overview.isRefetching} onRefresh={() => void overview.refetch()}>
      <View style={styles.hero}>
        <View style={styles.heroScrim} />
        <View style={styles.heroContent}>
          <AppText variant="caption" color={colors.goldSoft}>Willkommen im</AppText>
          <AppText variant="title" color={colors.textOnAccent}>Familienmuseum</AppText>
          <AppText variant="body" color={colors.surfaceAlt}>Eure Geschichte – erlebbar für kommende Generationen.</AppText>
        </View>
      </View>

      {data && data.jubilees.length > 0 ? (
        <Card style={styles.jubileeCard}>
          <AppText variant="bodyStrong" color={colors.gold}>🎉 Jubiläen</AppText>
          {data.jubilees.map((j, i) => <AppText key={i} variant="body" color={colors.textSecondary}>• {j}</AppText>)}
        </Card>
      ) : null}

      <Nav icon="layers-outline" title="Generationenarchiv" subtitle="Die Familie nach Generationen" onPress={() => navigation.navigate('Generations')} />
      <Nav icon="hourglass-outline" title="Zeitreise" subtitle="Wähle ein Jahr und reise zurück" color={colors.gold} onPress={() => navigation.navigate('TimeTravel')} />
      <Nav icon="map-outline" title="Familienorte" subtitle="Geburtsorte & Familienhäuser auf der Karte" color={colors.relationMarried} onPress={() => navigation.navigate('FamilyPlaces')} />
      <Nav icon="cube-outline" title="Familienartefakte" subtitle="Erbstücke & wichtige Familienobjekte" color={colors.bronze} onPress={() => navigation.navigate('Artifacts')} />
      <Nav icon="mic-outline" title="Erinnerungsräume" subtitle="Persönliche Räume je Person (Familienstimmen)" color={colors.success} onPress={() => navigation.navigate('LegacyHub')} />

      {/* Ausstellungen */}
      {data && data.exhibitions.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="bodyStrong">Ausstellungen</AppText>
          {data.exhibitions.map((ex) => (
            <Card
              key={ex.id}
              onPress={() => ex.kind === 'event'
                ? navigation.navigate('EventDetail', { eventId: ex.ref })
                : navigation.navigate('MemoryJourney', { query: ex.themeQuery ?? ex.ref, title: ex.title })}
            >
              <View style={styles.row}>
                <View style={styles.iconCircle}><Ionicons name={ex.kind === 'event' ? 'sparkles-outline' : 'albums-outline'} size={22} color={colors.primary} /></View>
                <View style={styles.rowText}>
                  <AppText variant="bodyStrong" numberOfLines={1}>{ex.title}</AppText>
                  <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>{ex.subtitle}</AppText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </View>
            </Card>
          ))}
        </View>
      ) : null}

      {/* Statistik */}
      {data ? (
        <View style={styles.section}>
          <AppText variant="bodyStrong">Familienstatistik</AppText>
          <View style={styles.statsGrid}>
            {data.stats.map((s) => (
              <View key={s.label} style={styles.statItem}>
                <Ionicons name={s.icon as IoniconName} size={22} color={colors.primary} />
                <AppText variant="heading">{s.value}</AppText>
                <AppText variant="caption" center color={colors.textMuted}>{s.label}</AppText>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <AppText variant="caption" center color={colors.textMuted} style={styles.note}>
        🔒 Es werden nur Inhalte gezeigt, die du sehen darfst. Freigegebene Nachlassinhalte können
        Teil des Museums werden.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { height: 150, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.primaryDark, justifyContent: 'flex-end', marginBottom: spacing.md },
  heroScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
  heroContent: { padding: spacing.lg, gap: 2 },
  jubileeCard: { borderColor: colors.goldSoft, borderWidth: 1, gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 2 },
  section: { gap: spacing.sm, marginTop: spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statItem: { width: '30%', flexGrow: 1, alignItems: 'center', gap: 2, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingVertical: spacing.md },
  note: { marginTop: spacing.lg, paddingHorizontal: spacing.md },
});
