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
  Chip,
  EmptyState,
  Loading,
} from '@/components';
import { colors, spacing } from '@/theme';
import { formatDate } from '@/lib/format';
import { searchHistorian } from '@/api/historian';
import { qk } from '@/api/queryKeys';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import type { HomeStackParamList } from '@/navigation/types';
import type { KnowledgeDoc, KnowledgeKind } from '@/historian/engine';

type Props = NativeStackScreenProps<HomeStackParamList, 'HistorianSearch'>;

const SOURCE_ICON: Record<KnowledgeKind, keyof typeof Ionicons.glyphMap> = {
  person: 'person-circle-outline',
  memory: 'sparkles-outline',
  photo: 'image-outline',
  audio: 'mic-outline',
  time_capsule: 'time-outline',
};

const EXAMPLES = ['Hochzeit', 'München', 'Urlaub', 'Schule', 'Italien'];

function trimText(text: string, max = 180): string {
  const clean = text.trim();
  return clean.length > max ? `${clean.slice(0, max).trimEnd()} …` : clean;
}

function ResultCard({ doc }: { doc: KnowledgeDoc }) {
  return (
    <Card style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <Ionicons name={SOURCE_ICON[doc.kind]} size={24} color={colors.primary} />
        <AppText variant="bodyStrong" style={styles.resultTitle}>
          {doc.title}
        </AppText>
      </View>
      {doc.text ? (
        <AppText variant="body" color={colors.textSecondary}>
          {trimText(doc.text)}
        </AppText>
      ) : null}
      <AppText variant="caption" color={colors.textMuted}>
        Quelle: {doc.source.label}
        {doc.source.date ? ` · ${formatDate(doc.source.date)}` : ''}
      </AppText>
    </Card>
  );
}

/** Globale Suche über alle gespeicherten Familiendaten. */
export function HistorianSearchScreen(_props: Props) {
  const { activeFamily } = useFamily();
  const { userId } = useAuth();
  const [input, setInput] = useState('');
  const [term, setTerm] = useState('');

  const enabled = term.trim().length >= 2;

  const { data: results, isLoading, isFetching } = useQuery({
    queryKey: qk.historianSearch(activeFamily!.id, term),
    queryFn: () => searchHistorian(activeFamily!.id, term, userId ?? undefined),
    enabled,
  });

  const runSearch = (value?: string) => {
    const next = (value ?? input).trim();
    if (next.length < 2) return;
    setInput(next);
    setTerm(next);
  };

  const showLoading = enabled && (isLoading || isFetching);
  const hasSearched = enabled && !showLoading && results !== undefined;

  return (
    <Screen>
      <AppText variant="title">Globale Suche</AppText>
      <AppText variant="body" color={colors.textSecondary}>
        Durchsuche alle gespeicherten Erinnerungen, Personen, Fotos und mehr.
      </AppText>

      <Card>
        <TextField
          label="Suchbegriff"
          value={input}
          onChangeText={setInput}
          placeholder="z. B. Hochzeit"
          returnKeyType="search"
          onSubmitEditing={() => runSearch()}
          autoCapitalize="none"
        />
        <Button
          label="Suchen"
          icon="search-outline"
          onPress={() => runSearch()}
          disabled={input.trim().length < 2}
        />
      </Card>

      <View style={styles.section}>
        <AppText variant="label" color={colors.textSecondary}>
          Beispiele
        </AppText>
        <View style={styles.chips}>
          {EXAMPLES.map((example) => (
            <Chip
              key={example}
              label={example}
              selected={term === example}
              onPress={() => runSearch(example)}
            />
          ))}
        </View>
      </View>

      {showLoading ? (
        <Loading message="Ich durchsuche eure Familiendaten …" />
      ) : null}

      {hasSearched && results && results.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="label" color={colors.textSecondary}>
            {results.length} {results.length === 1 ? 'Treffer' : 'Treffer'} für
            „{term}"
          </AppText>
          {results.map((doc) => (
            <ResultCard key={doc.id} doc={doc} />
          ))}
        </View>
      ) : null}

      {hasSearched && results && results.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="Keine Treffer in euren Familiendaten"
          message={`Zu „${term}" konnte ich nichts finden. Versuche es mit einem anderen Begriff.`}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  resultCard: { gap: spacing.xs },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  resultTitle: { flex: 1 },
});
