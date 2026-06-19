import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthProvider } from '@/context/AuthContext';
import { FamilyProvider } from '@/context/FamilyContext';
import { PremiumProvider } from '@/context/PremiumContext';
import { OnboardingProvider } from '@/context/OnboardingContext';
import { TourProvider } from '@/context/TourContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SuccessProvider } from '@/components';

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryProvider>
          <AuthProvider>
            <FamilyProvider>
              <PremiumProvider>
                <OnboardingProvider>
                  <TourProvider>
                    <SuccessProvider>
                      <StatusBar style="dark" />
                      <RootNavigator />
                    </SuccessProvider>
                  </TourProvider>
                </OnboardingProvider>
              </PremiumProvider>
            </FamilyProvider>
          </AuthProvider>
        </QueryProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
