import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Screen,
  AppText,
  Button,
  TextField,
  Card,
  Chip,
} from '@/components';
import { colors, radius, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'HistorianHome'>;

const EXAMPLE_QUESTIONS = [
  'Wer ist Oma Erika?',
  'Welche Geschichten gibt es über Oma Erika?',
  'Welche Rezepte hat Oma hinterlassen?',
  'Welche Familienurlaube gab es?',
  'Wer war Uropa Karl?',
  'Welche Lebensweisheiten gibt es?',
];

/** Nur Ziele ohne Pflicht-Parameter (per navigate ohne Argumente erreichbar). */
type NavCardRoute =
  | 'HistorianSearch'
  | 'OnThisDay'
  | 'FamilyKnowledge'
  | 'HistorianTopics'
  | 'Wisdoms'
  | 'Timeline'
  | 'ImportantPeople'
  | 'KnowledgeGaps';

interface NavCard {
  route: NavCardRoute;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}

const NAV_CARDS: NavCard[] = [
  {
    route: 'OnThisDay',
    icon: 'hourglass-outline',
    title: 'Heute in der Familiengeschichte',
    subtitle: 'Was an einem Tag wie heute früher geschah.',
  },
  {
    route: 'FamilyKnowledge',
    icon: 'library-outline',
    title: 'Familienwissen',
    subtitle: 'Herkunft, Berufe und Traditionen – aus euren Daten.',
  },
  {
    route: 'HistorianTopics',
    icon: 'pricetags-outline',
    title: 'Geschichten & Themen',
    subtitle: 'Kindheit, Hochzeit, Reisen, Beruf – automatisch erkannt.',
  },
  {
    route: 'HistorianSearch',
    icon: 'search-outline',
    title: 'Globale Suche',
    subtitle: 'Durchsuche alle Familiendaten nach Stichworten.',
  },
  {
    route: 'Wisdoms',
    icon: 'bulb-outline',
    title: 'Lebensweisheiten',
    subtitle: 'Wertvolle Ratschläge aus eurer Familie.',
  },
  {
    route: 'Timeline',
    icon: 'git-commit-outline',
    title: 'Ereignis-Zeitleiste',
    subtitle: 'Wichtige Momente in der Reihenfolge der Zeit.',
  },
  {
    route: 'ImportantPeople',
    icon: 'people-outline',
    title: 'Wichtige Personen',
    subtitle: 'Kurzbiografien eurer Familienmitglieder.',
  },
  {
    route: 'KnowledgeGaps',
    icon: 'alert-circle-outline',
    title: 'Familienwissen retten',
    subtitle: 'Wo noch Erinnerungen, Fotos oder Stimmen fehlen.',
  },
];

/** Einstieg in den Familienhistoriker: Fragen stellen und stöbern. */
export function HistorianHomeScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');

  const ask = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    navigation.navigate('HistorianAnswer', { query: trimmed });
  };

  return (
    <Screen tint={colors.tintHistorian}>
      <AppText variant="title">Familienhistoriker</AppText>

      <Card style={styles.introCard}>
        <View style={styles.introHeader}>
          <View style={styles.introIcon}>
            <Ionicons name="book-outline" size={26} color={colors.primary} />
          </View>
          <AppText variant="subheading" style={styles.introTitle}>
            Euer Familiengedächtnis
          </AppText>
        </View>
        <AppText variant="body" color={colors.textSecondary}>
          Der Familienhistoriker greift ausschließlich auf eure gespeicherten
          Familiendaten zu. Er erfindet nichts und gibt zu jeder Antwort immer
          die Quellen an – so bleibt alles nachvollziehbar.
        </AppText>
      </Card>

      <Card>
        <AppText variant="bodyStrong">Stelle eine Frage</AppText>
        <TextField
          value={query}
          onChangeText={setQuery}
          placeholder="z. B. Wo wurde Opa geboren?"
          multiline
          returnKeyType="search"
          onSubmitEditing={() => ask(query)}
        />
        <Button
          label="Fragen"
          icon="chatbubble-ellipses-outline"
          onPress={() => ask(query)}
          disabled={!query.trim()}
        />
      </Card>

      <View style={styles.section}>
        <AppText variant="label" color={colors.textSecondary}>
          Beispiel-Fragen
        </AppText>
        <View style={styles.chips}>
          {EXAMPLE_QUESTIONS.map((q) => (
            <Chip key={q} label={q} onPress={() => ask(q)} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="label" color={colors.textSecondary}>
          Entdecken
        </AppText>
        {NAV_CARDS.map((card) => (
          <Card
            key={card.route}
            onPress={() => navigation.navigate(card.route)}
            style={styles.navCard}
          >
            <View style={styles.navIcon}>
              <Ionicons name={card.icon} size={28} color={colors.primary} />
            </View>
            <View style={styles.navText}>
              <AppText variant="subheading">{card.title}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {card.subtitle}
              </AppText>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={colors.textMuted}
            />
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  introCard: { backgroundColor: colors.surfaceAlt, borderColor: colors.primarySoft },
  introHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  introIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introTitle: { flex: 1 },
  section: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  navCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  navIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: { flex: 1, gap: spacing.xs / 2 },
});
