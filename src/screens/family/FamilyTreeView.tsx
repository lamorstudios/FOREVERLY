import { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppText, Avatar } from '@/components';
import { SignedImage } from '@/components/SignedImage';
import { colors, spacing, radius, shadow } from '@/theme';
import { fullName } from '@/lib/format';
import type { Person, Relationship } from '@/types/models';
import {
  computeTreeLayout,
  NODE_W,
  NODE_H,
  type TreeEdge,
} from './treeLayout';

interface FamilyTreeViewProps {
  persons: Person[];
  relationships: Relationship[];
  anchorId: string | null;
  onSelectPerson: (personId: string) => void;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 1.5;
const STEP = 0.15;
const DEFAULT_SCALE = 0.8;

/** Geburtsjahr (knapp) für die kompakten Knoten. */
function birthYear(person: Person): string | null {
  if (!person.birth_date) return null;
  const year = person.birth_date.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : null;
}

/**
 * Visueller, frei verschieb- und zoombarer Familienstammbaum.
 *
 * 2D-Panning über verschachtelte ScrollViews (vertikal × horizontal),
 * Zoom über +/−/Zurücksetzen-Buttons. Alle Layout-Koordinaten werden zum
 * Render-Zeitpunkt mit dem Maßstab multipliziert (keine transform-origin-
 * Probleme im Web-Export). Farbige Linien zeigen die Beziehungsart.
 */
export function FamilyTreeView({
  persons,
  relationships,
  anchorId,
  onSelectPerson,
}: FamilyTreeViewProps) {
  const [scale, setScale] = useState(DEFAULT_SCALE);

  const layout = useMemo(
    () => computeTreeLayout(persons, relationships, anchorId),
    [persons, relationships, anchorId],
  );

  const canvasWidth = layout.width * scale;
  const canvasHeight = layout.height * scale;
  const avatarSize = Math.round(48 * scale);
  const nameSize = Math.max(10, Math.round(13 * scale));
  const yearSize = Math.max(8, Math.round(10 * scale));
  const dotSize = Math.max(6, Math.round(8 * scale));
  const strokeWidth = Math.max(2, 2.4 * scale);

  function zoom(delta: number) {
    setScale((s) =>
      Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round((s + delta) * 100) / 100)),
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.vContent}
        showsVerticalScrollIndicator={false}
        directionalLockEnabled={false}
      >
        <ScrollView
          horizontal
          contentContainerStyle={styles.hContent}
          showsHorizontalScrollIndicator={false}
        >
          <View style={{ width: canvasWidth, height: canvasHeight }}>
            <Svg
              width={canvasWidth}
              height={canvasHeight}
              style={StyleSheet.absoluteFill}
            >
              {layout.edges.map((edge) => (
                <Path
                  key={edge.id}
                  d={edgePath(edge, scale)}
                  stroke={edge.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity={0.85}
                />
              ))}
            </Svg>

            {layout.nodes.map((node) => {
              const person = node.person;
              return (
                <Pressable
                  key={person.id}
                  onPress={() => onSelectPerson(person.id)}
                  style={({ pressed }) => [
                    styles.node,
                    {
                      left: node.x * scale,
                      top: node.y * scale,
                      width: NODE_W * scale,
                      height: NODE_H * scale,
                    },
                    person.id === anchorId && styles.nodeAnchor,
                    pressed && styles.nodePressed,
                  ]}
                >
                  {person.avatar_url ? (
                    <SignedImage
                      bucket="photos"
                      path={person.avatar_url}
                      style={{
                        width: avatarSize,
                        height: avatarSize,
                        borderRadius: avatarSize / 2,
                      }}
                    />
                  ) : (
                    <Avatar
                      name={fullName(person.first_name, person.last_name)}
                      size={avatarSize}
                    />
                  )}
                  <AppText
                    variant="bodyStrong"
                    center
                    numberOfLines={1}
                    style={{ fontSize: nameSize, marginTop: 2 }}
                  >
                    {person.first_name}
                  </AppText>
                  {birthYear(person) ? (
                    <AppText
                      center
                      color={colors.textMuted}
                      numberOfLines={1}
                      style={{ fontSize: yearSize }}
                    >
                      {person.death_date
                        ? `${birthYear(person)} – †`
                        : `* ${birthYear(person)}`}
                    </AppText>
                  ) : null}
                  {node.categories.length > 0 ? (
                    <View style={styles.dots}>
                      {node.categories.map((cat) => (
                        <View
                          key={cat}
                          style={{
                            width: dotSize,
                            height: dotSize,
                            borderRadius: dotSize / 2,
                            backgroundColor: categoryColor(cat),
                          }}
                        />
                      ))}
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </ScrollView>

      <View style={styles.zoomBar}>
        <Pressable
          style={styles.zoomBtn}
          onPress={() => zoom(STEP)}
          hitSlop={6}
          accessibilityLabel="Vergrößern"
        >
          <AppText variant="heading" color={colors.primaryDark}>
            +
          </AppText>
        </Pressable>
        <Pressable
          style={styles.zoomBtn}
          onPress={() => zoom(-STEP)}
          hitSlop={6}
          accessibilityLabel="Verkleinern"
        >
          <AppText variant="heading" color={colors.primaryDark}>
            −
          </AppText>
        </Pressable>
        <Pressable
          style={styles.zoomBtn}
          onPress={() => setScale(DEFAULT_SCALE)}
          hitSlop={6}
          accessibilityLabel="Ansicht zurücksetzen"
        >
          <AppText variant="label" color={colors.primaryDark}>
            ⟳
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function edgePath(edge: TreeEdge, scale: number): string {
  const x1 = edge.x1 * scale;
  const y1 = edge.y1 * scale;
  const x2 = edge.x2 * scale;
  const y2 = edge.y2 * scale;
  if (edge.kind === 'partner') {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }
  // Orthogonaler Eltern→Kind-Verbinder (klassische Baumoptik).
  const midY = (y1 + y2) / 2;
  return `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
}

function categoryColor(category: string): string {
  switch (category) {
    case 'biological':
      return colors.relationBiological;
    case 'married':
      return colors.relationMarried;
    case 'patchwork':
      return colors.relationPatchwork;
    case 'adoption':
      return colors.relationAdoption;
    default:
      return colors.textMuted;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  flex: { flex: 1 },
  vContent: { flexGrow: 1 },
  hContent: { flexGrow: 1 },
  node: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft,
  },
  nodeAnchor: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primarySoft,
  },
  nodePressed: { opacity: 0.7 },
  dots: { flexDirection: 'row', gap: 3, marginTop: 2 },
  zoomBar: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    gap: spacing.sm,
  },
  zoomBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
});
