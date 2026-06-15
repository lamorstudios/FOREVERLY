import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { stackScreenOptions } from './options';
import { colors, typography } from '@/theme';
import type {
  MainTabParamList,
  HomeStackParamList,
  FamilyStackParamList,
  MemoriesStackParamList,
  CapsulesStackParamList,
  ProfileStackParamList,
  HistorianStackParamList,
} from './types';

// Screens
import { HomeScreen } from '@/screens/home/HomeScreen';
import { NetworkScreen } from '@/screens/family/NetworkScreen';
import { PersonProfileScreen } from '@/screens/family/PersonProfileScreen';
import { PersonFormScreen } from '@/screens/family/PersonFormScreen';
import { AddRelationshipScreen } from '@/screens/family/AddRelationshipScreen';
import { MembersScreen } from '@/screens/family/MembersScreen';
import { InviteScreen } from '@/screens/family/InviteScreen';
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
    </ProfileStack.Navigator>
  );
}

const HistorianStack = createNativeStackNavigator<HistorianStackParamList>();
function HistorianStackNavigator() {
  return (
    <HistorianStack.Navigator screenOptions={stackScreenOptions}>
      <HistorianStack.Screen name="HistorianHome" component={HistorianHomeScreen} options={{ title: 'Familienhistoriker' }} />
      <HistorianStack.Screen name="HistorianAnswer" component={HistorianAnswerScreen} options={{ title: 'Antwort' }} />
      <HistorianStack.Screen name="HistorianSearch" component={HistorianSearchScreen} options={{ title: 'Suche' }} />
      <HistorianStack.Screen name="Wisdoms" component={WisdomsScreen} options={{ title: 'Lebensweisheiten' }} />
      <HistorianStack.Screen name="Timeline" component={TimelineScreen} options={{ title: 'Zeitleiste' }} />
      <HistorianStack.Screen name="ImportantPeople" component={ImportantPeopleScreen} options={{ title: 'Wichtige Personen' }} />
      <HistorianStack.Screen name="PersonInsight" component={PersonInsightScreen} options={{ title: 'Person' }} />
      <HistorianStack.Screen name="KnowledgeGaps" component={KnowledgeGapsScreen} options={{ title: 'Familienwissen retten' }} />
    </HistorianStack.Navigator>
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
  HistorianTab: { focused: 'sparkles', unfocused: 'sparkles-outline', label: 'Historiker' },
  ProfileTab: { focused: 'person', unfocused: 'person-outline', label: 'Profil' },
};

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 88,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarLabelStyle: {
          fontSize: typography.caption.fontSize,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          const cfg = TAB_ICONS[route.name as keyof MainTabParamList];
          return (
            <Ionicons
              name={focused ? cfg.focused : cfg.unfocused}
              size={size}
              color={color}
            />
          );
        },
        tabBarLabel: TAB_ICONS[route.name as keyof MainTabParamList].label,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} />
      <Tab.Screen name="FamilyTab" component={FamilyStackNavigator} />
      <Tab.Screen name="MemoriesTab" component={MemoriesStackNavigator} />
      <Tab.Screen name="CapsulesTab" component={CapsulesStackNavigator} />
      <Tab.Screen name="HistorianTab" component={HistorianStackNavigator} />
      <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}
