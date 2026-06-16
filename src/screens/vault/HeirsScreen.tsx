import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, AppText, Card, SectionHeader, Loading } from '@/components';
import { listTrustees } from '@/api/estate';
import { listVaultEntries, listLegacyItems } from '@/api/vault';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';
import type { EstateAudience } from '@/types/models';
import { AUDIENCE_META } from './vaultMeta';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Heirs'>;

export function HeirsScreen(_: Props) {
  const { userId } = useAuth();
  const trustees = useQuery({ queryKey: qk.trustees(userId!), queryFn: () => listTrustees(userId!) });
  const entries = useQuery({ queryKey: qk.vaultEntries(userId!), queryFn: () => listVaultEntries(userId!) });
  const legacy = useQuery({ queryKey: qk.legacyItems(userId!), queryFn: () => listLegacyItems(userId!) });

  const docsByAudience = useMemo(() => {
    const map = new Map<EstateAudience, string[]>();
    for (const e of entries.data ?? []) {
      if (!map.has(e.release_audience)) map.set(e.release_audience, []);
      map.get(e.release_audience)!.push(e.title);
    }
    return map;
  }, [entries.data]);

  const legacyByAudience = useMemo(() => {
    const map = new Map<EstateAudience, string[]>();
    for (const l of legacy.data ?? []) {
      if (!map.has(l.for_audience)) map.set(l.for_audience, []);
      map.get(l.for_audience)!.push(l.title);
    }
    return map;
  }, [legacy.data]);

  if (trustees.isLoading) {
    return (
      <Screen>
        <Loading message="Wird geladen …" />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Diese Übersicht ist rein informativ und hilft deiner Familie, sich zu orientieren. Sie ersetzt
        keine rechtliche Erbregelung.
      </AppText>

      <View style={styles.section}>
        <SectionHeader title="Wer wird informiert" />
        {(trustees.data ?? []).length === 0 ? (
          <Card><AppText variant="body" color={colors.textSecondary}>Noch keine Vertrauenspersonen festgelegt.</AppText></Card>
        ) : (
          (trustees.data ?? []).map((t) => (
            <Card key={t.id}>
              <View style={styles.row}>
                <Ionicons name="person-outline" size={20} color={colors.primary} />
                <AppText variant="bodyStrong" style={styles.flex}>{t.name}</AppText>
                <AppText variant="caption" color={colors.textSecondary}>{t.relation}</AppText>
              </View>
            </Card>
          ))
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Wer sieht welche Dokumente" />
        {[...docsByAudience.entries()].map(([aud, titles]) => (
          <Card key={aud}>
            <AppText variant="bodyStrong">{AUDIENCE_META[aud]}</AppText>
            <AppText variant="body" color={colors.textSecondary}>{titles.join(' · ')}</AppText>
          </Card>
        ))}
        {docsByAudience.size === 0 ? (
          <Card><AppText variant="body" color={colors.textSecondary}>Noch keine Dokumente hinterlegt.</AppText></Card>
        ) : null}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Wer erhält Vermächtnisse" />
        {[...legacyByAudience.entries()].map(([aud, titles]) => (
          <Card key={aud}>
            <AppText variant="bodyStrong">{AUDIENCE_META[aud]}</AppText>
            <AppText variant="body" color={colors.textSecondary}>{titles.join(' · ')}</AppText>
          </Card>
        ))}
        {legacyByAudience.size === 0 ? (
          <Card><AppText variant="body" color={colors.textSecondary}>Noch keine Vermächtnisse hinterlegt.</AppText></Card>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: spacing.sm },
  section: { marginTop: spacing.md, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
});
