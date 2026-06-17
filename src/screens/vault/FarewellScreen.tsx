import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, AppText, Card, Button, Chip, EmptyState, Loading } from '@/components';
import { listFarewellMessages } from '@/api/vault';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing, useResponsive } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';
import { FAREWELL_KIND_META, FAREWELL_RECIPIENT_META } from './vaultMeta';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Farewell'>;

export function FarewellScreen({ navigation }: Props) {
  const { userId } = useAuth();
  const { isSmall } = useResponsive();
  const query = useQuery({ queryKey: qk.farewellMessages(userId!), queryFn: () => listFarewellMessages(userId!) });
  const messages = query.data ?? [];

  if (query.isLoading) {
    return (
      <Screen>
        <Loading message="Wird geladen …" />
      </Screen>
    );
  }

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Hinterlasse warme Worte für deine Liebsten. Diese Nachrichten werden erst nach einer
        bestätigten Nachlassfreigabe sichtbar.
      </AppText>

      {messages.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="Noch keine Abschiedsnachricht"
          message="Schreibe ein paar Worte für Ehepartner, Kinder, Enkel oder deinen Inner Circle."
          actionLabel="Nachricht hinterlegen"
          onAction={() => navigation.navigate('FarewellForm', {})}
        />
      ) : (
        <>
          {messages.map((m) => {
            const meta = FAREWELL_KIND_META[m.kind];
            return (
              <Card key={m.id} onPress={() => navigation.navigate('FarewellForm', { messageId: m.id })}>
                <View style={[styles.header, isSmall && styles.headerColumn]}>
                  <View style={[styles.titleRow, !isSmall && styles.flex]}>
                    <Ionicons name={meta.icon} size={24} color={colors.error} />
                    <View style={styles.rowText}>
                      <AppText variant="bodyStrong" numberOfLines={2}>{m.title}</AppText>
                      <AppText variant="caption" color={colors.textSecondary}>
                        {meta.label} · für {FAREWELL_RECIPIENT_META[m.recipient]}
                      </AppText>
                    </View>
                  </View>
                  <View style={[styles.badgeWrap, isSmall && styles.badgeWrapSmall]}>
                    <Chip label="Nach Freigabe" color={colors.gold} />
                  </View>
                </View>
                {m.content ? (
                  <AppText variant="body" numberOfLines={2} style={styles.preview}>{m.content}</AppText>
                ) : null}
              </Card>
            );
          })}
          <Button label="Nachricht hinterlegen" icon="add-outline" onPress={() => navigation.navigate('FarewellForm', {})} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerColumn: { flexDirection: 'column', alignItems: 'stretch', gap: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  rowText: { flex: 1, gap: 2 },
  badgeWrap: { flexShrink: 0 },
  badgeWrapSmall: { flexDirection: 'row', marginLeft: 24 + spacing.md },
  preview: { marginTop: spacing.xs },
});
