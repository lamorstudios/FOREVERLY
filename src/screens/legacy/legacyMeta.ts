export interface InterviewGroup {
  title: string;
  emoji: string;
  /** Fragen für die Zukunft (Zeitkapsel-Charakter)? */
  future?: boolean;
  questions: string[];
}

/** Vorgefertigte Interview-Fragen, nach Lebensthemen gruppiert. */
export const INTERVIEW_GROUPS: InterviewGroup[] = [
  {
    title: 'Kindheit',
    emoji: '🧸',
    questions: ['Wie war deine Kindheit?', 'Wo bist du aufgewachsen?'],
  },
  {
    title: 'Familie',
    emoji: '💛',
    questions: ['Wie hast du deinen Partner kennengelernt?', 'Was war dein schönster Familienmoment?'],
  },
  {
    title: 'Leben',
    emoji: '🌟',
    questions: ['Worauf bist du besonders stolz?', 'Was würdest du heute anders machen?'],
  },
  {
    title: 'Zukunft',
    emoji: '🔮',
    future: true,
    questions: ['Was möchtest du deinen Enkeln mitgeben?', 'Was soll die Familie niemals vergessen?'],
  },
];

/** Flache Listen (Abwärtskompatibilität / einfache Nutzung). */
export const INTERVIEW_QUESTIONS = INTERVIEW_GROUPS.filter((g) => !g.future).flatMap((g) => g.questions);
export const FUTURE_QUESTIONS = INTERVIEW_GROUPS.filter((g) => g.future).flatMap((g) => g.questions);

/** Themen für Erinnerungsreisen. */
export const JOURNEY_THEMES: { label: string; query: string; emoji: string }[] = [
  { label: 'Kindheit', query: 'Kindheit Schule jung', emoji: '🧸' },
  { label: 'Urlaube', query: 'Urlaub Reise Strand Italien Ostsee', emoji: '🏖️' },
  { label: 'Familienfeste', query: 'Fest Feier Weihnachten Geburtstag Hochzeit', emoji: '🎉' },
  { label: 'Liebe', query: 'Liebe Hochzeit Herz', emoji: '💛' },
  { label: 'Arbeit & Beruf', query: 'Arbeit Beruf Handwerk', emoji: '🛠️' },
];
