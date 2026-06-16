import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { stackScreenOptions } from './options';
import { colors } from '@/theme';
import type {
  MainTabParamList,
  HomeStackParamList,
  FamilyStackParamList,
  MemoriesStackParamList,
  CapsulesStackParamList,
  ProfileStackParamList,
} from './types';

// Screens
import { HomeScreen } from '@/screens/home/HomeScreen';
import { NetworkScreen } from '@/screens/family/NetworkScreen';
import { PersonProfileScreen } from '@/screens/family/PersonProfileScreen';
import { PersonFormScreen } from '@/screens/family/PersonFormScreen';
import { AddRelationshipScreen } from '@/screens/family/AddRelationshipScreen';
import { MembersScreen } from '@/screens/family/MembersScreen';
import { InviteScreen } from '@/screens/family/InviteScreen';
// Phase 5 · Smart Invites
import { SmartInviteScreen } from '@/screens/invites/SmartInviteScreen';
import { InvitesListScreen } from '@/screens/invites/InvitesListScreen';
import { SuggestionsScreen } from '@/screens/invites/SuggestionsScreen';
import { MemoriesHubScreen } from '@/screens/memories/MemoriesHubScreen';
import { MemoryListScreen } from '@/screens/memories/MemoryListScreen';
import { MemoryDetailScreen } from '@/screens/memories/MemoryDetailScreen';
import { MemoryFormScreen } from '@/screens/memories/MemoryFormScreen';
import { PhotoGalleryScreen } from '@/screens/memories/PhotoGalleryScreen';
import { AudioListScreen } from '@/screens/memories/AudioListScreen';
import { AudioRecordScreen } from '@/screens/memories/AudioRecordScreen';
import { CapsuleListScreen } from '@/screens/capsules/CapsuleListScreen';
import { CapsuleFormScreen } from '@/screens/capsules/CapsuleFormScreen';
import { CapsuleDetailScreen } from '@/screens/capsules/CapsuleDetailScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { EditProfileScreen } from '@/screens/profile/EditProfileScreen';
import { FamilySettingsScreen } from '@/screens/profile/FamilySettingsScreen';
// Trustee & Nachlass-Freigabe
import { EstateHubScreen } from '@/screens/estate/EstateHubScreen';
import { TrusteesScreen } from '@/screens/estate/TrusteesScreen';
import { TrusteeFormScreen } from '@/screens/estate/TrusteeFormScreen';
import { EstateInfoFormScreen } from '@/screens/estate/EstateInfoFormScreen';
import { EstateCaseScreen } from '@/screens/estate/EstateCaseScreen';
// Phase 7 · Family Vault
import { VaultHubScreen } from '@/screens/vault/VaultHubScreen';
import { VaultEntriesScreen } from '@/screens/vault/VaultEntriesScreen';
import { VaultEntryFormScreen } from '@/screens/vault/VaultEntryFormScreen';
import { LegacyScreen } from '@/screens/vault/LegacyScreen';
import { LegacyFormScreen } from '@/screens/vault/LegacyFormScreen';
import { FarewellScreen } from '@/screens/vault/FarewellScreen';
import { FarewellFormScreen } from '@/screens/vault/FarewellFormScreen';
import { HeirsScreen } from '@/screens/vault/HeirsScreen';
// Phase 6 · Family Safety & Live Location
import { LiveMapScreen } from '@/screens/safety/LiveMapScreen';
import { LocationSettingsScreen } from '@/screens/safety/LocationSettingsScreen';
import { TripStartScreen } from '@/screens/safety/TripStartScreen';
import { TripDetailScreen } from '@/screens/safety/TripDetailScreen';
import { SosScreen } from '@/screens/safety/SosScreen';
// Phase 2
import { StatusScreen } from '@/screens/phase2/StatusScreen';
import { NotificationsScreen } from '@/screens/phase2/NotificationsScreen';
import { CalendarScreen } from '@/screens/phase2/CalendarScreen';
import { CalendarEventFormScreen } from '@/screens/phase2/CalendarEventFormScreen';
import { EmergencyScreen } from '@/screens/phase2/EmergencyScreen';
import { EmergencyContactFormScreen } from '@/screens/phase2/EmergencyContactFormScreen';
import { DocumentsScreen } from '@/screens/phase2/DocumentsScreen';
import { DocumentFormScreen } from '@/screens/phase2/DocumentFormScreen';
import { SeniorModeScreen } from '@/screens/phase2/SeniorModeScreen';
// Phase 3 · Familienhistoriker
import { HistorianHomeScreen } from '@/screens/historian/HistorianHomeScreen';
import { HistorianAnswerScreen } from '@/screens/historian/HistorianAnswerScreen';
import { HistorianSearchScreen } from '@/screens/historian/HistorianSearchScreen';
import { WisdomsScreen } from '@/screens/historian/WisdomsScreen';
import { TimelineScreen } from '@/screens/historian/TimelineScreen';
import { ImportantPeopleScreen } from '@/screens/historian/ImportantPeopleScreen';
import { PersonInsightScreen } from '@/screens/historian/PersonInsightScreen';
import { KnowledgeGapsScreen } from '@/screens/historian/KnowledgeGapsScreen';
import { FamilyKnowledgeScreen } from '@/screens/historian/FamilyKnowledgeScreen';
import { TopicsScreen } from '@/screens/historian/TopicsScreen';
import { OnThisDayScreen } from '@/screens/historian/OnThisDayScreen';
// Phase 10 · Familienfilm
import { FilmGalleryScreen } from '@/screens/film/FilmGalleryScreen';
import { FilmCreateScreen } from '@/screens/film/FilmCreateScreen';
import { FilmPlayerScreen } from '@/screens/film/FilmPlayerScreen';
// Phase 11 · KI-Familienassistent
import { AssistantScreen } from '@/screens/assistant/AssistantScreen';
// Phase 12 · Legacy AI · Familienstimmen
import { LegacyHubScreen } from '@/screens/legacy/LegacyHubScreen';
import { LegacyPersonScreen } from '@/screens/legacy/LegacyPersonScreen';
import { LifeInterviewScreen } from '@/screens/legacy/LifeInterviewScreen';
import { MemoryJourneyScreen } from '@/screens/legacy/MemoryJourneyScreen';
import { FamilyYearScreen } from '@/screens/legacy/FamilyYearScreen';
import { FamilyWisdomsScreen } from '@/screens/legacy/FamilyWisdomsScreen';
// Phase 13 · Familienmuseum
import { MuseumHubScreen } from '@/screens/museum/MuseumHubScreen';
import { GenerationsScreen } from '@/screens/museum/GenerationsScreen';
import { TimeTravelScreen } from '@/screens/museum/TimeTravelScreen';
import { FamilyPlacesScreen } from '@/screens/museum/FamilyPlacesScreen';
import { ArtifactsScreen } from '@/screens/museum/ArtifactsScreen';
import { ArtifactFormScreen } from '@/screens/museum/ArtifactFormScreen';
// Phase 15 · Production
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { PremiumScreen } from '@/screens/settings/PremiumScreen';
import { RolesScreen } from '@/screens/settings/RolesScreen';
import { NotificationSettingsScreen } from '@/screens/settings/NotificationSettingsScreen';
import { PrivacyDataScreen } from '@/screens/settings/PrivacyDataScreen';
import { FeedbackScreen } from '@/screens/settings/FeedbackScreen';
import { LegalScreen } from '@/screens/legal/LegalScreen';
import { AdminDashboardScreen } from '@/screens/admin/AdminDashboardScreen';
import { GlobalSearchScreen } from '@/screens/search/GlobalSearchScreen';
// Phase 4 · Familienbuch
import { BookHomeScreen } from '@/screens/book/BookHomeScreen';
import { BookCreateScreen } from '@/screens/book/BookCreateScreen';
import { BookPreviewScreen } from '@/screens/book/BookPreviewScreen';
import { BookChapterScreen } from '@/screens/book/BookChapterScreen';
// Trusted Circle / Vertrauenskreis
import { TrustedCircleScreen } from '@/screens/trusted/TrustedCircleScreen';
import { TrustedContactFormScreen } from '@/screens/trusted/TrustedContactFormScreen';
// Phase 4.5 · Familiennähe & Zweige
import { ClosenessScreen } from '@/screens/closeness/ClosenessScreen';
import { BranchesScreen } from '@/screens/closeness/BranchesScreen';
// Phase 6 · Familienmomente & Events
import { MomentsHomeScreen } from '@/screens/moments/MomentsHomeScreen';
import { FeedScreen } from '@/screens/moments/FeedScreen';
import { MomentComposeScreen } from '@/screens/moments/MomentComposeScreen';
import { MomentDetailScreen } from '@/screens/moments/MomentDetailScreen';
import { EventsScreen } from '@/screens/moments/EventsScreen';
import { EventFormScreen } from '@/screens/moments/EventFormScreen';
import { EventDetailScreen } from '@/screens/moments/EventDetailScreen';
import { ChronikScreen } from '@/screens/moments/ChronikScreen';
import { ChallengesScreen } from '@/screens/moments/ChallengesScreen';
import { PhotoMemoriesScreen } from '@/screens/moments/PhotoMemoriesScreen';

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={stackScreenOptions}>
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Foreverly' }}
      />
      <HomeStack.Screen name="SeniorMode" component={SeniorModeScreen} options={{ title: 'Seniorenmodus' }} />
      <HomeStack.Screen name="Status" component={StatusScreen} options={{ title: 'Familienstatus' }} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Benachrichtigungen' }} />
      <HomeStack.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Familienkalender' }} />
      <HomeStack.Screen name="CalendarEventForm" component={CalendarEventFormScreen} options={{ title: 'Neuer Termin' }} />
      <HomeStack.Screen name="Emergency" component={EmergencyScreen} options={{ title: 'Notfall' }} />
      <HomeStack.Screen name="EmergencyContactForm" component={EmergencyContactFormScreen} options={{ title: 'Notfallkontakt' }} />
      <HomeStack.Screen name="Documents" component={DocumentsScreen} options={{ title: 'Dokumente' }} />
      <HomeStack.Screen name="DocumentForm" component={DocumentFormScreen} options={{ title: 'Dokument' }} />
      <HomeStack.Screen name="BookHome" component={BookHomeScreen} options={{ title: 'Familienbuch' }} />
      <HomeStack.Screen name="BookCreate" component={BookCreateScreen} options={{ title: 'Neues Buch' }} />
      <HomeStack.Screen name="BookPreview" component={BookPreviewScreen} options={{ title: 'Buchvorschau' }} />
      <HomeStack.Screen name="BookChapter" component={BookChapterScreen} options={{ title: 'Kapitel' }} />
      <HomeStack.Screen name="TrustedCircle" component={TrustedCircleScreen} options={{ title: 'Vertrauenskreis' }} />
      <HomeStack.Screen name="TrustedContactForm" component={TrustedContactFormScreen} options={{ title: 'Vertrauensperson' }} />
      <HomeStack.Screen name="Closeness" component={ClosenessScreen} options={{ title: 'Familiennähe' }} />
      <HomeStack.Screen name="Branches" component={BranchesScreen} options={{ title: 'Familienzweige' }} />
      <HomeStack.Screen name="MomentsHome" component={MomentsHomeScreen} options={{ title: 'Familienmomente' }} />
      <HomeStack.Screen name="Feed" component={FeedScreen} options={{ title: 'Familienfeed' }} />
      <HomeStack.Screen name="MomentCompose" component={MomentComposeScreen} options={{ title: 'Moment teilen' }} />
      <HomeStack.Screen name="MomentDetail" component={MomentDetailScreen} options={{ title: 'Moment' }} />
      <HomeStack.Screen name="Events" component={EventsScreen} options={{ title: 'Familienevents' }} />
      <HomeStack.Screen name="EventForm" component={EventFormScreen} options={{ title: 'Neues Event' }} />
      <HomeStack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Event' }} />
      <HomeStack.Screen name="Chronik" component={ChronikScreen} options={{ title: 'Familienchronik' }} />
      <HomeStack.Screen name="Challenges" component={ChallengesScreen} options={{ title: 'Challenges' }} />
      <HomeStack.Screen name="PhotoMemories" component={PhotoMemoriesScreen} options={{ title: 'Foto-Erinnerungen' }} />
      <HomeStack.Screen name="HistorianHome" component={HistorianHomeScreen} options={{ title: 'Familienhistoriker' }} />
      <HomeStack.Screen name="HistorianAnswer" component={HistorianAnswerScreen} options={{ title: 'Antwort' }} />
      <HomeStack.Screen name="HistorianSearch" component={HistorianSearchScreen} options={{ title: 'Suche' }} />
      <HomeStack.Screen name="Wisdoms" component={WisdomsScreen} options={{ title: 'Lebensweisheiten' }} />
      <HomeStack.Screen name="Timeline" component={TimelineScreen} options={{ title: 'Zeitleiste' }} />
      <HomeStack.Screen name="ImportantPeople" component={ImportantPeopleScreen} options={{ title: 'Wichtige Personen' }} />
      <HomeStack.Screen name="PersonInsight" component={PersonInsightScreen} options={{ title: 'Person' }} />
      <HomeStack.Screen name="KnowledgeGaps" component={KnowledgeGapsScreen} options={{ title: 'Familienwissen retten' }} />
      <HomeStack.Screen name="FamilyKnowledge" component={FamilyKnowledgeScreen} options={{ title: 'Familienwissen' }} />
      <HomeStack.Screen name="HistorianTopics" component={TopicsScreen} options={{ title: 'Themen' }} />
      <HomeStack.Screen name="OnThisDay" component={OnThisDayScreen} options={{ title: 'Heute in der Geschichte' }} />
      <HomeStack.Screen name="FilmGallery" component={FilmGalleryScreen} options={{ title: 'Familienfilm' }} />
      <HomeStack.Screen name="FilmCreate" component={FilmCreateScreen} options={{ title: 'Film erstellen' }} />
      <HomeStack.Screen name="FilmPlayer" component={FilmPlayerScreen} options={{ title: 'Familienfilm' }} />
      <HomeStack.Screen name="Assistant" component={AssistantScreen} options={{ title: 'Familienassistent' }} />
      <HomeStack.Screen name="GlobalSearch" component={GlobalSearchScreen} options={{ title: 'Suche' }} />
      <HomeStack.Screen name="LegacyHub" component={LegacyHubScreen} options={{ title: 'Familienstimmen' }} />
      <HomeStack.Screen name="LegacyPerson" component={LegacyPersonScreen} options={{ title: 'Lebensgeschichte' }} />
      <HomeStack.Screen name="LifeInterview" component={LifeInterviewScreen} options={{ title: 'Erzähl deine Geschichte' }} />
      <HomeStack.Screen name="MemoryJourney" component={MemoryJourneyScreen} options={{ title: 'Erinnerungsreise' }} />
      <HomeStack.Screen name="FamilyYear" component={FamilyYearScreen} options={{ title: 'Euer Familienjahr' }} />
      <HomeStack.Screen name="FamilyWisdoms" component={FamilyWisdomsScreen} options={{ title: 'Familienweisheiten' }} />
      <HomeStack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Admin Dashboard' }} />
      <HomeStack.Screen name="MuseumHub" component={MuseumHubScreen} options={{ title: 'Familienmuseum' }} />
      <HomeStack.Screen name="Generations" component={GenerationsScreen} options={{ title: 'Generationenarchiv' }} />
      <HomeStack.Screen name="TimeTravel" component={TimeTravelScreen} options={{ title: 'Zeitreise' }} />
      <HomeStack.Screen name="FamilyPlaces" component={FamilyPlacesScreen} options={{ title: 'Familienorte' }} />
      <HomeStack.Screen name="Artifacts" component={ArtifactsScreen} options={{ title: 'Familienartefakte' }} />
      <HomeStack.Screen name="ArtifactForm" component={ArtifactFormScreen} options={{ title: 'Artefakt' }} />
      <HomeStack.Screen name="LiveMap" component={LiveMapScreen} options={{ title: 'Familienkarte' }} />
      <HomeStack.Screen name="LocationSettings" component={LocationSettingsScreen} options={{ title: 'Standort teilen' }} />
      <HomeStack.Screen name="TripStart" component={TripStartScreen} options={{ title: 'Unterwegs' }} />
      <HomeStack.Screen name="TripDetail" component={TripDetailScreen} options={{ title: 'Unterwegs' }} />
      <HomeStack.Screen name="Sos" component={SosScreen} options={{ title: 'SOS-Notruf' }} />
    </HomeStack.Navigator>
  );
}

