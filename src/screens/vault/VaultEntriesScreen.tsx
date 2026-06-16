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
                <View style={styles.row}>
                  <View style={styles.iconCircle}>
                    <Ionicons name={meta.icon} size={22} color={colors.primary} />
                  </View>
                  <View style={styles.rowText}>
                    <AppText variant="bodyStrong" numberOfLines={1}>{e.title}</AppText>
                    <AppText variant="caption" color={colors.textSecondary}>{meta.label}</AppText>
                  </View>
                  <Chip label={AUDIENCE_META[e.release_audience]} color={colors.gold} />
                </View>
                {e.location ? (
                  <AppText variant="caption" color={colors.textSecondary} style={styles.detail}>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 2 },
  detail: { marginTop: spacing.xs },
});
