import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NoFamilyScreen } from '@/screens/onboarding/NoFamilyScreen';
import { CreateFamilyScreen } from '@/screens/onboarding/CreateFamilyScreen';
import { JoinFamilyScreen } from '@/screens/onboarding/JoinFamilyScreen';
import { stackScreenOptions } from './options';
import type { OnboardingStackParamList } from './types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="NoFamily"
        component={NoFamilyScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateFamily"
        component={CreateFamilyScreen}
        options={{ title: 'Familie erstellen' }}
      />
      <Stack.Screen
        name="JoinFamily"
        component={JoinFamilyScreen}
        options={{ title: 'Familie beitreten' }}
      />
    </Stack.Navigator>
  );
}
