import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, AppText, Card, IconChip } from '@/components';
import { useFamily } from '@/context/FamilyContext';
import { colors, spacing, radius } from '@/theme';
import type { MemoriesStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<MemoriesStackParamList, 'MemoriesHub'>;

interface HubItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}

export function MemoriesHubScreen({ navigation }: Props) {
  const { activeFamily } = useFamily();

  const items: HubItem[] = [
    {
      icon: 'sparkles-outline',
      title: 'Erinnerungen',
      subtitle: 'Geschichten und Momente festhalten',
      onPress: () => navigation.navigate('MemoryList'),
    },
    {
      icon: 'images-outline',
      title: 'Fotos',
      subtitle: 'Bilder ansehen und hochladen',
      onPress: () => navigation.navigate('PhotoGallery'),
    },
    {
      icon: 'mic-outline',
      title: 'Audios',
      subtitle: 'Stimmen und Aufnahmen bewahren',
      onPress: () => navigation.navigate('AudioList'),
    },
  ];

  return (
    <Screen contentStyle={styles.content} tint={colors.tintMemories}>
      <AppText variant="display">{activeFamily?.name ?? 'Familie'}</AppText>
      <AppText variant="body" color={colors.textSecondary}>
        Was möchtest du festhalten?
      </AppText>

      <View style={styles.list}>
        {items.map((item) => (
          <Card key={item.title} onPress={item.onPress} style={styles.card}>
            <View style={styles.row}>
              <IconChip name={item.icon} />
              <View style={styles.texts}>
                <AppText variant="heading">{item.title}</AppText>
                <AppText variant="body" color={colors.textSecondary}>
                  {item.subtitle}
                </AppText>
              </View>
              <Ionicons
                name="chevron-forward"
                size={28}
                color={colors.textMuted}
              />
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.sm, paddingTop: spacing.lg },
  list: { gap: spacing.lg, marginTop: spacing.lg },
  card: { paddingVertical: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: spacing.xs },
});
