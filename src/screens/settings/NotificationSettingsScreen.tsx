import { useEffect, useState } from 'react';
import { View, StyleSheet, Switch } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, AppText, Card } from '@/components';
import { PRODUCTION_FLAGS } from '@/lib/productionFlags';
import { colors, spacing } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'NotificationSettings'>;
const KEY = 'foreverly.notifications';

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'memories', label: 'Neue Erinnerungen & Fotos' },
  { key: 'capsules', label: 'Zeitkapseln' },
  { key: 'birthdays', label: 'Geburtstage & Jubiläen' },
  { key: 'events', label: 'Familienevents' },
  { key: 'sos', label: 'SOS-Notfälle' },
  { key: 'location', label: 'Standortfreigaben & Heimweg' },
  { key: 'estate', label: 'Nachlass-Freigaben' },
];

export function NotificationSettingsScreen(_: Props) {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => Object.fromEntries(CATEGORIES.map((c) => [c.key, true])));

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => { if (v) setPrefs((p) => ({ ...p, ...JSON.parse(v) })); });
  }, []);

  function toggle(key: string) {
    setPrefs((p) => {
      const next = { ...p, [key]: !p[key] };
      void AsyncStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }

  return (
    <Screen>
      <AppText variant="title">Benachrichtigungen</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Wähle, worüber du informiert werden möchtest.
      </AppText>

      {!PRODUCTION_FLAGS.pushNotifications ? (
        <Card style={styles.noteCard}>
          <AppText variant="caption" color={colors.textSecondary}>
            Echte Push-Benachrichtigungen werden mit dem App-Store-Release aktiviert. Deine
            Einstellungen werden bereits gespeichert.
          </AppText>
        </Card>
      ) : null}

      <Card>
        {CATEGORIES.map((c, i) => (
          <View key={c.key} style={[styles.row, i > 0 && styles.divider]}>
            <AppText variant="body" style={styles.flex}>{c.label}</AppText>
            <Switch
              value={prefs[c.key] ?? true}
              onValueChange={() => toggle(c.key)}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={colors.surface}
            />
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginVertical: spacing.xs },
  noteCard: { backgroundColor: colors.surfaceAlt },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  divider: { borderTopWidth: 1, borderTopColor: colors.divider },
  flex: { flex: 1 },
});
