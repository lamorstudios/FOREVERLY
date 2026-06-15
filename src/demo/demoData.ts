import type {
  Activity,
  Audio,
  Family,
  FamilyMember,
  Invitation,
  Memory,
  Person,
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
  ];

  // --- Erinnerungen ---
  const memories: Memory[] = [
    memory('m1', 'Unser Sommerurlaub 2006', 'Drei Wochen an der Ostsee – Sandburgen, Eis und endlose Sonnentage. Das war unser schönster Familienurlaub.', 'photo', 'p-nick', '2006-07-20', -45),
    memory('m2', 'Hier haben Oma und Opa geheiratet', 'Erika und Hans gaben sich 1963 in der kleinen Kirche in Rostock das Ja-Wort.', 'photo', 'p-oma', '1963-06-08', -120),
    memory('m3', 'Opas Geschichten', 'Opa Hans erzählt von seiner Kindheit in Rostock. Diese Aufnahme ist ein kleiner Schatz.', 'audio', 'p-opa', '2015-11-01', -200),
    memory('m4', 'Mias erster Schultag', 'Mit Schultüte und einem riesigen Lächeln – Mia konnte es kaum erwarten.', 'photo', 'p-pflege', '2018-09-01', -7),
    memory('m5', 'Sonntagskaffee bei Uroma Anna', 'Jeden Sonntag gab es selbstgebackenen Streuselkuchen. Den Duft vergisst man nie.', 'text', 'p-uroma', '1997-05-11', -300),
  ];

  // --- Fotos (Platzhalter) ---
  const photos: Photo[] = [
    photo('ph1', 'Strandtag 2006', 'p-nick', 'm1', '#4A78A8'),
    photo('ph2', 'Hochzeit 1963', 'p-oma', 'm2', '#B07D4B'),
    photo('ph3', 'Mias Einschulung', 'p-pflege', 'm4', '#8A6BB0'),
    photo('ph4', 'Familienfest im Garten', null, null, '#5B8A5A'),
    photo('ph5', 'Weihnachten bei Oma Erika', 'p-oma', null, '#C8A24A'),
    photo('ph6', 'Nick & Mia am See', 'p-nick', null, '#4A78A8'),
  ];

  // --- Audios (Platzhalter) ---
  const audios: Audio[] = [
    audio('a1', 'Opas Kriegserinnerungen', 'p-opa', 'm3', 184, -200),
    audio('a2', 'Annas Lieblingsrezept', 'p-uroma', null, 95, -260),
    audio('a3', 'Nicks Geburtstagsständchen', 'p-nick', null, 42, -3),
  ];

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

  // --- Phase 2: Benachrichtigungen ---
  const notifications: AppNotification[] = [
    notify('nt1', 'status', 'Oma Erika fühlt sich nicht wohl', '🤒 „Mir geht es heute nicht so gut." – schau doch mal nach ihr.', 0),
    notify('nt2', 'calendar', 'Bald: Arzttermin Opa Hans', 'In wenigen Tagen steht ein Termin an.', -1),
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
  ];

  // --- Phase 2: Dokumentenübersicht (nur Metadaten) ---
  const documents: FamilyDocument[] = [
    doc('doc1', 'testament', 'Testament', true, 'Liegt beim Notar', 'Notar Dr. Berger', 'Beglaubigte Abschrift bei Sabine.'),
    doc('doc2', 'patientenverfuegung', 'Patientenverfügung', true, 'Ordner im Schlafzimmerschrank', 'Sabine Mielke', null),
    doc('doc3', 'vorsorgevollmacht', 'Vorsorgevollmacht', false, null, null, 'Muss noch erstellt werden.'),
    doc('doc4', 'versicherung', 'Versicherungsunterlagen', true, 'Versicherungsordner im Wohnzimmer', 'Max Mustermann', null),
  ];

  return {
    profile,
    family,
    members,
    invitations: [],
    persons,
    relationships,
    memories,
    photos,
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
  };

  // --- Fabrik-Helfer ---
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
  ): AppNotification {
    return {
      id,
      family_id: DEMO_FAMILY_ID,
      recipient_user_id: null,
      actor_user_id: DEMO_USER_ID,
      category,
      title,
      body,
      data: {},
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
