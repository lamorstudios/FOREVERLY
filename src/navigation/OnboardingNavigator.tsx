import { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NoFamilyScreen } from '@/screens/onboarding/NoFamilyScreen';
import { CreateFamilyScreen } from '@/screens/onboarding/CreateFamilyScreen';
import { JoinFamilyScreen } from '@/screens/onboarding/JoinFamilyScreen';
import { getPendingInvite } from '@/lib/pendingInvite';
import { stackScreenOptions } from './options';
import type { OnboardingStackParamList } from './types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  // Wartet eine eingeladene Person? Dann direkt zum Beitritt mit Code.
  const [pending, setPending] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    getPendingInvite().then(setPending);
  }, []);

  if (pending === undefined) return null; // kurz, bis der Code geladen ist

  return (
    <Stack.Navigator
      screenOptions={stackScreenOptions}
      initialRouteName={pending ? 'JoinFamily' : 'NoFamily'}
    >
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
        initialParams={pending ? { code: pending } : undefined}
      />
    </Stack.Navigator>
  );
}