const FamilyStack = createNativeStackNavigator<FamilyStackParamList>();
function FamilyStackNavigator() {
  return (
    <FamilyStack.Navigator screenOptions={stackScreenOptions}>
      <FamilyStack.Screen name="Network" component={NetworkScreen} options={{ title: 'Familiennetzwerk' }} />
      <FamilyStack.Screen name="PersonProfile" component={PersonProfileScreen} options={{ title: 'Profil' }} />
      <FamilyStack.Screen name="PersonForm" component={PersonFormScreen} options={{ title: 'Person' }} />
      <FamilyStack.Screen name="AddRelationship" component={AddRelationshipScreen} options={{ title: 'Beziehung hinzufügen' }} />
      <FamilyStack.Screen name="Members" component={MembersScreen} options={{ title: 'Mitglieder' }} />
      <FamilyStack.Screen name="Invite" component={InviteScreen} options={{ title: 'Einladen' }} />
      <FamilyStack.Screen name="SmartInvite" component={SmartInviteScreen} options={{ title: 'Familienmitglied einladen' }} />
      <FamilyStack.Screen name="InvitesList" component={InvitesListScreen} options={{ title: 'Einladungen' }} />
      <FamilyStack.Screen name="Suggestions" component={SuggestionsScreen} options={{ title: 'Beziehungsvorschläge' }} />
    </FamilyStack.Navigator>
  );
}

