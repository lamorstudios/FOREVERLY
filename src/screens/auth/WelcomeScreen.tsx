import { View, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Button } from '@/components';
import { BrandHeader } from './BrandHeader';
import { spacing } from '@/theme';
import type { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.top}>
        <BrandHeader subtitle="Bewahrt eure Familiengeschichte – für kommende Generationen." />
        <AppText variant="body" center color="#6F6253">
          Erinnerungen, Fotos, Audios und Zeitkapseln an einem warmen,
          sicheren Ort für die ganze Familie.
        </AppText>
      </View>
      <View style={styles.actions}>
        <Button label="Anmelden" onPress={() => navigation.navigate('Login')} />
        <Button
          label="Neues Konto erstellen"
          variant="secondary"
          onPress={() => navigation.navigate('Register')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'space-between', paddingVertical: spacing.xl },
  top: { gap: spacing.md, marginTop: spacing.xl },
  actions: { gap: spacing.md },
});
