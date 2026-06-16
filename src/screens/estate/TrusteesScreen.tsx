import { View, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import {
  Screen,
  AppText,
  Card,
  Button,
  Chip,
  EmptyState,
  Loading,
  Avatar,
} from '@/components';
import { listTrustees, deleteTrustee } from '@/api/estate';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Trustees'>;

export function TrusteesScreen({ navigation }: Props) {
  const { userId } = useAuth();
  const trusteesQuery = useQuery({ queryKey: qk.trustees(userId!), queryFn: () => listTrustees(userId!) });
  const trustees = trusteesQuery.data ?? [];

  async function onDelete(id: string, name: string) {
    Alert.alert('Vertrauensperson entfernen', `${name} entfernen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Entfernen',
        style: 'destructive',
        onPress: async () => {
          await deleteTrustee(id);
          void trusteesQuery.refetch();
        },
      },
    ]);
  }

  if (trusteesQuery.isLoading) {
    return (
      <Screen>
        <Loading message="Wird geladen …" />
      </Screen>
    );
  }

  return (
    <Screen
      refreshing={trusteesQuery.isRefetching}
      onRefresh={() => void trusteesQuery.refetch()}
    >
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Wähle 2–3 Menschen, denen du vertraust. Sie können im Ernstfall behutsam eine Nachlass-Freigabe
        bestätigen. Du kannst sie jederzeit ändern.
      </AppText>

      {trustees.length === 0 ? (
        <EmptyState
          icon="shield-checkmark-outline"
          title="Noch keine Vertrauensperson"
          message="Lege deine erste Vertrauensperson fest."
          actionLabel="Vertrauensperson hinzufügen"
          onAction={() => navigation.navigate('TrusteeForm', {})}
        />
      ) : (
        <>
          {trustees.map((t) => (
            <Card key={t.id} onPress={() => navigation.navigate('TrusteeForm', { trusteeId: t.id })}>
              <View style={styles.row}>
                <Avatar name={t.name} size={48} />
                <View style={styles.rowText}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {t.name}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                    {t.relation}
                    {t.phone ? ` · ${t.phone}` : ''}
                  </AppText>
                </View>
                {t.can_confirm_death ? (
                  <Chip label="Darf bestätigen" selected color={colors.success} />
                ) : (
                  <Chip label="Nur Hinweis" color={colors.textMuted} />
                )}
              </View>
              <View style={styles.cardActions}>
                <Button
                  label="Entfernen"
                  icon="trash-outline"
                  variant="ghost"
                  fullWidth={false}
                  onPress={() => onDelete(t.id, t.name)}
                />
              </View>
            </Card>
          ))}
          <Button
            label="Weitere Vertrauensperson"
            icon="person-add-outline"
            onPress={() => navigation.navigate('TrusteeForm', {})}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { flex: 1, gap: 2 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.xs },
});
