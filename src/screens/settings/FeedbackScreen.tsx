import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Card, Button, Chip, TextField } from '@/components';
import { sendFeedback } from '@/api/feedback';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { colors, spacing, radius } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';
import type { FeedbackKind } from '@/types/models';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Feedback'>;

const KINDS: { value: FeedbackKind; label: string }[] = [
  { value: 'bug', label: '🐞 Fehler' },
  { value: 'wish', label: '✨ Wunsch' },
  { value: 'idea', label: '💡 Idee' },
];

export function FeedbackScreen({ navigation }: Props) {
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const [kind, setKind] = useState<FeedbackKind>('idea');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSend() {
    if (!message.trim()) return;
    setSending(true);
    try {
      await sendFeedback({ familyId, userId: userId ?? null, kind, message: message.trim() });
      setDone(true);
      setMessage('');
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <Screen>
        <Card style={styles.thanks}>
          <AppText variant="title" center>Danke! 💛</AppText>
          <AppText variant="body" center color={colors.textSecondary}>
            Dein Feedback hilft uns, FAMII besser zu machen.
          </AppText>
          <Button label="Zurück" icon="arrow-back-outline" onPress={() => navigation.goBack()} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="title">Feedback senden</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Melde Fehler, sende Wünsche oder teile deine Ideen – direkt aus der App.
      </AppText>

      <View style={styles.chips}>
        {KINDS.map((k) => <Chip key={k.value} label={k.label} selected={kind === k.value} onPress={() => setKind(k.value)} />)}
      </View>

      <TextField
        value={message}
        onChangeText={setMessage}
        placeholder="Beschreibe dein Anliegen …"
        multiline
        numberOfLines={6}
        style={styles.multiline}
      />

      <Button label="Absenden" icon="send-outline" loading={sending} disabled={!message.trim()} onPress={onSend} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginVertical: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  multiline: { minHeight: 140, textAlignVertical: 'top', borderRadius: radius.md, marginBottom: spacing.md },
  thanks: { alignItems: 'center', gap: spacing.md },
});
