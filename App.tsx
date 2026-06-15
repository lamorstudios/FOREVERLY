import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthProvider } from '@/context/AuthContext';
import { FamilyProvider } from '@/context/FamilyContext';
import { RootNavigator } from '@/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <AuthProvider>
          <FamilyProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </FamilyProvider>
        </AuthProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
