import { useEffect, useState } from 'react';
import { View, StyleSheet, Switch, Share, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, AppText, Card, Button } from '@/components';
import { exportFamilyData } from '@/api/feedback';
import { useFamily } from '@/context/FamilyContext';
import { confirmAsync, notify } from '@/lib/confirm';
import { colors, spacing } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'PrivacyData'>;
const KEY = 'foreverly.consents';

const CONSENTS: { key: string; label: string }[] = [
  { key: 'analytics', label: 'Anonyme Nutzungsstatistiken erlauben' },
  { key: 'recommendations', label: 'Personalisierte Empfehlungen' },
  { key: 'aiProcessing', label: 'KI-Auswertung eigener Inhalte (Historiker/Assistent)' },
];

export function PrivacyDataScreen(_: Props) {
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const [consents, setConsents] = useState<Record<string, boolean>>({ analytics: false, recommendations: true, aiProcessing: true });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => { if (v) setConsents((c) => ({ ...c, ...JSON.parse(v) })); });
  }, []);

  function toggle(key: string) {
    setConsents((c) => {
      const next = { ...c, [key]: !c[key] };
      void AsyncStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }

  async function onExport() {
    setExporting(true);
    try {
      const data = await exportFamilyData(familyId);
      const json = JSON.stringify(data, null, 2);
      if (Platform.OS === 'web') {
        notify('Datenexport erstellt', `Dein Familienarchiv wurde erzeugt (${Math.round(json.length / 1024)} KB). Im Realbetrieb erhältst du eine Download-Datei.`);
      } else {
        await Share.share({ title: 'FAMII Datenexport', message: json.slice(0, 4000) });
      }
    } finally {
      setExporting(false);
    }
  }

  async function onDelete() {
    const ok = await confirmAsync({
      title: 'Daten löschen',
      message: 'Möchtest du die Löschung aller Familiendaten beantragen? Dieser Schritt wird im Realbetrieb mit zusätzlicher Bestätigung ausgeführt.',
      confirmLabel: 'Löschung beantragen',
      destructive: true,
    });
    if (ok) notify('Antrag erfasst', 'Deine Löschanfrage wurde vorgemerkt.');
  }

  return (
    <Screen>
      <AppText variant="title">Datenschutz & Daten</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Du behältst die Kontrolle über eure Familiendaten – DSGVO-konform.
      </AppText>

      <Card>
        <AppText variant="bodyStrong">Einwilligungen</AppText>
        {CONSENTS.map((c) => (
          <View key={c.key} style={styles.row}>
            <AppText variant="body" style={styles.flex}>{c.label}</AppText>
            <Switch value={consents[c.key] ?? false} onValueChange={() => toggle(c.key)} trackColor={{ true: colors.primary, false: colors.border }} thumbColor={colors.surface} />
          </View>
        ))}
      </Card>

      <Card onPress={onExport}>
        <View style={styles.actionRow}>
          <Ionicons name="download-outline" size={24} color={colors.primary} />
          <View style={styles.flex}>
            <AppText variant="bodyStrong">Daten exportieren</AppText>
            <AppText variant="caption" color={colors.textSecondary}>Alle Familieninhalte als Archiv herunterladen</AppText>
          </View>
        </View>
      </Card>

      <Button label="Daten exportieren" icon="download-outline" variant="secondary" loading={exporting} onPress={onExport} />

      <Card onPress={onDelete} style={styles.deleteCard}>
        <View style={styles.actionRow}>
          <Ionicons name="trash-outline" size={24} color={colors.error} />
          <View style={styles.flex}>
            <AppText variant="bodyStrong" color={colors.error}>Daten löschen</AppText>
            <AppText variant="caption" color={colors.textSecondary}>Löschung aller Daten beantragen</AppText>
          </View>
        </View>
      </Card>

      <AppText variant="caption" center color={colors.textMuted} style={styles.note}>
        Ende-zu-Ende-Verschlüsselung, Backups und Geräteverwaltung sind in Vorbereitung.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginVertical: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1, gap: 2 },
  deleteCard: { borderColor: colors.error, borderWidth: 1 },
  note: { marginTop: spacing.lg, paddingHorizontal: spacing.md },
});
