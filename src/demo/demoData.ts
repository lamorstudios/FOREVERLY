import type {
  Activity,
  Audio,
  Family,
  FamilyMember,
  Invitation,
  Memory,
  Person,
  PersonQuote,
  PersonTribute,
  Photo,
  Profile,
  Relationship,
  TimeCapsule,
  TimeCapsuleRecipient,
  MemberStatus,
  AppNotification,
  EmergencyContact,
  EmergencyEvent,
  CalendarEvent,
  CalendarEventType,
  FamilyDocument,
  StatusLevel,
  BookProject,
  TrustedContact,
  TrustedRole,
  ClosenessRating,
  ClosenessLevel,
  FamilyBranch,
  VisibilityLevel,
  RelationshipSuggestion,
  FamilyEvent,
  EventParticipant,
  Moment,
  MomentComment,
  Trustee,
  EstateInfo,
  EstateCase,
  EstateConfirmation,
  LiveShare,
  SafetyTrip,
  SafetyAlert,
  VaultEntry,
  LegacyItem,
  FarewellMessage,
  FilmProject,
  LifeStory,
  FamilyWisdom,
  Artifact,
  Feedback,
} from '@/types/models';
import { coverImage, photoImage, portraitImage } from './images';

export const DEMO_USER_ID = 'demo-user-nick';
export const DEMO_FAMILY_ID = 'fam-mielke';

