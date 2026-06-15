import type { NavigatorScreenParams } from '@react-navigation/native';

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
};

export type FamilyStackParamList = {
  Network: undefined;
  PersonProfile: { personId: string };
  PersonForm: { personId?: string };
  AddRelationship: { personId: string };
  Members: undefined;
  Invite: undefined;
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
};

export type HistorianStackParamList = {
  HistorianHome: undefined;
  HistorianAnswer: { query: string };
  HistorianSearch: undefined;
  Wisdoms: undefined;
  Timeline: undefined;
  ImportantPeople: undefined;
  PersonInsight: { personId: string };
  KnowledgeGaps: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  FamilyTab: NavigatorScreenParams<FamilyStackParamList>;
  MemoriesTab: NavigatorScreenParams<MemoriesStackParamList>;
  CapsulesTab: NavigatorScreenParams<CapsulesStackParamList>;
  HistorianTab: NavigatorScreenParams<HistorianStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};
