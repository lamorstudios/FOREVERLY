import { View, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, AppText, Card, Button, Chip, EmptyState, Loading } from '@/components';
import { listLegacyItems } from '@/api/vault';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';
import { LEGACY_META, AUDIENCE_META } from './vaultMeta';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Legacy'>;

export function LegacyScreen({ navigation }: Props) {
  const { userId } = useAuth();
  const itemsQuery = useQuery({ queryKey: qk.legacyItems(userId!), queryFn: () => listLegacyItems(userId!) });
  const items = itemsQuery.data ?? [];

  if (itemsQuery.isLoading) {
    return (
      <Screen>
        <Loading message="Wird geladen …" />
      </Screen>
    );
  }

  return (
    <Screen refreshing={itemsQuery.isRefetching} onRefresh={() => void itemsQuery.refetch()}>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Was möchtest du weitergeben? Werte, Lektionen, Geschichten, Rezepte oder Lieblingsorte – diese
        Inhalte können später ins Familienbuch und zum Familienhistoriker fließen.
      </AppText>

      {items.length === 0 ? (
        <EmptyState
          icon="gift-outline"
          title="Noch kein Vermächtnis"
          message="Teile eine Familiengeschichte, einen Wert oder ein Lieblingsrezept."
          actionLabel="Etwas hinterlassen"
          onAction={() => navigation.navigate('LegacyForm', {})}
        />
      ) : (
        <>
          {items.map((it) => {
            const meta = LEGACY_META[it.kind];
            return (
              <Card key={it.id} onPress={() => navigation.navigate('LegacyForm', { itemId: it.id })}>
                <View style={styles.row}>
                  <AppText variant="bodyStrong" style={styles.flex} numberOfLines={1}>
                    {meta.emoji} {it.title}
                  </AppText>
                  <Chip label={AUDIENCE_META[it.for_audience]} color={colors.gold} />
                </View>
                <AppText variant="caption" color={colors.textSecondary}>{meta.label}</AppText>
                <AppText variant="body" numberOfLines={3} style={styles.content}>{it.content}</AppText>
              </Card>
            );
          })}
          <Button label="Etwas hinterlassen" icon="add-outline" onPress={() => navigation.navigate('LegacyForm', {})} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  content: { marginTop: spacing.xs },
});