const now = new Date();
function daysFromNow(days: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
function isoDate(value: string): string {
  return value; // bereits YYYY-MM-DD
}

export interface DemoDataset {
  profile: Profile;
  family: Family;
  members: FamilyMember[];
  invitations: Invitation[];
  persons: Person[];
  relationships: Relationship[];
  memories: Memory[];
  photos: Photo[];
  // Phase 16 · Ehrenmitglieder & Familienerbe
  quotes: PersonQuote[];
  tributes: PersonTribute[];
  audios: Audio[];
  capsules: TimeCapsule[];
  recipients: TimeCapsuleRecipient[];
  activities: Activity[];
  // Phase 2
  statuses: MemberStatus[];
  notifications: AppNotification[];
  emergencyContacts: EmergencyContact[];
  emergencyEvents: EmergencyEvent[];
  calendarEvents: CalendarEvent[];
  documents: FamilyDocument[];
  bookProjects: BookProject[];
  trustedContacts: TrustedContact[];
  closenessRatings: ClosenessRating[];
  branches: FamilyBranch[];
  suggestions: RelationshipSuggestion[];
  events: FamilyEvent[];
  eventParticipants: EventParticipant[];
  moments: Moment[];
  momentComments: MomentComment[];
  // Trustee & Nachlass-Freigabe
  trustees: Trustee[];
  estateInfos: EstateInfo[];
  estateCases: EstateCase[];
  estateConfirmations: EstateConfirmation[];
  // Family Safety & Live Location
  liveShares: LiveShare[];
  safetyTrips: SafetyTrip[];
  safetyAlerts: SafetyAlert[];
  // Family Vault · Dokumente & Vermächtnis
  vaultEntries: VaultEntry[];
  legacyItems: LegacyItem[];
  farewellMessages: FarewellMessage[];
  // Familienfilm
  filmProjects: FilmProject[];
  // Legacy AI · Familienstimmen
  lifeStories: LifeStory[];
  familyWisdoms: FamilyWisdom[];
  // Familienmuseum · Artefakte
  artifacts: Artifact[];
  // Feedback
  feedback: Feedback[];
}

/** Erzeugt einen frischen Demo-Datensatz (Familie Mielke). */
export function createSeedData(): DemoDataset {
  const profile: Profile = {
    id: DEMO_USER_ID,
    email: 'nick@foreverly.demo',
    full_name: 'Nick Mielke',
    avatar_url: portraitImage('NM'),
    bio: 'Sammelt die Erinnerungen der Familie Mielke. 💛',
    created_at: daysFromNow(-400),
    updated_at: daysFromNow(-10),
  };

  const family: Family = {
    id: DEMO_FAMILY_ID,
    name: 'Familie Mielke',
    image_url: coverImage('Familie Mielke'),
    created_by: DEMO_USER_ID,
    created_at: daysFromNow(-400),
    updated_at: daysFromNow(-30),
  };

  const members: FamilyMember[] = [
    {
      id: 'fm-nick',
      family_id: DEMO_FAMILY_ID,
      user_id: DEMO_USER_ID,
      role: 'admin',
      joined_at: daysFromNow(-400),
      profile,
    },
  ];

  // --- Personen im Familiennetzwerk ---
  const persons: Person[] = [
    person('p-nick', 'Nick', 'Mielke', '1995-04-12', 'Hamburg', null, 'NM', DEMO_USER_ID),
    person('p-mutter', 'Sabine', 'Mielke', '1968-08-03', 'Lübeck', null, 'SM'),
    person('p-vater', 'Thomas', 'Mielke', '1965-02-20', 'Hamburg', null, 'TM'),
    person('p-oma', 'Erika', 'Mielke', '1942-11-30', 'Rostock', null, 'EM'),
    person('p-opa', 'Hans', 'Mielke', '1940-05-17', 'Rostock', '2018-03-02', 'HM'),
    person('p-uroma', 'Anna', 'Krüger', '1918-07-09', 'Stettin', '1999-12-24', 'AK'),
    person('p-uropa', 'Karl', 'Krüger', '1915-01-22', 'Stettin', '1991-06-15', 'KK'),
    person('p-stief', 'Peter', 'Hoffmann', '1962-09-09', 'Bremen', null, 'PH'),
    person('p-pflege', 'Mia', 'Mielke', '2012-03-15', 'Hamburg', null, 'MM'),
    // Phase 4.5: zusätzliche Personen für „Beziehung ≠ Nähe"
    person('p-halb', 'Jonas', 'Mielke', '2000-05-05', 'Hamburg', null, 'JM'),
    person('p-stiefmutter', 'Claudia', 'Mielke', '1970-03-03', 'Kiel', null, 'CM'),
    person('p-cousin', 'Max', 'Krüger', '1996-08-08', 'Berlin', null, 'MK'),
    person('p-schwager', 'Peter', 'Wagner', '1985-01-01', 'Hamburg', null, 'PW'),
    // Stiefgeschwister: Tochter des Stiefvaters Peter Hoffmann
    person('p-stiefschwester', 'Lena', 'Hoffmann', '1998-10-10', 'Bremen', null, 'LH'),
    // Phase 5 · Smart Invites: Nick lud Bruder Max ein; Max fügte Tochter Lea hinzu
    person('p-max', 'Max', 'Mielke', '1992-02-02', 'Hamburg', null, 'MX', 'demo-user-max'),
    person('p-lea', 'Lea', 'Mielke', '2018-06-06', 'Hamburg', null, 'LE'),
  ];

  // Biografien (vorhandene Daten – Grundlage für Kurzbiografien & Lebensweisheiten)
  const biographies: Record<string, string> = {
    'p-nick': 'Nick sammelt die Erinnerungen der Familie Mielke.',
    'p-mutter': 'Sabine arbeitet als Krankenschwester in Lübeck.',
    'p-vater': 'Thomas ist Ingenieur und begeisterter Hobbygärtner.',
    'p-oma':
      'Erika wuchs in Rostock auf und arbeitete viele Jahre als Lehrerin. Sie sagte oft: Familie ist wichtiger als Geld.',
    'p-opa':
      'Hans war Tischler und liebte die Seefahrt. Seine Lebensweisheit war: Ehrliche Arbeit bringt Zufriedenheit.',
    'p-uroma':
      'Anna war bekannt für ihren Streuselkuchen und ihre Gastfreundschaft. Sie sagte: Wahres Glück liegt in der Familie.',
    'p-uropa':
      'Karl stammte aus Stettin und führte einen kleinen Handwerksbetrieb.',
  };
  for (const person of persons) {
    if (biographies[person.id]) person.biography = biographies[person.id]!;
  }
  // Phase 12: Familienlegenden (eigene Legacy-Seite)
  for (const person of persons) {
    if (['p-oma', 'p-opa', 'p-uroma'].includes(person.id)) person.is_legend = true;
  }
  // Phase 16: Ehrenmitglieder / Familienerbe (verstorbene Angehörige werden
  // respektvoll bewahrt – kein Trauerbereich).
  const memorialTraits: Record<string, string> = {
    'p-opa': 'Tischler aus Leidenschaft, liebte die Seefahrt und sonntägliche Spaziergänge am Hafen. Immer mit einer Geschichte auf den Lippen.',
    'p-uroma': 'Bekannt für ihren Streuselkuchen, ihre Gastfreundschaft und ihr herzliches Lachen. Bei ihr war die ganze Familie willkommen.',
    'p-uropa': 'Handwerker aus Stettin, fleißig und bescheiden. Er legte den Grundstein für die Familiengeschichte der Krügers.',
  };
  for (const person of persons) {
    // Verstorbene Angehörige sind standardmäßig Familienerbe-Profile.
    if (person.death_date) person.is_memorial = true;
    if (memorialTraits[person.id]) person.traits = memorialTraits[person.id]!;
  }

  // --- Beziehungen (farblich codiert) ---
  const relationships: Relationship[] = [
    // Grün – biologische Verwandtschaft
    rel('r1', 'p-nick', 'p-mutter', 'mutter', 'biological'),
    rel('r2', 'p-nick', 'p-vater', 'vater', 'biological'),
    rel('r3', 'p-nick', 'p-oma', 'oma', 'biological'),
    rel('r4', 'p-nick', 'p-opa', 'opa', 'biological'),
    rel('r5', 'p-mutter', 'p-oma', 'mutter', 'biological'),
    rel('r6', 'p-oma', 'p-uroma', 'mutter', 'biological'),
    rel('r7', 'p-uroma', 'p-oma', 'tochter', 'biological'),
    // Blau – angeheiratete Familie
    rel('r8', 'p-mutter', 'p-vater', 'ehepartner', 'married'),
    rel('r9', 'p-oma', 'p-opa', 'ehepartner', 'married'),
    rel('r10', 'p-uroma', 'p-uropa', 'ehepartner', 'married'),
    // Gelb – Patchwork / Stieffamilie
    rel('r11', 'p-nick', 'p-stief', 'stiefvater', 'patchwork'),
    rel('r12', 'p-stief', 'p-mutter', 'lebenspartner', 'patchwork'),
    // Lila – Adoption / Pflegefamilie
    rel('r13', 'p-mutter', 'p-pflege', 'pflegekind', 'adoption'),
    rel('r14', 'p-vater', 'p-pflege', 'pflegekind', 'adoption'),
    // Phase 4.5: Beziehungen der zusätzlichen Personen
    rel('r15', 'p-nick', 'p-halb', 'bruder', 'biological'),
    rel('r16', 'p-nick', 'p-stiefmutter', 'stiefmutter', 'patchwork'),
    rel('r17', 'p-nick', 'p-cousin', 'cousin', 'biological'),
    rel('r18', 'p-nick', 'p-schwager', 'sonstige', 'married'),
    // Phase 5: Nick → Max (Bruder), Max → Lea (Tochter)
    rel('r19', 'p-nick', 'p-max', 'bruder', 'biological'),
    rel('r20', 'p-max', 'p-lea', 'tochter', 'biological'),
    // Stiefgeschwister Lena (Tochter des Stiefvaters) – Patchwork (gelb)
    rel('r21', 'p-stief', 'p-stiefschwester', 'tochter', 'patchwork'),
    rel('r22', 'p-nick', 'p-stiefschwester', 'schwester', 'patchwork'),
  ];

  // Phase 5 · Smart Invites: gesendete Einladung (Nick lud Max ein, angenommen)
  const invitations: Invitation[] = [
    {
      id: 'inv-max',
      family_id: DEMO_FAMILY_ID,
      code: 'MAXBRUDER',
      role: 'member',
      email: null,
      status: 'accepted',
      invited_by: DEMO_USER_ID,
      accepted_by: 'demo-user-max',
      accepted_at: daysFromNow(-12),
      expires_at: daysFromNow(18),
      created_at: daysFromNow(-14),
      person_id: 'p-max',
      inviter_person_id: 'p-nick',
      relationship_type: 'bruder',
      suggested_closeness: 'inner',
      message: 'Nick lädt dich ein, Teil der Familiengeschichte auf FAMII zu werden.',
    },
  ];

  // Phase 5 · Beziehungsvorschlag: „Lea könnte deine Nichte sein"
  const suggestions: RelationshipSuggestion[] = [
    {
      id: 'sug-lea',
      family_id: DEMO_FAMILY_ID,
      from_person_id: 'p-nick',
      to_person_id: 'p-lea',
      suggested_type: 'nichte',
      suggested_category: 'biological',
      reason: 'Lea ist das Kind von Max (deinem Bruder).',
      status: 'pending',
      created_by: DEMO_USER_ID,
      created_at: daysFromNow(-2),
    },
  ];

  // Phase 4.5: individuelle Familiennähe von Nick (Beziehung ≠ Nähe!)
  const closenessRatings: ClosenessRating[] = [
    closeness('cl1', 'p-halb', 'inner'),        // Halbbruder, aber ❤️ Inner Circle
    closeness('cl2', 'p-stiefmutter', 'inner'), // Stiefmutter, aber ❤️ Inner Circle
    closeness('cl3', 'p-oma', 'sehr_nah'),      // 💛
    closeness('cl4', 'p-cousin', 'familie'),    // 💙
    closeness('cl5', 'p-schwager', 'erweitert'),// 🤍 Erweiterter Kreis
    closeness('cl6', 'p-mutter', 'inner'),
    closeness('cl7', 'p-vater', 'inner'),
    closeness('cl8', 'p-max', 'inner'), // Nick stuft Bruder Max als Inner Circle ein
    closeness('cl9', 'p-stiefschwester', 'familie'), // Stiefschwester Lena 💙
    closeness('cl10', 'p-pflege', 'inner'),          // Pflegekind Mia ❤️
    closeness('cl11', 'p-stief', 'sehr_nah'),         // Stiefvater 💛
  ];

  // Phase 4.5: Familienzweige
  const branches: FamilyBranch[] = [
    branch('br-vater', 'Vaterseite', '#5B8A5A', ['p-vater', 'p-oma', 'p-opa', 'p-uroma', 'p-uropa']),
    branch('br-mutter', 'Mutterseite', '#4A78A8', ['p-mutter', 'p-cousin']),
    branch('br-patchwork', 'Patchwork-Seite', '#D6A93B', ['p-stiefmutter', 'p-stief', 'p-pflege', 'p-stiefschwester']),
    branch('br-angeheiratet', 'Angeheiratete Familie', '#8A6BB0', ['p-schwager', 'p-stief', 'p-stiefmutter']),
  ];

  // --- Erinnerungen ---
  const memories: Memory[] = [
    memory('m1', 'Unser Sommerurlaub 2006', 'Drei Wochen an der Ostsee – Sandburgen, Eis und endlose Sonnentage. Das war unser schönster Familienurlaub.', 'photo', 'p-nick', '2006-07-20', -45),
    memory('m2', 'Hier haben Oma und Opa geheiratet', 'Erika und Hans gaben sich 1963 in der kleinen Kirche in Rostock das Ja-Wort.', 'photo', 'p-oma', '1963-06-08', -120),
    memory('m3', 'Opas Geschichten', 'Opa Hans erzählt von seiner Kindheit in Rostock. Diese Aufnahme ist ein kleiner Schatz.', 'audio', 'p-opa', '2015-11-01', -200),
    memory('m4', 'Mias erster Schultag', 'Mit Schultüte und einem riesigen Lächeln – Mia konnte es kaum erwarten.', 'photo', 'p-pflege', '2018-09-01', -7),
    memory('m5', 'Sonntagskaffee bei Uroma Anna', 'Jeden Sonntag gab es selbstgebackenen Streuselkuchen. Den Duft vergisst man nie.', 'text', 'p-uroma', '1997-05-11', -300),
    memory('m6', 'Oma Erikas 80. Geburtstag', 'Die ganze Familie feierte Erika zum 80. Geburtstag – mit Streuselkuchen, alten Fotos und vielen Geschichten aus Rostock.', 'photo', 'p-oma', '2022-11-30', -60),
    // „Heute in der Familiengeschichte": gleicher Tag/Monat, frühere Jahre
    memory('m7', 'Familienurlaub in Italien', 'Im Sommer waren wir gemeinsam am Gardasee – Eis, Sonne und lange Abende mit der ganzen Familie.', 'photo', 'p-nick', new Date(now.getFullYear() - 12, now.getMonth(), now.getDate()).toISOString().slice(0, 10), -90),
    memory('m8', 'Oma Erikas Kindheit in Rostock', 'Erika wuchs nach dem Krieg in Rostock auf. Sie erzählte oft von der Schule, vom Garten ihrer Mutter und davon, wie wichtig Zusammenhalt in schweren Zeiten war.', 'audio', 'p-oma', '1955-04-10', -140),
  ];

  // Phase 4.5: Sichtbarkeit einzelner Erinnerungen (Demo)
  const memoryVisibility: Record<string, VisibilityLevel> = {
    m1: 'family', // Urlaub – für alle
    m3: 'sehr_nah', // Opas Geschichten – nur sehr nahe Familie
    m4: 'inner', // Mias Schultag – nur Inner Circle
    m5: 'family',
  };
  for (const m of memories) {
    m.visibility = memoryVisibility[m.id] ?? 'family';
  }

  // --- Fotos (Platzhalter) ---
  const photos: Photo[] = [
    photo('ph1', 'Strandtag 2006', 'p-nick', 'm1', '#4A78A8'),
    photo('ph2', 'Hochzeit 1963', 'p-oma', 'm2', '#B07D4B'),
    photo('ph3', 'Mias Einschulung', 'p-pflege', 'm4', '#8A6BB0'),
    photo('ph4', 'Familienfest im Garten', null, null, '#5B8A5A'),
    photo('ph5', 'Weihnachten bei Oma Erika', 'p-oma', null, '#C8A24A'),
    photo('ph6', 'Nick & Mia am See', 'p-nick', null, '#4A78A8'),
    // Phase 16: Galerie der Familienerbe-Profile
    photo('ph7', 'Opa Hans in seiner Werkstatt', 'p-opa', null, '#8A6F4B'),
    photo('ph8', 'Hans an der Ostsee', 'p-opa', null, '#4A78A8'),
    photo('ph9', 'Uroma Anna beim Backen', 'p-uroma', null, '#C8A24A'),
    photo('ph10', 'Anna & Karl in Stettin', 'p-uroma', null, '#B07D4B'),
    photo('ph11', 'Uropa Karl in seinem Handwerksbetrieb', 'p-uropa', null, '#5B8A5A'),
  ];

  // --- Audios (Platzhalter) ---
  const audios: Audio[] = [
    audio('a1', 'Opas Kriegserinnerungen', 'p-opa', 'm3', 184, -200),
    audio('a2', 'Annas Lieblingsrezept', 'p-uroma', null, 95, -260),
    audio('a3', 'Nicks Geburtstagsständchen', 'p-nick', null, 42, -3),
    audio('a4', 'Oma Erika erzählt von früher', 'p-oma', null, 132, -150),
  ];
  // Phase 12: Transkripte (durchsuchbar, Originalstimmen für Filme/Legacy)
  const transcripts: Record<string, string> = {
    a4: 'Ich bin in Rostock aufgewachsen. Als Kind haben wir im Garten meiner Mutter gespielt. Familie war immer das Wichtigste – das möchte ich euch mitgeben.',
    a1: 'Die Jahre nach dem Krieg waren hart, aber ehrliche Arbeit hat uns durchgebracht.',
    a2: 'Mein Streuselkuchen-Rezept: viel Butter, viel Geduld und noch mehr Liebe.',
  };
  for (const a of audios) if (transcripts[a.id]) a.transcript = transcripts[a.id]!;
  // Phase 8: automatische Transkriptionen (durchsuchbar für den Historiker)
  const audioTranscripts: Record<string, string> = {
    a1: 'Ich war Tischler und liebte die Seefahrt. Ehrliche Arbeit bringt Zufriedenheit.',
    a2: 'Mein Streuselkuchen gelingt mit doppelt so vielen Streuseln und viel Butter – mit Liebe gebacken.',
    a4: 'Ich wuchs in Rostock auf und arbeitete viele Jahre als Lehrerin. Familie ist wichtiger als Geld. Am liebsten erinnere ich mich an unsere Sommer an der Ostsee.',
  };
  for (const a of audios) a.transcript = audioTranscripts[a.id] ?? null;

  // --- Zeitkapseln ---
  const capsules: TimeCapsule[] = [
    capsule('tc1', 'Für dich zum 30. Geburtstag, Nick', 'Eine kleine Nachricht aus der Vergangenheit für deinen großen Tag.', 'text', 'Lieber Nick, wenn du das liest, bist du 30 …', daysFromNow(92), false),
    capsule('tc2', 'Eine Überraschung', 'Bald darfst du sie öffnen!', 'text', 'Du hast es fast geschafft – nur noch ein paar Tage Geduld. 💛', daysFromNow(5), false),
    capsule('tc3', 'Für meine Tochter zur Hochzeit', 'Worte voller Liebe für Mias großen Tag in der Zukunft.', 'text', 'Meine liebe Mia …', '2035-06-01T09:00:00.000Z', false),
    capsule('tc4', 'Für meinen Enkel zum 18. Geburtstag', 'Damit ein Stück Familiengeschichte weiterlebt.', 'text', 'Willkommen im Erwachsenenleben …', '2042-01-01T09:00:00.000Z', false),
    capsule('tc5', 'Brief an die Familie – Weihnachten 2020', 'Geschrieben im besonderen Jahr 2020.', 'text', 'Auch wenn dieses Jahr anders war: Wir halten zusammen. In Liebe, Nick.', daysFromNow(-540), true),
  ];

  const recipients: TimeCapsuleRecipient[] = [
    recipient('tr1', 'tc1', null, DEMO_USER_ID),
    recipient('tr2', 'tc2', null, DEMO_USER_ID),
    recipient('tr3', 'tc3', 'p-pflege', null),
    recipient('tr4', 'tc4', 'p-nick', null),
    recipient('tr5', 'tc5', null, DEMO_USER_ID),
  ];

  // --- Aktivitäts-Feed ---
  const activities: Activity[] = [
    activity('ac1', 'memory.created', 'memory', 'm4', 'Mias erster Schultag', -7, profile),
    activity('ac2', 'audio.created', 'audio', 'a3', 'Nicks Geburtstagsständchen', -3, profile),
    activity('ac3', 'photo.uploaded', 'photo', 'ph6', 'Nick & Mia am See', -2, profile),
    activity('ac4', 'time_capsule.created', 'time_capsule', 'tc2', 'Eine Überraschung', -1, profile),
  ];

  // --- Phase 2: Familienstatus ---
  const statuses: MemberStatus[] = [
    status('st-nick', 'p-nick', 'gut', null, -1),
    status('st-oma', 'p-oma', 'unwohl', 'Mir geht es heute nicht so gut.', -0),
    status('st-opa', 'p-opa', 'okay', null, -2),
  ];

  // --- Phase 2: Benachrichtigungen (emotional, antippbar) ---
  const notifications: AppNotification[] = [
    notify('nt1', 'status', '💛 Oma Erika fühlt sich gerade etwas allein.', 'Schau doch mal nach – eine Nachricht tut gut.', 0, { type: 'status', route: 'Status' }),
    notify('nt2', 'info', '📸 Sabine hat neue Fotos geteilt.', 'Frische Momente vom Sommergrillen.', 0, { type: 'photo', tab: 'MemoriesTab', screen: 'PhotoGallery' }),
    notify('nt3', 'info', '🎤 Opa Hans hat eine neue Sprachnachricht aufgenommen.', 'Hör dir die Originalstimme an.', -1, { type: 'audio', route: 'MomentsHome' }),
    notify('nt4', 'info', '🎉 Max ist eurer Familie beigetreten.', 'Heißt das neue Familienmitglied willkommen.', -1, { type: 'member_joined', tab: 'FamilyTab', screen: 'Network' }),
    notify('nt5', 'calendar', '⏳ Eure Zeitkapsel für Nick öffnet sich in 7 Tagen.', 'Bald gibt es etwas zu entdecken.', -2, { type: 'capsule_opening', tab: 'CapsulesTab', screen: 'CapsuleList' }),
    notify('nt6', 'calendar', '🎂 Morgen hat Papa Geburtstag.', 'Vergiss nicht zu gratulieren.', -2, { type: 'event_soon', route: 'Calendar' }),
    notify('nt7', 'info', '📍 Nick teilt gerade seinen Heimweg.', 'Du kannst den Weg live verfolgen.', -3, { type: 'location', route: 'LiveMap' }),
    notify('nt8', 'info', '🎙️ Zeit, eine Geschichte zu bewahren.', 'Nimm dir einen Moment für Oma Erika.', -4, { type: 'interview_reminder', route: 'LegacyHub' }),
  ];

  // --- Phase 2: Notfallkontakte ---
  const emergencyContacts: EmergencyContact[] = [
    contact('ec1', 'Sabine Mielke', 'Tochter', '+49 170 1234567', 'p-mutter', 0),
    contact('ec2', 'Dr. Wagner (Hausarzt)', 'Hausarzt', '+49 451 998877', null, 1),
    contact('ec3', 'Notruf', 'Rettungsdienst', '112', null, 2),
  ];

  // --- Phase 2: Notfallereignisse (ein gelöstes Beispiel) ---
  const emergencyEvents: EmergencyEvent[] = [
    {
      id: 'ev1',
      family_id: DEMO_FAMILY_ID,
      triggered_by: DEMO_USER_ID,
      state: 'resolved',
      latitude: 53.8655,
      longitude: 10.6866,
      location_label: 'Lübeck, Musterstraße 1',
      message: 'Test-Notfall (bereits gelöst).',
      created_at: daysFromNow(-14),
      resolved_at: daysFromNow(-14),
      resolved_by: DEMO_USER_ID,
    },
  ];

  // --- Phase 2: Familienkalender ---
  const calendarEvents: CalendarEvent[] = [
    cal('cal1', 'geburtstag', 'Geburtstag Oma Erika', '1942-11-30', true, ['p-oma']),
    cal('cal2', 'jahrestag', 'Hochzeitstag Erika & Hans', '1963-06-08', true, ['p-oma', 'p-opa']),
    calRel('cal3', 'arzttermin', 'Arzttermin Opa Hans', 3, ['p-opa'], '10:30'),
    calRel('cal4', 'familienereignis', 'Großes Familienfest im Garten', 21, [], null, true),
    calRel('cal5', 'erinnerung', 'Mia für Schwimmkurs anmelden', 9, ['p-pflege'], null),
    calRel('cal6', 'geburtstag', 'Geburtstag Mia', 5, ['p-pflege'], null),
  ];

  // --- Phase 2: Dokumentenübersicht (nur Metadaten) ---
  const documents: FamilyDocument[] = [
    doc('doc1', 'testament', 'Testament', true, 'Liegt beim Notar', 'Notar Dr. Berger', 'Beglaubigte Abschrift bei Sabine.'),
    doc('doc2', 'patientenverfuegung', 'Patientenverfügung', true, 'Ordner im Schlafzimmerschrank', 'Sabine Mielke', null),
    doc('doc3', 'vorsorgevollmacht', 'Vorsorgevollmacht', false, null, null, 'Muss noch erstellt werden.'),
    doc('doc4', 'versicherung', 'Versicherungsunterlagen', true, 'Versicherungsordner im Wohnzimmer', 'Max Mustermann', null),
  ];

  // --- Trusted Circle: Vertrauenspersonen (Opa Hans wohnt 700 km entfernt) ---
  const trustedContacts: TrustedContact[] = [
    trusted('tc-mueller', 'p-opa', 'Herr Müller', 'nachbar', '+49 381 5550101',
      'Wohnt im selben Haus und kann im Notfall nachsehen.', true),
    trusted('tc-peter', 'p-opa', 'Peter Schneider', 'freund', '+49 381 5550202',
      'Kennt Opa Hans seit 30 Jahren.', false),
    trusted('tc-berger', 'p-opa', 'Frau Berger', 'pflegekontakt', '+49 381 5550303',
      'Kommt zweimal pro Woche vorbei.', true),
    trusted('tc-schneiderin', 'p-oma', 'Frau Schneider', 'nachbar', '+49 451 5550404',
      'Nachbarin von Oma Erika, immer erreichbar.', false),
    trusted('tc-pflege-oma', 'p-oma', 'Pflegedienst Lübeck', 'pflegekontakt', '+49 451 5550505',
      'Betreut Oma Erika werktags.', true),
  ];

  // --- Phase 4: Beispiel-Familienbuch ---
  const bookProjects: BookProject[] = [
    {
      id: 'book1',
      family_id: DEMO_FAMILY_ID,
      type: 'komplett',
      title: 'Die Geschichte der Familie Mielke',
      subtitle: 'Ein Familienbuch',
      cover_photo_path: family.image_url,
      hidden_chapters: [],
      chapter_order: [],
      options: {},
      status: 'ready',
      created_by: DEMO_USER_ID,
      created_at: daysFromNow(-5),
      updated_at: daysFromNow(-5),
    },
  ];

  // --- Phase 6: Familienevent „Sommergrillen bei Nick" ---
  const events: FamilyEvent[] = [
    {
      id: 'ev-grill',
      family_id: DEMO_FAMILY_ID,
      type: 'grillfest',
      title: 'Sommergrillen bei Nick',
      description: 'Großes Grillfest im Garten – die ganze Familie ist eingeladen!',
      event_date: daysFromNow(-3).slice(0, 10),
      event_time: '16:00',
      location: 'Nicks Garten, Hamburg',
      host_user_id: DEMO_USER_ID,
      host_person_id: 'p-nick',
      visibility: 'family',
      created_by: DEMO_USER_ID,
      created_at: daysFromNow(-20),
      updated_at: daysFromNow(-20),
    },
    {
      id: 'ev-fest',
      family_id: DEMO_FAMILY_ID,
      type: 'feier',
      title: 'Sommerfest der Familie Mielke',
      description: 'Ein lauer Sommerabend mit der ganzen Familie – kommt vorbei!',
      event_date: daysFromNow(14).slice(0, 10),
      event_time: '15:00',
      location: 'Garten bei Oma Erika, Lübeck',
      host_user_id: DEMO_USER_ID,
      host_person_id: 'p-nick',
      visibility: 'family',
      created_by: DEMO_USER_ID,
      created_at: daysFromNow(-2),
      updated_at: daysFromNow(-2),
    },
  ];

  const eventParticipants: EventParticipant[] = [
    part('ep1', 'p-nick', DEMO_USER_ID, 'yes', null, '🔥 Grillkohle'),
    part('ep2', 'p-max', 'demo-user-max', 'yes', 'Ich freu mich riesig!', '🥤 Getränke'),
    part('ep3', 'p-oma', null, 'maybe', null, null),
    part('ep4', 'p-opa', null, 'yes', null, '🍰 Kuchen'),
  ];

  const moments: Moment[] = [
    moment('mo1', 'photo', 'Das Grillen war ein Fest! 🔥', photoImage('Sommergrillen', '#D6A93B'), DEMO_USER_ID, 'ev-grill', -3),
    moment('mo2', 'photo', 'Max am Grill 😄', photoImage('Am Grill', '#B07D4B'), 'demo-user-max', 'ev-grill', -3),
    moment('mo3', 'audio', 'Opas Anekdote vom Grill', '', DEMO_USER_ID, 'ev-grill', -3),
    moment('mo4', 'text', 'Schön war es mit der ganzen Familie 💛', null, DEMO_USER_ID, 'ev-grill', -3),
    // Familienfeed (ohne Event)
    moment('mo5', 'text', 'Guten Morgen, liebe Familie! ☀️', null, DEMO_USER_ID, null, -1),
    moment('mo6', 'photo', 'Sonntagsspaziergang', photoImage('Spaziergang', '#5B8A5A'), DEMO_USER_ID, null, -2),
  ];

  const momentComments: MomentComment[] = [
    { id: 'mc1', moment_id: 'mo1', author_user_id: 'demo-user-max', text: 'Tolle Aufnahme!', created_at: daysFromNow(-3) },
    { id: 'mc2', moment_id: 'mo1', author_user_id: DEMO_USER_ID, text: 'Danke! War ein super Tag.', created_at: daysFromNow(-3) },
  ];

  // --- Vertrauenspersonen (Trustees) von Nick ---
  const trustees: Trustee[] = [
    trustee('tr-max', 'Max Mielke', 'Bruder', 'p-max', '+49 170 2223344'),
    trustee('tr-sabine', 'Sabine Mielke', 'Mutter', 'p-mutter', '+49 170 1234567'),
    trustee('tr-thomas', 'Thomas Mielke', 'Vater', 'p-vater', '+49 170 5556677'),
  ];

  // --- Nachlasshinweise von Nick (keine sensiblen Zugangsdaten) ---
  const estateInfos: EstateInfo[] = [
    {
      id: 'est-nick',
      family_id: DEMO_FAMILY_ID,
      owner_user_id: DEMO_USER_ID,
      has_will: true,
      will_location: 'Beim Notar Dr. Berger hinterlegt',
      has_patient_decree: true,
      patient_decree_location: 'Ordner „Wichtiges" im Schlafzimmerschrank',
      has_power_of_attorney: false,
      power_of_attorney_location: null,
      has_insurance: true,
      insurance_location: 'Versicherungsordner im Wohnzimmer · Ansprechpartnerin: Sabine',
      contact_person: 'Sabine Mielke',
      contact_person_id: 'p-mutter',
      personal_notes:
        'Bitte kümmert euch zuerst um Oma Erika. Die Familienfotos sind mir am wichtigsten – sie sollen bei euch bleiben. 💛',
      farewell_message:
        'Wenn ihr das lest, denkt an die schönen Momente. Ich bin dankbar für jeden Tag mit euch.',
      media_path: null,
      release_audience: 'trustees',
      recipient_person_ids: [],
      required_confirmations: 2,
      updated_at: daysFromNow(-10),
    },
  ];

  // Demo-Freigabe: Todesfall gemeldet, 2 von 3 bestätigt → freigegeben.
  const estateCases: EstateCase[] = [
    {
      id: 'case-demo', family_id: DEMO_FAMILY_ID, subject_user_id: DEMO_USER_ID, subject_person_id: 'p-nick',
      reported_by_user_id: 'demo-user-max', reported_by_trustee_id: 'tr-max', reported_by_name: 'Max Mielke',
      status: 'released', required_confirmations: 2, note: null,
      created_at: daysFromNow(-1), updated_at: daysFromNow(-1), released_at: daysFromNow(-1),
    },
  ];
  const estateConfirmations: EstateConfirmation[] = [
    { id: 'conf-sabine', case_id: 'case-demo', trustee_id: 'tr-sabine', confirmer_name: 'Sabine Mielke', decision: 'confirm', note: null, created_at: daysFromNow(-1) },
    { id: 'conf-thomas', case_id: 'case-demo', trustee_id: 'tr-thomas', confirmer_name: 'Thomas Mielke', decision: 'confirm', note: null, created_at: daysFromNow(-1) },
  ];

  // --- Family Vault · Dokumente, Vermächtnisse, Abschiedsnachrichten ---
  const vaultEntries: VaultEntry[] = [
    vault('v-test', 'testament', 'Testament', 'Notariell beglaubigtes Testament.', 'Beim Notar Dr. Berger hinterlegt', 'Notar Dr. Berger', 'trustees'),
    vault('v-pv', 'patientenverfuegung', 'Patientenverfügung', 'Regelt medizinische Wünsche.', 'Ordner „Wichtiges" im Schlafzimmerschrank', 'Sabine Mielke', 'inner'),
    vault('v-vers', 'versicherung', 'Versicherungsunterlagen', 'Lebens-, Haftpflicht- und Hausratversicherung.', 'Versicherungsordner im Wohnzimmer', 'Sabine Mielke', 'children'),
    vault('v-immo', 'immobilie', 'Wohnungsunterlagen', 'Kaufvertrag & Grundbuchauszug der Wohnung.', 'Aktenschrank im Büro, Fach 2', null, 'trustees'),
    vault('v-notar', 'notar', 'Notar-Kontakt', 'Zuständiger Notar für Testament & Vollmachten.', 'Kanzlei Berger, Hamburg', 'Dr. Berger · +49 40 998877', 'trustees'),
    vault('v-kfz', 'fahrzeug', 'Fahrzeugunterlagen', 'Fahrzeugbrief & Versicherung VW Passat.', 'Handschuhfach / Ordner Auto', null, 'inner'),
  ];

  const legacyItems: LegacyItem[] = [
    legacy('lg-wert', 'wert', 'Zusammenhalt', 'Familie ist wichtiger als alles andere. Haltet zusammen, besonders in schweren Zeiten.', 'children'),
    legacy('lg-lektion', 'lektion', 'Ehrliche Arbeit', 'Opa Hans sagte immer: Ehrliche Arbeit bringt Zufriedenheit. Das hat mich mein Leben lang begleitet.', 'inner'),
    legacy('lg-rezept', 'rezept', 'Omas Streuselkuchen', 'Das Geheimnis: doppelt so viele Streusel wie man denkt – und mit Liebe backen. 🥧', 'children'),
    legacy('lg-ort', 'ort', 'Unser Ostsee-Strand', 'Der Strand bei Rostock, wo wir jeden Sommer waren. Geht dort hin, wenn ihr an mich denken wollt.', 'inner'),
  ];

  const farewellMessages: FarewellMessage[] = [
    farewell('fw-fam', 'text', 'Für meine Familie', 'inner', 'Wenn ihr das lest: Ich bin dankbar für jeden Tag mit euch. Denkt an die schönen Momente.'),
    farewell('fw-mia', 'audio', 'Für Mia', 'children', 'Eine kurze Sprachnachricht für dich, kleine Mia. 💛'),
  ];

  // --- Familienfilme (Storyboards aus echten Inhalten) ---
  const filmYear = now.getFullYear();
  const filmProjects: FilmProject[] = [
    film('film-grill', 'event', 'Sommergrillen', 'Ein Tag voller Lachen, Grillduft und Familie', 'froehlich', 'none', { eventId: 'ev-grill' }, true),
    film('film-oma', 'documentary', 'Die Geschichte von Oma Erika', 'Ein Leben in Rostock, Lübeck und der ganzen Familie', 'nostalgisch', 'none', { personId: 'p-oma' }, true),
    film('film-year', 'year', `Familienjahr ${filmYear}`, 'Die schönsten Momente des Jahres', 'feierlich', 'none', { year: filmYear }, true),
    film('film-legacy', 'legacy', 'Mein Vermächtnis', 'Für meine Familie – zu öffnen, wenn es soweit ist', 'emotional', 'death', { personId: 'p-nick' }, false),
  ];

  // --- Legacy AI · Lebensinterview Oma Erika ---
  const lifeStories: LifeStory[] = [
    life('ls-kindheit', 'p-oma', 'Wie war deine Kindheit?', 'audio', 'Ich bin in Rostock aufgewachsen, nach dem Krieg. Wir hatten wenig, aber viel Zusammenhalt.', false),
    life('ls-hans', 'p-oma', 'Wie hast du Opa Hans kennengelernt?', 'text', 'Auf einem Tanzabend 1962 in Rostock. Er konnte überhaupt nicht tanzen – aber er hat mich zum Lachen gebracht.', false),
    life('ls-enkel', 'p-oma', 'Was möchtest du deinen Enkeln mitgeben?', 'text', 'Haltet zusammen und seid dankbar für die kleinen Dinge. Familie ist wichtiger als Geld.', true),
  ];

  // --- Familienweisheiten (kurze gesammelte Aussagen) ---
  const familyWisdoms: FamilyWisdom[] = [
    { id: 'fw-1', family_id: DEMO_FAMILY_ID, text: 'Familie steht an erster Stelle.', author_person_id: 'p-oma', created_at: daysFromNow(-30) },
    { id: 'fw-2', family_id: DEMO_FAMILY_ID, text: 'Gib niemals auf.', author_person_id: 'p-opa', created_at: daysFromNow(-22) },
    { id: 'fw-3', family_id: DEMO_FAMILY_ID, text: 'Nutze jede Chance.', author_person_id: null, created_at: daysFromNow(-12) },
  ];

  // --- Familienmuseum · Artefakte ---
  const artifacts: Artifact[] = [
    artifact('art-album', 'fotoalbum', 'Das alte Familienalbum', 'Ledergebundenes Fotoalbum mit Aufnahmen ab 1955.', 'Begonnen von Uroma Anna, weitergegeben an Oma Erika.', 'p-oma', 'Wohnzimmerschrank, Rostock', 1955),
    artifact('art-uhr', 'uhr', 'Opas Taschenuhr', 'Silberne Taschenuhr, ein Geschenk zur Hochzeit 1963.', 'Von Opa Hans an Nick vererbt.', 'p-opa', 'Vitrine', 1963),
    artifact('art-haus', 'haus', 'Das Familienhaus in Rostock', 'Das Haus, in dem Oma und Opa viele Jahrzehnte lebten.', 'Mehrere Generationen sind hier aufgewachsen.', 'p-oma', 'Rostock', 1958),
    artifact('art-firma', 'unternehmen', 'Krügers Handwerksbetrieb', 'Kleiner Handwerksbetrieb in Stettin.', 'Gegründet von Uropa Karl.', 'p-uropa', 'Stettin', 1938),
  ];

  // Eine Zeitkapsel „erst nach meinem Tod öffnen".
  for (const c of capsules) if (c.id === 'tc4') c.open_on_death = true;

  // --- Family Safety & Live Location ---
  const minsFromNow = (m: number) => new Date(now.getTime() + m * 60000).toISOString();
  const liveShares: LiveShare[] = [
    {
      id: 'ls-nick', family_id: DEMO_FAMILY_ID, user_id: DEMO_USER_ID, person_id: 'p-nick',
      active: true, status: 'moving', status_label: null, place_label: 'Hamburg, Innenstadt',
      latitude: 53.5511, longitude: 9.9937, battery: 72, audience: 'inner', recipient_person_ids: [],
      duration: 'today', expires_at: minsFromNow(360), updated_at: minsFromNow(-4),
    },
    {
      id: 'ls-oma', family_id: DEMO_FAMILY_ID, user_id: 'u-oma', person_id: 'p-oma',
      active: true, status: 'doctor', status_label: null, place_label: 'Praxis Dr. Wagner, Lübeck',
      latitude: 53.8655, longitude: 10.6866, battery: 45, audience: 'trusted', recipient_person_ids: [],
      duration: '1h', expires_at: minsFromNow(40), updated_at: minsFromNow(-9),
    },
  ];

  const safetyTrips: SafetyTrip[] = [
    {
      id: 'trip-sabine', family_id: DEMO_FAMILY_ID, user_id: 'u-sabine', person_id: 'p-mutter',
      kind: 'heimweg', destination_label: 'Zuhause, Lübeck', eta: minsFromNow(18), status: 'active',
      audience: 'inner', recipient_person_ids: [], battery: 63,
      started_at: minsFromNow(-12), arrived_at: null, updated_at: minsFromNow(-2),
    },
    {
      id: 'trip-oma', family_id: DEMO_FAMILY_ID, user_id: 'u-oma', person_id: 'p-oma',
      kind: 'safe_arrival', destination_label: 'Praxis Dr. Wagner', eta: null, status: 'arrived',
      audience: 'inner', recipient_person_ids: [], battery: 45,
      started_at: minsFromNow(-50), arrived_at: minsFromNow(-8), updated_at: minsFromNow(-8),
    },
  ];

  const safetyAlerts: SafetyAlert[] = [
    {
      id: 'sos-demo', family_id: DEMO_FAMILY_ID, user_id: 'u-opa', person_id: 'p-opa',
      message: 'Mir ist schwindelig, bitte ruft mich an.', place_label: 'Zuhause, Rostock',
      latitude: 54.0924, longitude: 12.0991, battery: 88, status: 'resolved',
      created_at: daysFromNow(-2), resolved_at: daysFromNow(-2),
    },
  ];

  // Phase 16: Zitate („Was sie oft gesagt haben")
  const quotes: PersonQuote[] = [
    quote('q1', 'p-opa', 'Wer rastet, der rostet.', 'sagte er jeden Morgen vor der Arbeit', 'Oma Erika'),
    quote('q2', 'p-opa', 'Ehrliche Arbeit bringt Zufriedenheit.', null, 'Nick Mielke'),
    quote('q3', 'p-uroma', 'Wahres Glück liegt in der Familie.', 'beim Sonntagskaffee', 'Oma Erika'),
    quote('q4', 'p-uroma', 'Ein Stück Kuchen geht immer noch.', null, 'Sabine Mielke'),
    quote('q5', 'p-uropa', 'Was du heute kannst besorgen, das verschiebe nicht auf morgen.', null, 'Oma Erika'),
  ];

  // Phase 16: Erinnerungen an die Person (von Familienmitgliedern hinterlassen)
  const tributes: PersonTribute[] = [
    tribute('t1', 'p-opa', 'Ich erinnere mich noch daran, wie Opa Hans mir in seiner Werkstatt gezeigt hat, wie man ein Vogelhäuschen baut. Wir haben den ganzen Nachmittag gewerkelt.', 'Nick Mielke', -30),
    tribute('t2', 'p-opa', 'Seine Geschichten von der Seefahrt habe ich geliebt. Jeden Sommer nahm er uns mit zum Hafen.', 'Sabine Mielke', -50),
    tribute('t3', 'p-uroma', 'Der Duft ihres Streuselkuchens hängt mir bis heute in der Nase. Bei Uroma Anna fühlte man sich immer zuhause.', 'Oma Erika', -80),
    tribute('t4', 'p-uroma', 'Sie hatte für jeden ein offenes Ohr und ein warmes Lächeln. Niemand ging hungrig aus ihrem Haus.', 'Nick Mielke', -20),
  ];

  return {
    profile,
    family,
    members,
    invitations,
    persons,
    relationships,
    memories,
    photos,
    quotes,
    tributes,
    audios,
    capsules,
    recipients,
    activities,
    statuses,
    notifications,
    emergencyContacts,
    emergencyEvents,
    calendarEvents,
    documents,
    bookProjects,
    trustedContacts,
    closenessRatings,
    branches,
    suggestions,
    events,
    eventParticipants,
    moments,
    momentComments,
    trustees,
    estateInfos,
    estateCases,
    estateConfirmations,
    liveShares,
    safetyTrips,
    safetyAlerts,
    vaultEntries,
    legacyItems,
    farewellMessages,
    filmProjects,
    lifeStories,
    familyWisdoms,
    artifacts,
    feedback: [],
  };

  // --- Fabrik-Helfer ---
  function artifact(
    id: string,
    category: Artifact['category'],
    title: string,
    description: string,
    story: string,
    ownerPersonId: string | null,
    location: string,
    year: number,
  ): Artifact {
    return {
      id, family_id: DEMO_FAMILY_ID, category, title, description, story,
      owner_person_id: ownerPersonId, location, year, photo_path: null,
      created_by: DEMO_USER_ID, created_at: daysFromNow(-9),
    };
  }
  function life(
    id: string,
    personId: string,
    question: string,
    kind: LifeStory['kind'],
    content: string,
    future: boolean,
  ): LifeStory {
    return {
      id, family_id: DEMO_FAMILY_ID, person_id: personId, question, kind, content,
      media_path: null, is_future_question: future, created_at: daysFromNow(-12),
    };
  }
  function film(
    id: string,
    kind: FilmProject['kind'],
    title: string,
    subtitle: string,
    music: FilmProject['music'],
    lock: FilmProject['lock'],
    options: FilmProject['options'],
    auto: boolean,
  ): FilmProject {
    return {
      id, family_id: DEMO_FAMILY_ID, owner_user_id: DEMO_USER_ID, kind, title, subtitle,
      music, lock, open_at: null, visibility: 'family', options, hidden_chapters: [],
      cover_path: null, auto, created_at: daysFromNow(-6), updated_at: daysFromNow(-6),
    };
  }
  function vault(
    id: string,
    category: VaultEntry['category'],
    title: string,
    description: string | null,
    location: string | null,
    contact: string | null,
    audience: VaultEntry['release_audience'],
  ): VaultEntry {
    return {
      id, family_id: DEMO_FAMILY_ID, owner_user_id: DEMO_USER_ID, category, title,
      description, location, contact_person: contact, contact_person_id: null,
      has_document: false, release_audience: audience,
      created_at: daysFromNow(-20), updated_at: daysFromNow(-10),
    };
  }
  function legacy(
    id: string,
    kind: LegacyItem['kind'],
    title: string,
    content: string,
    audience: LegacyItem['for_audience'],
  ): LegacyItem {
    return {
      id, family_id: DEMO_FAMILY_ID, owner_user_id: DEMO_USER_ID, kind, title, content,
      for_audience: audience, created_at: daysFromNow(-18), updated_at: daysFromNow(-18),
    };
  }
  function farewell(
    id: string,
    kind: FarewellMessage['kind'],
    title: string,
    recipient: FarewellMessage['recipient'],
    content: string,
  ): FarewellMessage {
    return {
      id, family_id: DEMO_FAMILY_ID, owner_user_id: DEMO_USER_ID, kind, title, recipient,
      content, media_path: null, created_at: daysFromNow(-15), updated_at: daysFromNow(-15),
    };
  }
  function trustee(
    id: string,
    name: string,
    relation: string,
    personId: string | null,
    phone: string | null,
  ): Trustee {
    return {
      id,
      family_id: DEMO_FAMILY_ID,
      owner_user_id: DEMO_USER_ID,
      person_id: personId,
      name,
      relation,
      phone,
      email: null,
      role: relation,
      can_confirm_death: true,
      created_at: daysFromNow(-30),
    };
  }

  function person(
    id: string,
    first: string,
    last: string,
    birth: string | null,
    birthPlace: string | null,
    death: string | null,
    initials: string,
    userId: string | null = null,
  ): Person {
    return {
      id,
      family_id: DEMO_FAMILY_ID,
      user_id: userId,
      first_name: first,
      last_name: last,
      avatar_url: portraitImage(initials),
      birth_date: birth ? isoDate(birth) : null,
      birth_place: birthPlace,
      death_date: death ? isoDate(death) : null,
      biography: null,
      created_by: DEMO_USER_ID,
      created_at: daysFromNow(-390),
      updated_at: daysFromNow(-30),
    };
  }

  function rel(
    id: string,
    from: string,
    to: string,
    type: Relationship['type'],
    category: Relationship['category'],
  ): Relationship {
    return {
      id,
      family_id: DEMO_FAMILY_ID,
      from_person_id: from,
      to_person_id: to,
      type,
      category,
      created_by: DEMO_USER_ID,
      created_at: daysFromNow(-380),
    };
  }

  function memory(
    id: string,
    title: string,
    description: string,
    contentType: Memory['content_type'],
    personId: string | null,
    occurred: string,
    createdOffset: number,
  ): Memory {
    return {
      id,
      family_id: DEMO_FAMILY_ID,
      person_id: personId,
      author_id: DEMO_USER_ID,
      title,
      description,
      content_type: contentType,
      occurred_on: occurred,
      created_at: daysFromNow(createdOffset),
      updated_at: daysFromNow(createdOffset),
    };
  }

  function photo(
    id: string,
    caption: string,
    personId: string | null,
    memoryId: string | null,
    color: string,
  ): Photo {
    return {
      id,
      family_id: DEMO_FAMILY_ID,
      memory_id: memoryId,
      person_id: personId,
      storage_path: photoImage(caption, color),
      caption,
      width: 800,
      height: 600,
      uploaded_by: DEMO_USER_ID,
      created_at: daysFromNow(-20),
    };
  }

  function quote(
    id: string,
    personId: string,
    text: string,
    context: string | null,
    addedByName: string,
  ): PersonQuote {
    return {
      id,
      family_id: DEMO_FAMILY_ID,
      person_id: personId,
      text,
      context,
      added_by_user_id: addedByName === 'Nick Mielke' ? DEMO_USER_ID : null,
      added_by_name: addedByName,
      created_at: daysFromNow(-40),
    };
  }

  function tribute(
    id: string,
    personId: string,
    text: string,
    authorName: string,
    createdOffset: number,
  ): PersonTribute {
    return {
      id,
      family_id: DEMO_FAMILY_ID,
      person_id: personId,
      text,
      author_user_id: authorName === 'Nick Mielke' ? DEMO_USER_ID : null,
      author_name: authorName,
      created_at: daysFromNow(createdOffset),
    };
  }

  function audio(
    id: string,
    title: string,
    personId: string | null,
    memoryId: string | null,
    duration: number,
    createdOffset: number,
  ): Audio {
    return {
      id,
      family_id: DEMO_FAMILY_ID,
      memory_id: memoryId,
      person_id: personId,
      storage_path: '',
      title,
      duration_seconds: duration,
      recorded_by: DEMO_USER_ID,
      created_at: daysFromNow(createdOffset),
    };
  }

  function capsule(
    id: string,
    title: string,
    description: string,
    contentType: TimeCapsule['content_type'],
    textContent: string | null,
    openAt: string,
    isOpened: boolean,
  ): TimeCapsule {
    return {
      id,
      family_id: DEMO_FAMILY_ID,
      creator_id: DEMO_USER_ID,
      title,
      description,
      content_type: contentType,
      text_content: textContent,
      storage_path: null,
      open_at: openAt,
      is_opened: isOpened,
      created_at: daysFromNow(-30),
      updated_at: daysFromNow(-30),
    };
  }

  function recipient(
    id: string,
    capsuleId: string,
    personId: string | null,
    userId: string | null,
  ): TimeCapsuleRecipient {
    return {
      id,
      capsule_id: capsuleId,
      person_id: personId,
      user_id: userId,
      created_at: daysFromNow(-30),
    };
  }

  function activity(
    id: string,
    action: string,
    entityType: string,
    entityId: string,
    summary: string,
    createdOffset: number,
    actor: Profile,
  ): Activity {
    return {
      id,
      family_id: DEMO_FAMILY_ID,
      actor_id: DEMO_USER_ID,
      action,
      entity_type: entityType,
      entity_id: entityId,
      summary,
      created_at: daysFromNow(createdOffset),
      actor,
    };
  }

  function status(
    id: string,
    personId: string,
    level: StatusLevel,
    message: string | null,
    offset: number,
  ): MemberStatus {
    return {
      id,
      family_id: DEMO_FAMILY_ID,
      person_id: personId,
      level,
      message,
      updated_by: DEMO_USER_ID,
      created_at: daysFromNow(offset),
      updated_at: daysFromNow(offset),
    };
  }

  function notify(
    id: string,
    category: AppNotification['category'],
    title: string,
    body: string,
    offset: number,
    data: Record<string, unknown> = {},
  ): AppNotification {
    return {
      id,
      family_id: DEMO_FAMILY_ID,
      recipient_user_id: null,
      actor_user_id: DEMO_USER_ID,
      category,
      title,
      body,
      data,
      is_read: false,
      created_at: daysFromNow(offset),
    };
  }

  function contact(
    id: string,
    name: string,
    relation: string,
    phone: string,
    personId: string | null,
    priority: number,
  ): EmergencyContact {
    return {
      id,
      family_id: DEMO_FAMILY_ID,
      person_id: personId,
      name,
      relation,
      phone,
      note: null,
      priority,
      created_by: DEMO_USER_ID,
      created_at: daysFromNow(-30),
    };
  }

  function cal(
    id: string,
    type: CalendarEventType,
    title: string,
    date: string,
    isAnnual: boolean,
    participantIds: string[],
  ): CalendarEvent {
    return {
      id,
      family_id: DEMO_FAMILY_ID,
      type,
      title,
      description: null,
      event_date: date,
      event_time: null,
      is_annual: isAnnual,
      for_whole_family: false,
      created_by: DEMO_USER_ID,
      created_at: daysFromNow(-30),
      updated_at: daysFromNow(-30),
      participant_ids: participantIds,
    };
  }

  function calRel(
    id: string,
    type: CalendarEventType,
    title: string,
    dayOffset: number,
    participantIds: string[],
    time: string | null,
    wholeFamily = false,
  ): CalendarEvent {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    const iso = d.toISOString().slice(0, 10);
    return {
      id,
      family_id: DEMO_FAMILY_ID,
      type,
      title,
      description: null,
      event_date: iso,
      event_time: time,
      is_annual: false,
      for_whole_family: wholeFamily,
      created_by: DEMO_USER_ID,
      created_at: daysFromNow(-10),
      updated_at: daysFromNow(-10),
      participant_ids: participantIds,
    };
  }

  function part(
    id: string,
    personId: string,
    userId: string | null,
    rsvp: EventParticipant['rsvp'],
    comment: string | null,
    bringing: string | null,
  ): EventParticipant {
    return {
      id,
      event_id: 'ev-grill',
      person_id: personId,
      user_id: userId,
      rsvp,
      comment,
      bringing,
      responded_at: rsvp ? daysFromNow(-5) : null,
      created_at: daysFromNow(-18),
    };
  }

  function moment(
    id: string,
    kind: Moment['kind'],
    text: string | null,
    storagePath: string | null,
    authorUserId: string,
    eventId: string | null,
    offset: number,
  ): Moment {
    return {
      id,
      family_id: DEMO_FAMILY_ID,
      author_user_id: authorUserId,
      kind,
      text,
      storage_path: storagePath,
      duration_seconds: kind === 'audio' ? 47 : null,
      visibility: 'family',
      event_id: eventId,
      created_at: daysFromNow(offset),
    };
  }

  function closeness(
    id: string,
    personId: string,
    level: ClosenessLevel,
  ): ClosenessRating {
    return {
      id,
      family_id: DEMO_FAMILY_ID,
      rater_user_id: DEMO_USER_ID,
      person_id: personId,
      level,
      created_at: daysFromNow(-15),
      updated_at: daysFromNow(-15),
    };
  }

  function branch(
    id: string,
    name: string,
    color: string,
    memberIds: string[],
  ): FamilyBranch {
    return {
      id,
      family_id: DEMO_FAMILY_ID,
      name,
      color,
      created_by: DEMO_USER_ID,
      created_at: daysFromNow(-25),
      member_ids: memberIds,
    };
  }

  function trusted(
    id: string,
    personId: string,
    name: string,
    role: TrustedRole,
    phone: string,
    note: string,
    isEmergency: boolean,
  ): TrustedContact {
    return {
      id,
      family_id: DEMO_FAMILY_ID,
      person_id: personId,
      name,
      role,
      phone,
      email: null,
      location: null,
      note,
      availability: null,
      is_emergency: isEmergency,
      created_by: DEMO_USER_ID,
      created_at: daysFromNow(-20),
      updated_at: daysFromNow(-20),
    };
  }

  function doc(
    id: string,
    kind: FamilyDocument['kind'],
    title: string,
    available: boolean,
    location: string | null,
    contactPerson: string | null,
    note: string | null,
  ): FamilyDocument {
    return {
      id,
      family_id: DEMO_FAMILY_ID,
      kind,
      title,
      is_available: available,
      location,
      note,
      contact_person: contactPerson,
      contact_person_id: null,
      created_by: DEMO_USER_ID,
      created_at: daysFromNow(-30),
      updated_at: daysFromNow(-30),
    };
  }
}
