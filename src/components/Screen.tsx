import { ReactNode } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: ViewStyle;
  /** Welche Kanten die Safe Area berücksichtigen sollen. */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

/** Bildschirm-Grundgerüst mit Safe Area, warmem Hintergrund und Scroll-Option. */
export function Screen({
  children,
  scroll = true,
  padded = true,
  refreshing,
  onRefresh,
  contentStyle,
  edges = ['top'],
}: ScreenProps) {
  const inner = (
    <View style={[padded && styles.padded, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={!!refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.primary}
                />
              ) : undefined
            }
          >
            {inner}
          </ScrollView>
        ) : (
          <View style={styles.flex}>{inner}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.xxl },
  padded: { padding: spacing.lg, gap: spacing.md },
});
