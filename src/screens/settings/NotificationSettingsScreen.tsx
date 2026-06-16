import { useEffect, useState } from 'react';
import { View, StyleSheet, Switch, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Card, Button } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { notifyFamily } from '@/api/familyNotifications';
import {
  NOTIFICATION_CATEGORIES,
  defaultPrefs,
  getNotificationPrefs,
  setNotificationPrefs,
  type NotificationPrefs,
  type PrefKey,
} from '@/lib/notificationPrefs';
import { PRODUCTION_FLAGS } from '@/lib/productionFlags';
import { colors, spacing } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'NotificationSettings'>;

export function NotificationSettingsScreen(_: Props) {
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    getNotificationPrefs().then(setPrefs);
  }, []);

  function toggle(key: PrefKey) {
    setPrefs((p) => {
      const next = { ...p, [key]: !p[key] };
      void setNotificationPrefs(next);
      return next;
    });
  }

  async function sendTest() {
    if (!activeFamily) return;
    setTesting(true);
    try {
      const n = await notifyFamily({
        familyId: activeFamily.id,
        actorUserId: userId ?? 'demo',
        type: 'member_joined',
        name: 'Max',
        target: { tab: 'FamilyTab', screen: 'Network' },
      });
      Alert.alert(
        n ? 'Test gesendet 💛' : 'Kategorie deaktiviert',
        n
          ? 'Schau ins Benachrichtigungscenter (Glocke oben rechts) – auf dem Handy erscheint zusätzlich eine Mitteilung.'
          : 'Diese Kategorie ist in deinen Einstellungen ausgeschaltet.',
      );
    } finally {
      setTesting(false);
    }
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
            Beta: Benachrichtigungen erscheinen im In-App-Center und als lokale
            Mitteilung auf dem Gerät. Echtes Server-Push (Expo → FCM/APNs) folgt
            mit dem Store-Release. Deine Auswahl wird bereits gespeichert.
          </AppText>
        </Card>
      ) : null}

      <Card>
        {NOTIFICATION_CATEGORIES.map((c, i) => (
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

      <Button
        label="Test-Benachrichtigung senden"
        icon="notifications-outline"
        variant="secondary"
        loading={testing}
        onPress={sendTest}
      />
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
