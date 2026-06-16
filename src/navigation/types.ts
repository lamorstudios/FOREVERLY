import type { NavigatorScreenParams } from '@react-navigation/native';
import type { SafetyTripKind, FilmKind } from '@/types/models';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyEmail: { email: string };
};

export type OnboardingStackParamList = {
  NoFamily: undefined;
  CreateFamily: undefined;
  JoinFamily: { code?: string } | undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  SeniorMode: undefined;
  Status: undefined;
  Notifications: undefined;
  Calendar: undefined;
  CalendarEventForm: undefined;
  Emergency: undefined;
  EmergencyContactForm: undefined;
  Documents: undefined;
  DocumentForm: { documentId?: string } | undefined;
  // Phase 4 · Familienbuch
  BookHome: undefined;
  BookCreate: undefined;
  BookPreview: { projectId: string };
  BookChapter: { projectId: string; chapterKey: string };
  // Trusted Circle / Vertrauenskreis
  TrustedCircle: { personId?: string } | undefined;
  TrustedContactForm: { personId?: string } | undefined;
  // Phase 4.5 · Familiennähe & Zweige
  Closeness: undefined;
  Branches: undefined;
  // Phase 6 · Familienmomente & Events
  MomentsHome: undefined;
  Feed: undefined;
  MomentCompose: { eventId?: string } | undefined;
  MomentDetail: { momentId: string };
  Events: undefined;
  EventForm: undefined;
  EventDetail: { eventId: string };
  Chronik: undefined;
  Challenges: undefined;
  PhotoMemories: undefined;
  // Familienhistoriker (im Start-Hub statt eigenem Tab → max. 5 Tabs)
  HistorianHome: undefined;
  HistorianAnswer: { query: string };
  HistorianSearch: undefined;
  Wisdoms: undefined;
  Timeline: undefined;
  ImportantPeople: undefined;
  PersonInsight: { personId: string };
  KnowledgeGaps: undefined;
  // Phase 8 · KI-Familienhistoriker
  FamilyKnowledge: undefined;
  HistorianTopics: undefined;
  OnThisDay: undefined;
  // Phase 10 · Familienfilm
  FilmGallery: undefined;
  FilmCreate: { kind?: FilmKind } | undefined;
  FilmPlayer: { projectId: string };
  // Phase 11 · KI-Familienassistent
  Assistant: undefined;
  // Phase 12 · Legacy AI · Familienstimmen
  LegacyHub: undefined;
  LegacyPerson: { personId: string };
  LifeInterview: { personId: string };
  MemoryJourney: { query: string; title: string };
  // Phase 13 · Familienmuseum
  MuseumHub: undefined;
  Generations: undefined;
  TimeTravel: undefined;
  FamilyPlaces: undefined;
  Artifacts: undefined;
  ArtifactForm: { artifactId?: string } | undefined;
  // Phase 6 · Family Safety & Live Location
  LiveMap: undefined;
  LocationSettings: undefined;
  TripStart: { kind?: SafetyTripKind } | undefined;
  TripDetail: { tripId: string };
  Sos: undefined;
};

export type FamilyStackParamList = {
  Network: undefined;
  PersonProfile: { personId: string };
  PersonForm: { personId?: string };
  AddRelationship: { personId: string };
  Members: undefined;
  Invite: undefined;
  // Phase 5 · Smart Invites
  SmartInvite: { personId?: string } | undefined;
  InvitesList: undefined;
  Suggestions: undefined;
};

export type MemoriesStackParamList = {
  MemoriesHub: undefined;
  MemoryList: { personId?: string } | undefined;
  MemoryDetail: { memoryId: string };
  MemoryForm: { personId?: string } | undefined;
  PhotoGallery: { personId?: string } | undefined;
  AudioList: { personId?: string } | undefined;
  AudioRecord: { personId?: string } | undefined;
};

export type CapsulesStackParamList = {
  CapsuleList: undefined;
  CapsuleForm: undefined;
  CapsuleDetail: { capsuleId: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  FamilySettings: undefined;
  // Trustee & Nachlass-Freigabe
  EstateHub: undefined;
  Trustees: undefined;
  TrusteeForm: { trusteeId?: string } | undefined;
  EstateInfoForm: undefined;
  EstateCase: { caseId: string };
  // Phase 7 · Family Vault
  VaultHub: undefined;
  VaultEntries: undefined;
  VaultEntryForm: { entryId?: string } | undefined;
  Legacy: undefined;
  LegacyForm: { itemId?: string } | undefined;
  Farewell: undefined;
  FarewellForm: { messageId?: string } | undefined;
  Heirs: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  FamilyTab: NavigatorScreenParams<FamilyStackParamList>;
  MemoriesTab: NavigatorScreenParams<MemoriesStackParamList>;
  CapsulesTab: NavigatorScreenParams<CapsulesStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};
