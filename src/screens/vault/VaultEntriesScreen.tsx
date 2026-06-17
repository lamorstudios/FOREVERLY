import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, AppText, Card, Button, Chip, EmptyState, Loading } from '@/components';
import { listVaultEntries } from '@/api/vault';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';
import { VAULT_CATEGORY_META, AUDIENCE_META } from './vaultMeta';

type Props = NativeStackScreenProps<ProfileStackParamList, 'VaultEntries'>;

export function VaultEntriesScreen({ navigation }: Props) {
  const { userId } = useAuth();
  const entriesQuery = useQuery({ queryKey: qk.vaultEntries(userId!), queryFn: () => listVaultEntries(userId!) });
  const entries = entriesQuery.data ?? [];

  if (entriesQuery.isLoading) {
    return (
      <Screen>
        <Loading message="Wird geladen …" />
      </Screen>
    );
  }

  return (
    <Screen refreshing={entriesQuery.isRefetching} onRefresh={() => void entriesQuery.refetch()}>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Hinterlege nur Hinweise und Aufbewahrungsorte – keine Passwörter oder Zugangsdaten.
      </AppText>

      {entries.length === 0 ? (
        <EmptyState
          icon="folder-open-outline"
          title="Noch keine Dokumente"
          message="Lege deinen ersten Hinweis an – z.B. wo dein Testament liegt."
          actionLabel="Dokument hinzufügen"
          onAction={() => navigation.navigate('VaultEntryForm', {})}
        />
      ) : (
        <>
          {entries.map((e) => {
            const meta = VAULT_CATEGORY_META[e.category];
            return (
              <Card key={e.id} onPress={() => navigation.navigate('VaultEntryForm', { entryId: e.id })}>
                <View style={styles.titleRow}>
                  <View style={styles.iconCircle}>
                    <Ionicons name={meta.icon} size={22} color={colors.primary} />
                  </View>
                  <AppText variant="bodyStrong" numberOfLines={2} style={styles.title}>{e.title}</AppText>
                </View>
                <View style={styles.badgeRow}>
                  <Chip label={AUDIENCE_META[e.release_audience]} color={colors.gold} />
                </View>
                <AppText variant="caption" color={colors.textSecondary}>{meta.label}</AppText>
                {e.location ? (
                  <AppText variant="caption" color={colors.textSecondary}>
                    📁 {e.location}
                  </AppText>
                ) : null}
                {e.contact_person ? (
                  <AppText variant="caption" color={colors.textSecondary}>
                    👤 {e.contact_person}
                  </AppText>
                ) : null}
              </Card>
            );
          })}
          <Button label="Dokument hinzufügen" icon="add-outline" onPress={() => navigation.navigate('VaultEntryForm', {})} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
});
