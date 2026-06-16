import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Screen, AppText, Button, TextField } from '@/components';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { acceptInvitation } from '@/api/invitations';
import { generateSuggestions } from '@/api/suggestions';
import { clearPendingInvite } from '@/lib/pendingInvite';
import { qk } from '@/api/queryKeys';
import { friendlyError } from '@/lib/errors';
import { colors, spacing } from '@/theme';
import type { OnboardingStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'JoinFamily'>;

export function JoinFamilyScreen({ navigation, route }: Props) {
  const { setActiveFamily, refetch } = useFamily();
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [code, setCode] = useState(route.params?.code ?? '');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => acceptInvitation(code),
    onSuccess: async (familyId) => {
      await clearPendingInvite();
      // Kettenreaktion: abgeleitete Beziehungen (z. B. Nichte/Neffe) vorschlagen.
      try {
        if (userId) await generateSuggestions(familyId, userId);
      } catch {
        /* nicht kritisch für den Beitritt */
      }
      await queryClient.invalidateQueries({ queryKey: qk.families() });
      refetch();
      setActiveFamily(familyId);
      // RootNavigator wechselt automatisch in die Haupt-App.
    },
    onError: (e) => setError(friendlyError(e)),
  });

  function handleJoin() {
    setError(null);
    if (!code.trim()) return setError('Bitte gib deinen Einladungscode ein.');
    mutation.mutate();
  }

  return (
    <Screen contentStyle={styles.content}>
      <AppText variant="title">Familie beitreten</AppText>
      <AppText variant="body" color={colors.textSecondary}>
        Gib den Einladungscode ein, den du von einem Familienmitglied
        erhalten hast.
      </AppText>

      <TextField
        label="Einladungscode"
        value={code}
        onChangeText={(t) => setCode(t.toUpperCase())}
        placeholder="z.B. ABCD2345"
        autoCapitalize="characters"
        autoCorrect={false}
      />
      {error ? (
        <AppText variant="caption" color={colors.error}>
          {error}
        </AppText>
      ) : null}

      <Button label="Beitreten" onPress={handleJoin} loading={mutation.isPending} />
      <Button label="Zurück" variant="ghost" onPress={() => navigation.goBack()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingTop: spacing.lg },
});