const MemoriesStack = createNativeStackNavigator<MemoriesStackParamList>();
function MemoriesStackNavigator() {
  return (
    <MemoriesStack.Navigator screenOptions={stackScreenOptions}>
      <MemoriesStack.Screen name="MemoriesHub" component={MemoriesHubScreen} options={{ title: 'Erinnerungen' }} />
      <MemoriesStack.Screen name="MemoryList" component={MemoryListScreen} options={{ title: 'Erinnerungen' }} />
      <MemoriesStack.Screen name="MemoryDetail" component={MemoryDetailScreen} options={{ title: 'Erinnerung' }} />
      <MemoriesStack.Screen name="MemoryForm" component={MemoryFormScreen} options={{ title: 'Neue Erinnerung' }} />
      <MemoriesStack.Screen name="PhotoGallery" component={PhotoGalleryScreen} options={{ title: 'Fotos' }} />
      <MemoriesStack.Screen name="AudioList" component={AudioListScreen} options={{ title: 'Audios' }} />
      <MemoriesStack.Screen name="AudioRecord" component={AudioRecordScreen} options={{ title: 'Audio aufnehmen' }} />
    </MemoriesStack.Navigator>
  );
}

const CapsulesStack = createNativeStackNavigator<CapsulesStackParamList>();
function CapsulesStackNavigator() {
  return (
    <CapsulesStack.Navigator screenOptions={stackScreenOptions}>
      <CapsulesStack.Screen name="CapsuleList" component={CapsuleListScreen} options={{ title: 'Zeitkapseln' }} />
      <CapsulesStack.Screen name="CapsuleForm" component={CapsuleFormScreen} options={{ title: 'Neue Zeitkapsel' }} />
      <CapsulesStack.Screen name="CapsuleDetail" component={CapsuleDetailScreen} options={{ title: 'Zeitkapsel' }} />
    </CapsulesStack.Navigator>
  );
}

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={stackScreenOptions}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Mein Profil' }} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Profil bearbeiten' }} />
      <ProfileStack.Screen name="FamilySettings" component={FamilySettingsScreen} options={{ title: 'Familie verwalten' }} />
      <ProfileStack.Screen name="EstateHub" component={EstateHubScreen} options={{ title: 'Nachlass & Hinweise' }} />
      <ProfileStack.Screen name="Trustees" component={TrusteesScreen} options={{ title: 'Vertrauenspersonen' }} />
      <ProfileStack.Screen name="TrusteeForm" component={TrusteeFormScreen} options={{ title: 'Vertrauensperson' }} />
      <ProfileStack.Screen name="EstateInfoForm" component={EstateInfoFormScreen} options={{ title: 'Nachlasshinweise' }} />
      <ProfileStack.Screen name="EstateCase" component={EstateCaseScreen} options={{ title: 'Nachlass-Freigabe' }} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Einstellungen' }} />
      <ProfileStack.Screen name="Premium" component={PremiumScreen} options={{ title: 'Premium' }} />
      <ProfileStack.Screen name="Roles" component={RolesScreen} options={{ title: 'Rollen & Rechte' }} />
      <ProfileStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ title: 'Benachrichtigungen' }} />
      <ProfileStack.Screen name="PrivacyData" component={PrivacyDataScreen} options={{ title: 'Datenschutz & Daten' }} />
      <ProfileStack.Screen name="Feedback" component={FeedbackScreen} options={{ title: 'Feedback' }} />
      <ProfileStack.Screen name="Legal" component={LegalScreen} options={{ title: 'Rechtliches' }} />
      <ProfileStack.Screen name="VaultHub" component={VaultHubScreen} options={{ title: 'Dokumente & Nachlass' }} />
      <ProfileStack.Screen name="VaultEntries" component={VaultEntriesScreen} options={{ title: 'Dokumente' }} />
      <ProfileStack.Screen name="VaultEntryForm" component={VaultEntryFormScreen} options={{ title: 'Dokument' }} />
      <ProfileStack.Screen name="Legacy" component={LegacyScreen} options={{ title: 'Was ich hinterlasse' }} />
      <ProfileStack.Screen name="LegacyForm" component={LegacyFormScreen} options={{ title: 'Vermächtnis' }} />
      <ProfileStack.Screen name="Farewell" component={FarewellScreen} options={{ title: 'Abschiedsnachrichten' }} />
      <ProfileStack.Screen name="FarewellForm" component={FarewellFormScreen} options={{ title: 'Abschiedsnachricht' }} />
      <ProfileStack.Screen name="Heirs" component={HeirsScreen} options={{ title: 'Erben-Übersicht' }} />
    </ProfileStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<
  keyof MainTabParamList,
  { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap; label: string }
