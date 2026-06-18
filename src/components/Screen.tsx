import { ReactNode, Ref } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, gradients, useResponsive } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: ViewStyle;
  /** Welche Kanten die Safe Area berücksichtigen sollen. */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  /** Dezente Bereichs-Tönung des Hintergrunds (Orientierung je App-Bereich). */
  tint?: string;
  /** Optionale Ref auf die interne ScrollView (z. B. für die geführte Tour). */
  scrollRef?: Ref<ScrollView>;
  /** Scroll-Position beobachten (z. B. für die geführte Tour). */
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

/**
 * Bildschirm-Grundgerüst mit Safe Area, warmem Hintergrund und Scroll-Option.
 * Padding & maximale Inhaltsbreite sind responsiv (Mobile First, Tablet-tauglich).
 */
export function Screen({
  children,
  scroll = true,
  padded = true,
  refreshing,
  onRefresh,
  contentStyle,
  edges = ['top'],
  tint,
  scrollRef,
  onScroll,
}: ScreenProps) {
  const { mobilePadding, responsiveSpacing, contentMaxWidth } = useResponsive();

  const paddedStyle: ViewStyle = padded
    ? {
        paddingHorizontal: mobilePadding,
        paddingVertical: responsiveSpacing,
        gap: responsiveSpacing,
        width: '100%',
        maxWidth: contentMaxWidth,
        alignSelf: 'center',
      }
    : { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' };

  const inner = <View style={[paddedStyle, contentStyle]}>{children}</View>;

  // Ambient-Hintergrund (Rosa→Lavendel→Blau). Eine Bereichs-Tönung (tint)
  // ersetzt weich den ersten Stop, der ruhige Verlauf darunter bleibt erhalten.
  const bgColors = (
    tint ? [tint, gradients.page[1], gradients.page[2]] : gradients.page
  ) as readonly [string, string, ...string[]];

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <LinearGradient
        colors={bgColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            ref={scrollRef}
            onScroll={onScroll}
            scrollEventThrottle={16}
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
});
