import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, AppText, Card, Chip, Loading } from '@/components';
import { getFamilyYear } from '@/api/legacyMoments';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { colors, spacing, radius } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'FamilyYear'>;

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1];

export function FamilyYearScreen(_: Props) {
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const [year, setYear] = useState(CURRENT_YEAR);

  const query = useQuery({
    queryKey: qk.familyYear(familyId, year),
    queryFn: () => getFamilyYear(familyId, year, userId ?? undefined),
  });

  const d = query.data;

  return (
    <Screen tint={colors.tintMemories} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <View style={styles.hero}>
        <AppText variant="label" color={colors.bronze}>EUER FAMILIENJAHR</AppText>
        <AppText variant="display" color={colors.primaryDark}>{year}</AppText>
        <AppText variant="body" color={colors.textSecondary} center>
          Ein liebevoller Rückblick auf das, was eure Familie gemeinsam erlebt und bewahrt hat.
        </AppText>
      </View>

      <View style={styles.yearRow}>
        {YEARS.map((y) => (
          <Chip key={y} label={`${y}`} selected={y === year} onPress={() => setYear(y)} />
        ))}
      </View>

      {query.isLoading || !d ? (
        <Loading message="Euer Jahr wird zusammengestellt …" />
      ) : (
        <>
          <View style={styles.grid}>
            <Stat icon="people-outline" value={d.newMembers} label="Neue Mitglieder" />
            <Stat icon="image-outline" value={d.photos} label="Fotos" />
            <Stat icon="videocam-outline" value={d.videos} label="Videos" />
            <Stat icon="mic-outline" value={d.audios} label="Audios" />
            <Stat icon="sparkles-outline" value={d.memories} label="Erinnerungen" />
            <Stat icon="balloon-outline" value={d.events} label="Familienereignisse" />
            <Stat icon="time-outline" value={d.openedCapsules} label="Geöffnete Zeitkapseln" />
          </View>

          {d.highlights.length > 0 ? (
            <View style={styles.section}>
              <AppText variant="bodyStrong">Höhepunkte</AppText>
              {d.highlights.map((h) => (
                <Card key={h.title}>
                  <View style={styles.row}>
                    <View style={styles.dot}><Ionicons name="heart" size={16} color={colors.gold} /></View>
                    <View style={styles.flex}>
                      <AppText variant="bodyStrong" numberOfLines={1}>{h.title}</AppText>
                      <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>{h.subtitle}</AppText>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          ) : null}

          <Card style={styles.filmHint}>
            <View style={styles.row}>
              <Ionicons name="film-outline" size={22} color={colors.bronze} />
              <AppText variant="caption" color={colors.textSecondary} style={styles.flex}>
                Dieser Rückblick ist später die Grundlage für euren automatischen Familienfilm.
              </AppText>
            </View>
          </Card>
        </>
      )}
    </Screen>
  );
}

function Stat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <AppText variant="title" color={colors.textPrimary}>{value}</AppText>
      <AppText variant="caption" color={colors.textSecondary} center>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.xs },
  yearRow: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stat: {
    flexGrow: 1, flexBasis: '30%', minWidth: 96, alignItems: 'center', gap: 2,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.sm,
  },
  section: { gap: spacing.sm, marginTop: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dot: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  filmHint: { backgroundColor: colors.surfaceAlt, marginTop: spacing.md },
});
