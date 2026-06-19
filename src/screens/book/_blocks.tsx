import { View, StyleSheet, ImageStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText, SignedImage } from '@/components';
import { colors, radius, spacing } from '@/theme';
import type { BookBlock } from '@/book/types';

/**
 * Rendert die Inhaltsbausteine einer Buchseite – warm, editorial und
 * emotional: große Bilder, schöne Zitate, klare Kapitel.
 */
export function BookBlocks({ blocks }: { blocks: BookBlock[] }) {
  return (
    <View style={styles.container}>
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} />
      ))}
    </View>
  );
}

function BlockView({ block }: { block: BookBlock }) {
  switch (block.type) {
    case 'paragraph':
      return (
        <AppText variant="body" color={colors.textPrimary} style={styles.paragraph}>
          {block.text}
        </AppText>
      );

    case 'quote':
      return (
        <View style={styles.quote}>
          <AppText variant="heading" color={colors.textPrimary} style={styles.quoteText}>
            „{block.text}“
          </AppText>
          {block.attribution ? (
            <AppText variant="label" color={colors.textMuted} style={styles.quoteAttribution}>
              — {block.attribution}
            </AppText>
          ) : null}
        </View>
      );

    case 'photo':
      return (
        <View style={styles.photoWrap}>
          <SignedImage bucket="photos" path={block.path} style={styles.photo} />
          {block.caption ? (
            <AppText variant="caption" color={colors.textMuted} center style={styles.caption}>
              {block.caption}
            </AppText>
          ) : null}
        </View>
      );

    case 'photoGrid':
      return (
        <View style={styles.grid}>
          {block.photos.map((photo, i) => (
            <View key={i} style={styles.gridItem}>
              <SignedImage bucket="photos" path={photo.path} style={styles.gridImage} />
              {photo.caption ? (
                <AppText variant="caption" color={colors.textMuted} center style={styles.caption}>
                  {photo.caption}
                </AppText>
              ) : null}
            </View>
          ))}
        </View>
      );

    case 'person':
      return (
        <View style={styles.person}>
          <SignedImage bucket="photos" path={block.avatarPath ?? null} style={styles.personAvatar} />
          <View style={styles.personBody}>
            <AppText variant="subheading" color={colors.textPrimary}>
              {block.name}
            </AppText>
            {block.years ? (
              <AppText variant="caption" color={colors.textMuted}>
                {block.years}
              </AppText>
            ) : null}
            {block.bio ? (
              <AppText variant="body" color={colors.textSecondary} style={styles.personBio}>
                {block.bio}
              </AppText>
            ) : null}
          </View>
        </View>
      );

    case 'timeline':
      return (
        <View style={styles.timeline}>
          {block.entries.map((entry, i) => (
            <View key={i} style={styles.timelineRow}>
              <View style={styles.timelineYearBadge}>
                <AppText variant="label" color={colors.textOnAccent}>
                  {entry.year}
                </AppText>
              </View>
              <AppText variant="body" color={colors.textPrimary} style={styles.timelineLabel}>
                {entry.label}
              </AppText>
            </View>
          ))}
        </View>
      );

    case 'audio':
      return (
        <View style={styles.audio}>
          <View style={styles.audioIcon}>
            <Ionicons name="mic" size={24} color={colors.primary} />
          </View>
          <View style={styles.audioBody}>
            <AppText variant="bodyStrong" color={colors.textPrimary}>
              {block.title}
            </AppText>
            {block.personName ? (
              <AppText variant="caption" color={colors.textMuted}>
                {block.personName}
              </AppText>
            ) : null}
          </View>
        </View>
      );

    case 'note':
      return (
        <AppText variant="body" color={colors.textMuted} style={styles.note}>
          {block.text}
        </AppText>
      );

    default:
      return null;
  }
}

/** Wiederverwendbarer Stil für große Coverbilder. */
export const coverStyle: ImageStyle = {
  width: '100%',
  height: 240,
  borderRadius: radius.lg,
  backgroundColor: colors.surfaceAlt,
};

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  paragraph: { lineHeight: 28 },
  quote: {
    borderLeftWidth: 4,
    borderLeftColor: colors.gold,
    paddingLeft: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  quoteText: { fontStyle: 'italic' },
  quoteAttribution: { marginTop: spacing.xs },
  photoWrap: { gap: spacing.xs },
  photo: {
    width: '100%',
    height: 260,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
  },
  caption: { fontStyle: 'italic' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridItem: { width: '48%', gap: spacing.xs },
  gridImage: {
    width: '100%',
    height: 150,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  person: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  personAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceAlt,
  },
  personBody: { flex: 1, gap: spacing.xs },
  personBio: { marginTop: spacing.xs },
  timeline: { gap: spacing.sm },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  timelineYearBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minWidth: 72,
    alignItems: 'center',
  },
  timelineLabel: { flex: 1 },
  audio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  audioIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioBody: { flex: 1, gap: 2 },
  note: { fontStyle: 'italic' },
});
