import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Screen,
  AppText,
  Button,
  TextField,
  Card,
  Loading,
} from '@/components';
import { colors, radius, spacing } from '@/theme';
import { formatDate } from '@/lib/format';
import { askHistorian } from '@/api/historian';
import { qk } from '@/api/queryKeys';
import { useFamily } from '@/context/FamilyContext';
import type { HistorianStackParamList } from '@/navigation/types';
import type { HistorianSource, KnowledgeKind } from '@/historian/engine';

type Props = NativeStackScreenProps<HistorianStackParamList, 'HistorianAnswer'>;

const SOURCE_ICON: Record<KnowledgeKind, keyof typeof Ionicons.glyphMap> = {
  person: 'person-circle-outline',
  memory: 'sparkles-outline',
  photo: 'image-outline',
  audio: 'mic-outline',
  time_capsule: 'time-outline',
};

function SourceRow({ source }: { source: HistorianSource }) {
  return (
    <View style={styles.sourceRow}>
      <Ionicons
        name={SOURCE_ICON[source.kind]}
        size={22}
        color={colors.primary}
      />
      <AppText variant="caption" color={colors.textSecondary} style={styles.sourceLabel}>
        {source.label}
        {source.date ? ` · ${formatDate(source.date)}` : ''}
      </AppText>
    </View>
  );
}

/** Beantwortet eine Frage ausschließlich aus den Familiendaten – mit Quellen. */
export function HistorianAnswerScreen({ navigation, route }: Props) {
  const { query } = route.params;
  const { activeFamily } = useFamily();
  const [followUp, setFollowUp] = useState('');

  const { data: answer, isLoading } = useQuery({
    queryKey: qk.historianAsk(activeFamily!.id, query),
    queryFn: () => askHistorian(activeFamily!.id, query),
  });

  const askAgain = () => {
    const trimmed = followUp.trim();
    if (!trimmed) return;
    navigation.push('HistorianAnswer', { query: trimmed });
  };

  return (
    <Screen>
      <View style={styles.questionBlock}>
        <Ionicons name="help-circle-outline" size={26} color={colors.primary} />
        <AppText variant="heading" style={styles.questionText}>
          {query}
        </AppText>
      </View>

      {isLoading ? (
        <Loading message="Ich durchsuche eure Familiendaten …" />
      ) : answer ? (
        <>
          <Card
            style={!answer.found ? styles.notFoundCard : undefined}
          >
            {!answer.found ? (
              <View style={styles.notFoundHeader}>
                <Ionicons
                  name="leaf-outline"
                  size={24}
                  color={colors.textSecondary}
                />
                <AppText variant="bodyStrong" color={colors.textSecondary}>
                  Noch keine Antwort gefunden
                </AppText>
              </View>
            ) : null}
            <AppText variant="body" style={styles.answerText}>
              {answer.answer}
            </AppText>
          </Card>

          {answer.sources.length > 0 ? (
            <Card style={styles.sourcesCard}>
              <View style={styles.sourcesHeader}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={22}
                  color={colors.primaryDark}
                />
                <AppText variant="bodyStrong">
                  {answer.sources.length === 1 ? 'Quelle' : 'Quellen'}
                </AppText>
              </View>
              <AppText variant="caption" color={colors.textMuted}>
                Diese Antwort beruht ausschließlich auf folgenden
                Familiendaten:
              </AppText>
              <View style={styles.sourceList}>
                {answer.sources.map((source, index) => (
                  <SourceRow
                    key={`${source.kind}-${source.entityId}-${index}`}
                    source={source}
                  />
                ))}
              </View>
            </Card>
          ) : null}
        </>
      ) : null}

      <Card>
        <AppText variant="bodyStrong">Weiter fragen</AppText>
        <TextField
          value={followUp}
          onChangeText={setFollowUp}
          placeholder="Stelle eine neue Frage …"
          multiline
          returnKeyType="search"
          onSubmitEditing={askAgain}
        />
        <Button
          label="Weiter fragen"
          icon="arrow-forward-outline"
          onPress={askAgain}
          disabled={!followUp.trim()}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  questionBlock: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  questionText: { flex: 1 },
  answerText: { lineHeight: 28 },
  notFoundCard: { backgroundColor: colors.surfaceAlt, borderColor: colors.primarySoft },
  notFoundHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sourcesCard: { backgroundColor: colors.surfaceAlt, borderColor: colors.primarySoft },
  sourcesHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sourceList: { gap: spacing.sm, marginTop: spacing.xs },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  sourceLabel: { flex: 1 },
});
