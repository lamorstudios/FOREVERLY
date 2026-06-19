import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { Screen, AppText, Card, Button, EmptyState, Loading } from '@/components';
import { colors, spacing, radius } from '@/theme';
import { qk } from '@/api/queryKeys';
import { getKnowledgeGaps } from '@/api/historian';
import { useFamily } from '@/context/FamilyContext';
import type {
  HomeStackParamList,
  MainTabParamList,
} from '@/navigation/types';
import type { KnowledgeGap } from '@/historian/engine';

const ACTION_LABEL: Record<KnowledgeGap['suggestion'], string> = {
  audio: 'Jetzt Audio aufnehmen',
  photo: 'Jetzt Foto hinzufügen',
  memory: 'Jetzt Erinnerung hinzufügen',
};

const ACTION_ICON: Record<
  KnowledgeGap['suggestion'],
  keyof typeof Ionicons.glyphMap
> = {
  audio: 'mic-outline',
  photo: 'image-outline',
  memory: 'sparkles-outline',
};

export function KnowledgeGapsScreen({
  navigation,
}: NativeStackScreenProps<HomeStackParamList, 'KnowledgeGaps'>) {
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;

  const gapsQuery = useQuery({
    queryKey: qk.knowledgeGaps(familyId),
    queryFn: () => getKnowledgeGaps(familyId),
  });

  function handleSuggestion(suggestion: KnowledgeGap['suggestion']) {
    const tab = navigation.getParent<
      BottomTabNavigationProp<MainTabParamList>
    >();
    switch (suggestion) {
      case 'audio':
        tab?.navigate('MemoriesTab', { screen: 'AudioRecord' });
        break;
      case 'photo':
        tab?.navigate('MemoriesTab', { screen: 'PhotoGallery' });
        break;
      case 'memory':
        tab?.navigate('MemoriesTab', { screen: 'MemoryForm' });
        break;
    }
  }

  if (gapsQuery.isLoading) {
    return (
      <Screen>
        <Loading message="Familienwissen wird geprüft …" />
      </Screen>
    );
  }

  const gaps = gapsQuery.data ?? [];

  return (
    <Screen
      refreshing={gapsQuery.isFetching}
      onRefresh={() => gapsQuery.refetch()}
    >
      <AppText variant="display">Familienwissen retten</AppText>
      <AppText variant="body" color={colors.textSecondary}>
        Der Historiker erkennt fehlende Informationen – so geht kein wertvolles
        Wissen verloren.
      </AppText>

      {gaps.length === 0 ? (
        <EmptyState
          icon="checkmark-circle-outline"
          title="Euer Familienwissen ist gut dokumentiert!"
          message="Aktuell fehlen keine wichtigen Informationen. Macht weiter so!"
        />
      ) : (
        <View style={styles.list}>
          {gaps.map((gap, index) => (
            <Card key={`${gap.personId}-${gap.suggestion}-${index}`}>
              <View style={styles.headerRow}>
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={26}
                    color={colors.warning}
                  />
                </View>
                <AppText variant="bodyStrong" style={styles.message}>
                  {gap.message}
                </AppText>
              </View>
              <Button
                label={ACTION_LABEL[gap.suggestion]}
                icon={ACTION_ICON[gap.suggestion]}
                onPress={() => handleSuggestion(gap.suggestion)}
              />
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, marginTop: spacing.sm },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: `${colors.warning}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: { flex: 1 },
});
