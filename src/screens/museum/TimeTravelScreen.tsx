import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, AppText, Card, Chip, Loading } from '@/components';
import { getTimeTravel } from '@/api/museum';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { fullName } from '@/lib/format';
import { colors, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'TimeTravel'>;

export function TimeTravelScreen({ navigation }: Props) {
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const [year, setYear] = useState(new Date().getFullYear());
  const query = useQuery({ queryKey: qk.museumTimeTravel(familyId, year), queryFn: () => getTimeTravel(familyId, year, userId ?? undefined) });

  const years = query.data?.years ?? [];
  const r = query.data?.result;

  return (
    <Screen tint={colors.tintMemories}>
      <AppText variant="title">Zeitreise</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Wähle ein Jahr und sieh, wie die Familie damals aussah.
      </AppText>

      <View style={styles.years}>
        {years.map((y) => <Chip key={y} label={String(y)} selected={y === year} onPress={() => setYear(y)} />)}
      </View>

      <AppText variant="display" center color={colors.primary} style={styles.bigYear}>{year}</AppText>

      {query.isLoading || !r ? (
        <Loading message="Reise durch die Zeit …" />
      ) : (
        <>
          <View style={styles.statsRow}>
            <Stat icon="people-outline" value={r.alive.length} label="lebten" />
            <Stat icon="happy-outline" value={r.births.length} label="geboren" />
            <Stat icon="flower-outline" value={r.deaths.length} label="verstorben" />
          </View>

          {r.births.length > 0 ? (
            <Card>
              <AppText variant="bodyStrong">👶 Geboren {year}</AppText>
              {r.births.map((p) => <AppText key={p.id} variant="body" color={colors.textSecondary}>• {fullName(p.first_name, p.last_name)}</AppText>)}
            </Card>
          ) : null}
          {r.deaths.length > 0 ? (
            <Card>
              <AppText variant="bodyStrong">🕊️ Abschied {year}</AppText>
              {r.deaths.map((p) => <AppText key={p.id} variant="body" color={colors.textSecondary}>• {fullName(p.first_name, p.last_name)}</AppText>)}
            </Card>
          ) : null}
          {r.events.length > 0 ? (
            <Card>
              <AppText variant="bodyStrong">🎉 Ereignisse</AppText>
              {r.events.map((e) => (
                <AppText key={e.id} variant="body" color={colors.textSecondary} onPress={() => navigation.navigate('EventDetail', { eventId: e.id })}>• {e.title}</AppText>
              ))}
            </Card>
          ) : null}
          {r.memories.length > 0 ? (
            <Card>
              <AppText variant="bodyStrong">✨ Erinnerungen</AppText>
              {r.memories.map((m) => <AppText key={m.id} variant="body" color={colors.textSecondary}>• {m.title}</AppText>)}
            </Card>
          ) : null}
          {r.births.length === 0 && r.deaths.length === 0 && r.events.length === 0 && r.memories.length === 0 ? (
            <Card><AppText variant="body" color={colors.textSecondary}>Für {year} sind keine Inhalte hinterlegt.</AppText></Card>
          ) : null}

          {r.alive.length > 0 ? (
            <Card>
              <AppText variant="bodyStrong">Die Familie {year}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>{r.alive.map((p) => p.first_name).join(' · ')}</AppText>
            </Card>
          ) : null}
        </>
      )}
    </Screen>
  );
}

function Stat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <AppText variant="heading">{value}</AppText>
      <AppText variant="caption" center color={colors.textMuted}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { marginVertical: spacing.xs },
  years: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  bigYear: { marginVertical: spacing.sm },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  stat: { flex: 1, alignItems: 'center', gap: 2, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingVertical: spacing.md },
});
