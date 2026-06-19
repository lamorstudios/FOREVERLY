import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, AppText, Card, Button, Chip, TextField, Loading, IconChip } from '@/components';
import { getAssistantOverview, askAssistant } from '@/api/assistant';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { colors, spacing, radius } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { AssistantAction } from '@/assistant/engine';

type Props = NativeStackScreenProps<HomeStackParamList, 'Assistant'>;

const EXAMPLES = [
  'Wer ist Oma Erika?',
  'Wann hat Oma Geburtstag?',
  'Welche Zeitkapseln öffnen sich?',
  'Welche Familienfilme gibt es?',
  'Wie viele Familienmitglieder gibt es?',
];

interface ChatMsg { role: 'user' | 'ai'; text: string }

export function AssistantScreen({ navigation }: Props) {
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;

  const overview = useQuery({ queryKey: qk.assistantOverview(familyId), queryFn: () => getAssistantOverview(familyId, userId!), enabled: !!userId });
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [thinking, setThinking] = useState(false);

  function navigateAction(a: AssistantAction) {
    const parent = navigation.getParent() as { navigate: (name: string, params?: object) => void } | undefined;
    parent?.navigate(a.tab, { screen: a.screen, params: a.params });
  }

  async function ask(q: string) {
    const query = q.trim();
    if (!query || thinking) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: query }]);
    setThinking(true);
    try {
      const res = await askAssistant(familyId, query, userId!);
      setMessages((m) => [...m, { role: 'ai', text: res.answer }]);
    } catch {
      setMessages((m) => [...m, { role: 'ai', text: 'Das konnte ich gerade nicht beantworten.' }]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <Screen tint={colors.tintHistorian}>
      <View style={styles.intro}>
        <View style={styles.aiBadge}>
          <Ionicons name="sparkles" size={24} color={colors.primary} />
        </View>
        <AppText variant="title">Familienassistent</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Ich helfe bei Geburtstagen, Erinnerungen, Zeitkapseln, Familienfilmen und Vorsorge – immer
          auf Basis eurer eigenen Daten. Ich schlage nur vor; entscheiden tust du.
        </AppText>
      </View>

      {/* Proaktive Vorschläge */}
      {overview.isLoading ? (
        <Loading message="Einen Moment …" />
      ) : (overview.data?.suggestions.length ?? 0) > 0 ? (
        <View style={styles.section}>
          <AppText variant="bodyStrong">Für dich</AppText>
          {overview.data!.suggestions.map((s) => (
            <Card key={s.id} onPress={s.action ? () => navigateAction(s.action!) : undefined}>
              <View style={styles.row}>
                <IconChip name={s.icon as keyof typeof Ionicons.glyphMap} />
                <View style={styles.rowText}>
                  <AppText variant="bodyStrong" numberOfLines={2}>{s.title}</AppText>
                  <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>{s.subtitle}</AppText>
                </View>
                {s.action ? <Ionicons name="chevron-forward" size={20} color={colors.textMuted} /> : null}
              </View>
            </Card>
          ))}
        </View>
      ) : null}

      {/* Chat */}
      <View style={styles.section}>
        <AppText variant="bodyStrong">Frag deine Familie</AppText>
        {messages.map((m, i) => (
          <View key={i} style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            <AppText variant="body" color={m.role === 'user' ? colors.textOnAccent : colors.textPrimary}>
              {m.text}
            </AppText>
          </View>
        ))}
        {thinking ? (
          <View style={[styles.bubble, styles.aiBubble]}>
            <AppText variant="body" color={colors.textSecondary}>… denkt nach</AppText>
          </View>
        ) : null}

        <Card>
          <TextField value={input} onChangeText={setInput} placeholder="z. B. Wann hat Oma Geburtstag?" multiline returnKeyType="send" onSubmitEditing={() => ask(input)} />
          <Button label="Fragen" icon="send-outline" onPress={() => ask(input)} disabled={!input.trim() || thinking} />
        </Card>

        <View style={styles.chips}>
          {EXAMPLES.map((q) => <Chip key={q} label={q} onPress={() => ask(q)} />)}
        </View>
      </View>

      {/* Statistik */}
      {overview.data ? (
        <View style={styles.section}>
          <AppText variant="bodyStrong">Familienstatistik</AppText>
          <View style={styles.statsGrid}>
            {overview.data.stats.map((s) => (
              <View key={s.label} style={styles.statItem}>
                <Ionicons name={s.icon as keyof typeof Ionicons.glyphMap} size={22} color={colors.primary} />
                <AppText variant="heading">{s.value}</AppText>
                <AppText variant="caption" center color={colors.textMuted}>{s.label}</AppText>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <Card style={styles.voiceCard}>
        <View style={styles.row}>
          <Ionicons name="mic-circle-outline" size={26} color={colors.textMuted} />
          <View style={styles.rowText}>
            <AppText variant="bodyStrong" color={colors.textSecondary}>Sprachassistent</AppText>
            <AppText variant="caption" color={colors.textMuted}>Voice-Chat kommt in einer späteren Phase.</AppText>
          </View>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.sm, marginBottom: spacing.md },
  aiBadge: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  section: { gap: spacing.sm, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 2 },
  bubble: { padding: spacing.md, borderRadius: radius.lg, maxWidth: '90%' },
  userBubble: { backgroundColor: colors.primary, alignSelf: 'flex-end', borderBottomRightRadius: radius.sm },
  aiBubble: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignSelf: 'flex-start', borderBottomLeftRadius: radius.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statItem: { width: '30%', alignItems: 'center', gap: 2, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingVertical: spacing.md, flexGrow: 1 },
  voiceCard: { opacity: 0.8 },
});
