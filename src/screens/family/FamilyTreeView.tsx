import { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Animated,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { AppText, Avatar } from '@/components';
import { SignedImage } from '@/components/SignedImage';
import { colors, spacing, radius, shadow } from '@/theme';
import { fullName } from '@/lib/format';
import type {
  Person,
  Relationship,
  ClosenessLevel,
  FamilyBranch,
} from '@/types/models';
import { computeTreeLayout, NODE_W, NODE_H, type TreeEdge } from './treeLayout';

interface FamilyTreeViewProps {
  persons: Person[];
  relationships: Relationship[];
  anchorId: string | null;
  branches: FamilyBranch[];
  closenessByPerson: Record<string, ClosenessLevel>;
  relationshipLabelByPerson: Record<string, string>;
  onSelectPerson: (personId: string) => void;
  /** „Familienwelt": ganze Familie einpassen statt auf mich fokussieren. */
  worldMode: boolean;
}

const MIN_SCALE = 0.35;
const MAX_SCALE = 1.6;
const FOCUS_SCALE = 0.92;

const CLOSENESS_EMOJI: Record<ClosenessLevel, string> = {
  inner: '❤️',
  sehr_nah: '💛',
  familie: '💙',
  erweitert: '🤍',
};

function birthYear(person: Person): string | null {
  if (!person.birth_date) return null;
  const y = person.birth_date.slice(0, 4);
  return /^\d{4}$/.test(y) ? y : null;
}

/**
 * Visuelle „Familienwelt" – ein verschieb-, zoom- und antippbarer
 * Familienstammbaum mit der eingeloggten Person im Zentrum.
 *
 * Bedienung (plattformübergreifend, ohne zusätzliche Gesten-Bibliotheken):
 * Ziehen = verschieben · zwei Finger = Pinch-Zoom · Doppeltipp = auf mich
 * zentrieren · Buttons für Zoom/Fokus/Familienwelt. Die gesamte Welt wird
 * über eine einzige Transform (Translate + Scale, Ursprung oben-links)
 * bewegt – das hält die Koordinatenmathematik einfach und exakt.
 */
export function FamilyTreeView({
  persons,
  relationships,
  anchorId,
  branches,
  closenessByPerson,
  relationshipLabelByPerson,
  onSelectPerson,
  worldMode,
}: FamilyTreeViewProps) {
  const layout = useMemo(
    () => computeTreeLayout(persons, relationships, anchorId),
    [persons, relationships, anchorId],
  );

  const translate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scale = useRef(new Animated.Value(FOCUS_SCALE)).current;
  const tx = useRef(0);
  const ty = useRef(0);
  const sc = useRef(FOCUS_SCALE);
  const viewport = useRef({ w: 0, h: 0 });
  const didInit = useRef(false);
  const lastTap = useRef(0);

  // Aktuelle Werte mitschreiben (für Gesten-/Fokus-Mathematik).
  useEffect(() => {
    const a = translate.x.addListener(({ value }) => (tx.current = value));
    const b = translate.y.addListener(({ value }) => (ty.current = value));
    const c = scale.addListener(({ value }) => (sc.current = value));
    return () => {
      translate.x.removeListener(a);
      translate.y.removeListener(b);
      scale.removeListener(c);
    };
  }, [translate, scale]);

  const clamp = (v: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, v));

  function animateTo(targetScale: number, x: number, y: number) {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: targetScale,
        useNativeDriver: false,
        friction: 8,
        tension: 60,
      }),
      Animated.spring(translate, {
        toValue: { x, y },
        useNativeDriver: false,
        friction: 8,
        tension: 60,
      }),
    ]).start();
  }

  function focusOnAnchor(target = FOCUS_SCALE) {
    const { w, h } = viewport.current;
    if (!w || !h) return;
    const node =
      layout.nodes.find((n) => n.person.id === anchorId) ?? layout.nodes[0];
    if (!node) return;
    const ax = node.x + NODE_W / 2;
    const ay = node.y + NODE_H / 2;
    const s = clamp(target);
    animateTo(s, w / 2 - ax * s, h / 2 - ay * s);
  }

  function fitWorld() {
    const { w, h } = viewport.current;
    if (!w || !h || !layout.width || !layout.height) return;
    const s = clamp(
      Math.min((w - 32) / layout.width, (h - 32) / layout.height),
    );
    animateTo(s, (w - layout.width * s) / 2, (h - layout.height * s) / 2);
  }

  // Erstausrichtung sobald Viewport bekannt ist.
  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    viewport.current = { w: width, h: height };
    if (!didInit.current && width && height) {
      didInit.current = true;
      requestAnimationFrame(() => (worldMode ? fitWorld() : focusOnAnchor()));
    }
  }

  // Auf Moduswechsel reagieren (Fokus ↔ Familienwelt).
  useEffect(() => {
    if (!didInit.current) return;
    worldMode ? fitWorld() : focusOnAnchor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldMode]);

  // ---- Gesten: Pan + Pinch ----
  const panStart = useRef({ x: 0, y: 0 });
  const pinch = useRef<{ dist: number; scale: number; cx: number; cy: number } | null>(
    null,
  );

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (e, g) =>
        (e.nativeEvent.touches?.length ?? 0) === 2 ||
        Math.abs(g.dx) > 4 ||
        Math.abs(g.dy) > 4,
      onMoveShouldSetPanResponderCapture: (e, g) =>
        (e.nativeEvent.touches?.length ?? 0) === 2 ||
        Math.abs(g.dx) > 4 ||
        Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        panStart.current = { x: tx.current, y: ty.current };
        pinch.current = null;
        scale.stopAnimation();
        translate.stopAnimation();
      },
      onPanResponderMove: (e, g) => {
        const touches = e.nativeEvent.touches;
        if (touches && touches.length === 2) {
          const t1 = touches[0]!;
          const t2 = touches[1]!;
          const dist = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
          const { w, h } = viewport.current;
          if (!pinch.current) {
            pinch.current = {
              dist,
              scale: sc.current,
              cx: (w / 2 - tx.current) / sc.current,
              cy: (h / 2 - ty.current) / sc.current,
            };
          } else {
            const ns = clamp((pinch.current.scale * dist) / pinch.current.dist);
            scale.setValue(ns);
            translate.setValue({
              x: w / 2 - pinch.current.cx * ns,
              y: h / 2 - pinch.current.cy * ns,
            });
          }
        } else {
          pinch.current = null;
          translate.setValue({
            x: panStart.current.x + g.dx,
            y: panStart.current.y + g.dy,
          });
        }
      },
      onPanResponderRelease: () => {
        pinch.current = null;
      },
      onPanResponderTerminate: () => {
        pinch.current = null;
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  function handleBackgroundTap() {
    const now = Date.now();
    if (now - lastTap.current < 300) focusOnAnchor();
    lastTap.current = now;
  }

  function zoomBy(factor: number) {
    const { w, h } = viewport.current;
    const ns = clamp(sc.current * factor);
    const cx = (w / 2 - tx.current) / sc.current;
    const cy = (h / 2 - ty.current) / sc.current;
    animateTo(ns, w / 2 - cx * ns, h / 2 - cy * ns);
  }

  // Branch-Zonen (dezente farbige Bereiche je Familienzweig).
  const zones = useMemo(() => buildZones(branches, layout), [branches, layout]);

  return (
    <View style={styles.container} onLayout={onLayout}>
      <View style={StyleSheet.absoluteFill} {...responder.panHandlers}>
        <Animated.View
          style={[
            styles.world,
            {
              width: layout.width,
              height: layout.height,
              transform: [
                { translateX: translate.x },
                { translateY: translate.y },
                { scale },
              ],
            },
          ]}
        >
          <Svg
            width={layout.width}
            height={layout.height}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            {zones.map((z) => (
              <Rect
                key={z.id}
                x={z.x}
                y={z.y}
                width={z.w}
                height={z.h}
                rx={28}
                fill={z.color}
                fillOpacity={0.07}
                stroke={z.color}
                strokeOpacity={0.25}
                strokeWidth={1.5}
                strokeDasharray="6 8"
              />
            ))}
            {layout.edges.map((edge) => (
              <Path
                key={edge.id}
                d={edgePath(edge)}
                stroke={edge.color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity={0.7}
              />
            ))}
          </Svg>

          {/* Hintergrund-Pressable für Doppeltipp auf leere Fläche. */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleBackgroundTap}
          />

          {zones.map((z) => (
            <View
              key={`label-${z.id}`}
              style={[styles.zoneLabel, { left: z.x + 16, top: z.y + 10 }]}
            >
              <AppText variant="caption" color={z.color} style={styles.zoneText}>
                {z.name}
              </AppText>
            </View>
          ))}

          {layout.nodes.map((node) => {
            const person = node.person;
            const isAnchor = person.id === anchorId;
            const branchColor = zones.find((z) =>
              z.memberIds.includes(person.id),
            )?.color;
            const ringColor = isAnchor
              ? colors.gold
              : branchColor ?? colors.border;
            const closeness = closenessByPerson[person.id];
            const relLabel = relationshipLabelByPerson[person.id];
            const avatarSize = isAnchor ? 80 : 66;

            return (
              <Pressable
                key={person.id}
                onPress={() => onSelectPerson(person.id)}
                style={({ pressed }) => [
                  styles.node,
                  { left: node.x, top: node.y, width: NODE_W, height: NODE_H },
                  isAnchor && styles.nodeAnchor,
                  pressed && styles.nodePressed,
                ]}
              >
                {isAnchor ? (
                  <View style={styles.duBadge}>
                    <AppText variant="caption" color={colors.textOnAccent} style={styles.duText}>
                      Das bist du
                    </AppText>
                  </View>
                ) : null}

                <View
                  style={[
                    styles.avatarRing,
                    {
                      width: avatarSize + 8,
                      height: avatarSize + 8,
                      borderRadius: (avatarSize + 8) / 2,
                      borderColor: ringColor,
                    },
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
                  {closeness ? (
                    <View style={styles.closenessBadge}>
                      <AppText style={styles.closenessEmoji}>
                        {CLOSENESS_EMOJI[closeness]}
                      </AppText>
                    </View>
                  ) : null}
                </View>

                <AppText variant="bodyStrong" center numberOfLines={1} style={styles.name}>
                  {person.first_name}
                </AppText>
                {birthYear(person) ? (
                  <AppText variant="caption" center color={colors.textMuted} numberOfLines={1}>
                    {person.death_date ? `${birthYear(person)} ✝` : `* ${birthYear(person)}`}
                  </AppText>
                ) : null}
                {relLabel ? (
                  <AppText
                    variant="caption"
                    center
                    numberOfLines={1}
                    color={branchColor ?? colors.primary}
                    style={styles.relLabel}
                  >
                    {relLabel}
                  </AppText>
                ) : null}
              </Pressable>
            );
          })}
        </Animated.View>
      </View>

      <View style={styles.controls}>
        <Pressable style={styles.ctrlBtn} onPress={() => zoomBy(1.25)} hitSlop={6}>
          <AppText variant="heading" color={colors.primaryDark}>+</AppText>
        </Pressable>
        <Pressable style={styles.ctrlBtn} onPress={() => zoomBy(0.8)} hitSlop={6}>
          <AppText variant="heading" color={colors.primaryDark}>−</AppText>
        </Pressable>
        <Pressable style={styles.ctrlBtn} onPress={() => focusOnAnchor()} hitSlop={6}>
          <AppText variant="caption" color={colors.primaryDark} style={styles.ctrlIcon}>◎</AppText>
        </Pressable>
      </View>
    </View>
  );
}

interface Zone {
  id: string;
  name: string;
  color: string;
  memberIds: string[];
  x: number;
  y: number;
  w: number;
  h: number;
}

function buildZones(
  branches: FamilyBranch[],
  layout: ReturnType<typeof computeTreeLayout>,
): Zone[] {
  const posById = new Map(layout.nodes.map((n) => [n.person.id, n]));
  const out: Zone[] = [];
  const pad = 22;
  for (const branch of branches) {
    const members = (branch.member_ids ?? [])
      .map((id) => posById.get(id))
      .filter(Boolean) as { x: number; y: number }[];
    if (members.length < 2) continue;
    const minX = Math.min(...members.map((m) => m.x)) - pad;
    const minY = Math.min(...members.map((m) => m.y)) - pad;
    const maxX = Math.max(...members.map((m) => m.x)) + NODE_W + pad;
    const maxY = Math.max(...members.map((m) => m.y)) + NODE_H + pad;
    out.push({
      id: branch.id,
      name: branch.name,
      color: branch.color ?? colors.primary,
      memberIds: branch.member_ids ?? [],
      x: minX,
      y: minY,
      w: maxX - minX,
      h: maxY - minY,
    });
  }
  return out;
}

function edgePath(edge: TreeEdge): string {
  const { x1, y1, x2, y2 } = edge;
  if (edge.kind === 'partner') {
    // Sanfte „Girlande" zwischen Partnern.
    const midX = (x1 + x2) / 2;
    return `M ${x1} ${y1} Q ${midX} ${y1 + 20} ${x2} ${y2}`;
  }
  // Weiche S-Kurve von Eltern zu Kind.
  const dy = y2 - y1;
  return `M ${x1} ${y1} C ${x1} ${y1 + dy * 0.5}, ${x2} ${y2 - dy * 0.5}, ${x2} ${y2}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative', overflow: 'hidden' },
  world: {
    position: 'absolute',
    left: 0,
    top: 0,
    transformOrigin: 'left top',
  },
  node: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  nodeAnchor: {
    borderColor: colors.gold,
    borderWidth: 2.5,
    backgroundColor: '#FFFDF6',
  },
  nodePressed: { opacity: 0.7 },
  duBadge: {
    position: 'absolute',
    top: -11,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    zIndex: 2,
  },
  duText: { fontSize: 10, fontWeight: '700' },
  avatarRing: {
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginTop: 4,
  },
  closenessBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 1,
    ...shadow.soft,
  },
  closenessEmoji: { fontSize: 16 },
  name: { marginTop: 6 },
  relLabel: { fontWeight: '600' },
  zoneLabel: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  zoneText: { fontWeight: '700' },
  controls: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    gap: spacing.sm,
  },
  ctrlBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  ctrlIcon: { fontSize: 22, lineHeight: 26 },
});