> = {
  HomeTab: { focused: 'home', unfocused: 'home-outline', label: 'Start' },
  FamilyTab: { focused: 'people', unfocused: 'people-outline', label: 'Familie' },
  MemoriesTab: { focused: 'heart', unfocused: 'heart-outline', label: 'Erinnerungen' },
  CapsulesTab: { focused: 'time', unfocused: 'time-outline', label: 'Zeitkapseln' },
  ProfileTab: { focused: 'person', unfocused: 'person-outline', label: 'Profil' },
};

export function MainNavigator() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textMuted,
        // Label nur beim aktiven Tab -> keine überlappenden Texte auf Mobile
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 56 + bottomInset,
          paddingTop: 6,
          paddingBottom: bottomInset,
        },
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarIcon: ({ focused, color }) => {
          const cfg = TAB_ICONS[route.name as keyof MainTabParamList];
          return (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={focused ? cfg.focused : cfg.unfocused} size={24} color={color} />
            </View>
          );
        },
        tabBarLabel: ({ focused, color }) => {
          if (!focused) return null;
          const cfg = TAB_ICONS[route.name as keyof MainTabParamList];
          return (
            <Text
              numberOfLines={1}
              style={{
                fontSize: 11,
                fontWeight: '700',
                color,
                maxWidth: 84,
                textAlign: 'center',
              }}
            >
              {cfg.label}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} />
      <Tab.Screen name="FamilyTab" component={FamilyStackNavigator} />
      <Tab.Screen name="MemoriesTab" component={MemoriesStackNavigator} />
      <Tab.Screen name="CapsulesTab" component={CapsulesStackNavigator} />
      <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}
