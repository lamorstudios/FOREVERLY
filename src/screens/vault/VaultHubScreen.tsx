import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, AppText, Card, Loading, Disclaimer, IconChip } from '@/components';
import { listVaultEntries, listLegacyItems, listFarewellMessages } from '@/api/vault';
import { listTrustees, getEstateInfo } from '@/api/estate';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'VaultHub'>;
type IoniconName = keyof typeof Ionicons.glyphMap;

export function VaultHubScreen({ navigation }: Props) {
  const { userId } = useAuth();

  const entries = useQuery({ queryKey: qk.vaultEntries(userId!), queryFn: () => listVaultEntries(userId!) });
  const legacy = useQuery({ queryKey: qk.legacyItems(userId!), queryFn: () => listLegacyItems(userId!) });
  const farewell = useQuery({ queryKey: qk.farewellMessages(userId!), queryFn: () => listFarewellMessages(userId!) });
  const trustees = useQuery({ queryKey: qk.trustees(userId!), queryFn: () => listTrustees(userId!) });
  const estate = useQuery({ queryKey: qk.estateInfo(userId!), queryFn: () => getEstateInfo(userId!) });

  const loading = entries.isLoading || legacy.isLoading || farewell.isLoading;
  if (loading) {
    return (
      <Screen>
        <Loading message="Family Vault wird geladen …" />
      </Screen>
    );
  }

  const Row = ({ icon, title, subtitle, onPress, color = colors.primary }: { icon: IoniconName; title: string; subtitle: string; onPress: () => void; color?: string }) => (
    <Card onPress={onPress}>
      <View style={styles.row}>
        <IconChip name={icon} color={color} />
        <View style={styles.rowText}>
          <AppText variant="bodyStrong">{title}</AppText>
          <AppText variant="caption" color={colors.textSecondary}>{subtitle}</AppText>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
      </View>
    </Card>
  );

  return (
    <Screen
      refreshing={entries.isRefetching}
      onRefresh={() => {
        void entries.refetch(); void legacy.refetch(); void farewell.refetch(); void trustees.refetch();
      }}
    >
      <View style={styles.intro}>
        <IconChip name="file-tray-full" color={colors.primary} />
        <AppText variant="title">Dokumente & Nachlass</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Dein Family Vault: wichtige Hinweise, Vermächtnisse und persönliche Worte – sicher
          organisiert und kontrolliert weitergegeben. Es werden keine Passwörter oder Zugangsdaten
          gespeichert.
        </AppText>
      </View>

      <Disclaimer
        icon="document-text-outline"
        text="Foreverly ersetzt keine notarische Verwahrung, Rechtsberatung oder offizielle Nachlassverwaltung. Dies ist nur eine Informations- und Archivfunktion."
      />

      <Row icon="folder-open" title="Dokumente" subtitle={`${entries.data?.length ?? 0} Hinweise hinterlegt`} color={colors.iconDocument} onPress={() => navigation.navigate('VaultEntries')} />
      <Row icon="gift" title="Was ich hinterlassen möchte" subtitle={`${legacy.data?.length ?? 0} Vermächtnisse`} color={colors.accent} onPress={() => navigation.navigate('Legacy')} />
      <Row icon="heart" title="Abschiedsnachrichten" subtitle={`${farewell.data?.length ?? 0} Nachrichten`} color={colors.iconMemories} onPress={() => navigation.navigate('Farewell')} />
      <Row icon="shield-checkmark" title="Vertrauenspersonen" subtitle={`${trustees.data?.length ?? 0} festgelegt`} color={colors.primary} onPress={() => navigation.navigate('Trustees')} />
      <Row icon="people-circle" title="Nachlass-Freigabe" subtitle={estate.data ? `Freigabe-Regel: ${estate.data.required_confirmations} Bestätigungen` : 'Regeln festlegen'} color={colors.accent} onPress={() => navigation.navigate('EstateHub')} />
      <Row icon="list" title="Erben-Übersicht" subtitle="Wer wird informiert & erhält was (informativ)" color={colors.secondary} onPress={() => navigation.navigate('Heirs')} />

      <AppText variant="caption" center color={colors.textMuted} style={styles.disclaimer}>
        🔒 Zugriff erst nach bestätigter Nachlassfreigabe. Bitte keine Passwörter, TANs, Bankzugänge
        oder Wallet-Seeds hinterlegen – nur Hinweise wie „Ordner liegt bei…" oder „Kontaktperson ist…".
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.sm, marginBottom: spacing.md },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { flex: 1, gap: 2 },
  disclaimer: { marginTop: spacing.lg, paddingHorizontal: spacing.md },
});
