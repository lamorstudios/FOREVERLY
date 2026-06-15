import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Animated,
  PanResponder,
  LayoutChangeEvent,
  Easing,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Avatar } from '@/components';
import { SignedImage } from '@/components/SignedImage';
import { colors, spacing, radius, shadow, withAlpha } from '@/theme';
import { fullName } from '@/lib/format';
import type {
  Person,
  Relationship,
  RelationshipType,
  FamilyBranch,
} from '@/types/models';
import {
  computeTreeLayout,
  NODE_W,
  NODE_H,
  type TreeEdge,
  type TreeNode,
} from './treeLayout';

interface FamilyTreeViewProps {
  persons: Person[];
  relationships: Relationship[];
  anchorId: string | null;
  branches: FamilyBranch[];
  relationshipLabelByPerson: Record<string, string>;
  onSelectPerson: (personId: string) => void;
}

const MIN_SCALE = 0.4;
const MAX_SCALE = 1.8;

// „Nahe" Beziehungen, die direkt am Knoten aufgeklappt werden.
// Entferntere (Oma/Opa, Tante, Cousin …) erscheinen transitiv beim Erkunden.
const CLOSE_TYPES = new Set<RelationshipType>([
  'vater',
  'mutter',
  'stiefvater',
  'stiefmutter',
  'sohn',
  'tochter',
  'stiefkind',
  'adoptivkind',
  'pflegekind',
  'bruder',
  'schwester',
  'ehepartner',
  'lebenspartner',
]);

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * Interaktives Familiennetzwerk – eher Google-Maps/Wissensgraph als Stammbaum.
 *
 * Beim Öffnen sind nur die nächsten Angehörigen sichtbar (Eltern, Geschwister,
 * Partner, Kinder). Tippt man auf eine Person, klappen ihre weiteren Zweige
 * animiert auf; erneutes Tippen klappt sie wieder ein. Es werden nur die
 * tatsächlich aufgeklappten Verbindungen gezeichnet – das hält die Ansicht
 * ruhig und lädt zum Entdecken ein.
 */
export function FamilyTreeView({
  persons,
  relationships,
  anchorId,
  branches,
  relationshipLabelByPerson,
  onSelectPerson,
}: FamilyTreeViewProps) {
  // Beziehungsgraph: Nachbarn + Typ je Personenpaar.
  const { neighborMap, pairTypeMap } = useMemo(() => {
    const neighborMap = new Map<string, string[]>();
    const pairTypeMap = new Map<string, RelationshipType>();
    const add = (a: string, b: string) => {
      if (!neighborMap.has(a)) neighborMap.set(a, []);
      const list = neighborMap.get(a)!;
      if (!list.includes(b)) list.push(b);
    };
    for (const rel of relationships) {
      add(rel.from_person_id, rel.to_person_id);
      add(rel.to_person_id, rel.from_person_id);
      const key = pairKey(rel.from_person_id, rel.to_person_id);
      if (!pairTypeMap.has(key)) pairTypeMap.set(key, rel.type);
    }
    return { neighborMap, pairTypeMap };
  }, [relationships]);

  const branchIndexById = useMemo(() => {
    const map = new Map<string, number>();
    branches.forEach((b, i) => {
      for (const id of b.member_ids ?? []) if (!map.has(id)) map.set(id, i);
    });
    return map;
  }, [branches]);

  // Aufgeklappte Personen (anker zeigt seine nahen Angehörigen immer).
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Sichtbarkeit per BFS: anker zeigt nahe Angehörige, aufgeklappte Knoten
  // zeigen alle ihre Nachbarn. revealedBy[id] = wer den Knoten sichtbar machte.
  const visible = useMemo(() => {
    const revealedBy = new Map<string, string | null>();
    if (!anchorId) return revealedBy;
    revealedBy.set(anchorId, null);
    const queue = [anchorId];
    while (queue.length) {
      const cur = queue.shift()!;
      const revealAll = expanded.has(cur);
      const revealClose = cur === anchorId;
      if (!revealAll && !revealClose) continue;
      for (const n of neighborMap.get(cur) ?? []) {
        const t = pairTypeMap.get(pairKey(cur, n));
        const isClose = t ? CLOSE_TYPES.has(t) : false;
        if (revealAll || (revealClose && isClose)) {
          if (!revealedBy.has(n)) {
            revealedBy.set(n, cur);
            queue.push(n);
          }
        }
      }
    }
    return revealedBy;
  }, [expanded, anchorId, neighborMap, pairTypeMap]);

  const hiddenCountOf = (id: string) =>
    (neighborMap.get(id) ?? []).filter((n) => !visible.has(n)).length;

  const layout = useMemo(() => {
    const vp = persons.filter((p) => visible.has(p.id));
    const vr = relationships.filter(
      (r) => visible.has(r.from_person_id) && visible.has(r.to_person_id),
    );
    const allowed = new Set<string>();
    for (const [id, by] of visible) if (by) allowed.add(pairKey(by, id));
    return computeTreeLayout(vp, vr, anchorId, branchIndexById, allowed);
  }, [persons, relationships, visible, anchorId, branchIndexById]);

  const zones = useMemo(() => buildZones(branches, layout), [branches, layout]);
  const anchorNode = useMemo(
    () => layout.nodes.find((n) => n.person.id === anchorId) ?? null,
    [layout, anchorId],
  );

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  function onNodePress(id: string) {
    if (hiddenCountOf(id) > 0 || expanded.has(id)) toggleExpand(id);
    else onSelectPerson(id);
  }

  // ---- Transform (Pan + Pinch + Fit) ----
  const translate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scale = useRef(new Animated.Value(1)).current;
  const tx = useRef(0);
  const ty = useRef(0);
  const sc = useRef(1);
  const viewport = useRef({ w: 0, h: 0 });
  const didInit = useRef(false);
  const lastTap = useRef(0);
  const pendingFocus = useRef<string[] | null>(null);

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

  function animateTo(s: number, x: number, y: number) {
    Animated.parallel([
      Animated.spring(scale, { toValue: s, useNativeDriver: false, friction: 8, tension: 55 }),
      Animated.spring(translate, { toValue: { x, y }, useNativeDriver: false, friction: 8, tension: 55 }),
    ]).start();
  }

  function fitToBox(x: number, y: number, w: number, h: number, cap = MAX_SCALE) {
    const { w: vw, h: vh } = viewport.current;
    if (!vw || !vh || w <= 0 || h <= 0) return;
    const pad = 56;
    const s = clamp(Math.min((vw - pad) / w, (vh - pad) / h, cap));
    animateTo(s, vw / 2 - (x + w / 2) * s, vh / 2 - (y + h / 2) * s);
  }

  function fitWorld() {
    fitToBox(0, 0, layout.width, layout.height, 1);
  }

  function fitToNodes(ns: TreeNode[], cap = 1.15) {
    if (!ns.length) return;
    const minX = Math.min(...ns.map((n) => n.x));
    const minY = Math.min(...ns.map((n) => n.y));
    const maxX = Math.max(...ns.map((n) => n.x + NODE_W));
    const maxY = Math.max(...ns.map((n) => n.y + NODE_H));
    fitToBox(minX - 40, minY - 40, maxX - minX + 80, maxY - minY + 80, cap);
  }

  function focusOnAnchor() {
    if (anchorNode) fitToNodes([anchorNode], 1.25);
  }

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    viewport.current = { w: width, h: height };
    if (!didInit.current && width && height) {
      didInit.current = true;
      requestAnimationFrame(fitWorld);
    }
  }

  // Bei Änderung der sichtbaren Menge: sanft neu einpassen (Übersicht halten).
  useEffect(() => {
    if (!didInit.current) return;
    const ids = pendingFocus.current;
    if (ids && ids.length) {
      pendingFocus.current = null;
      const ns = layout.nodes.filter((n) => ids.includes(n.person.id));
      if (ns.length) {
        fitToNodes(ns, 1);
        return;
      }
    }
    fitWorld();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  // Goldener Glow-Puls für die eingeloggte Person.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const panStart = useRef({ x: 0, y: 0 });
  const pinch = useRef<{ dist: number; scale: number; cx: number; cy: number } | null>(null);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (e, g) =>
        (e.nativeEvent.touches?.length ?? 0) === 2 || Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
      onMoveShouldSetPanResponderCapture: (e, g) =>
        (e.nativeEvent.touches?.length ?? 0) === 2 || Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
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
            translate.setValue({ x: w / 2 - pinch.current.cx * ns, y: h / 2 - pinch.current.cy * ns });
          }
        } else {
          pinch.current = null;
          translate.setValue({ x: panStart.current.x + g.dx, y: panStart.current.y + g.dy });
        }
      },
      onPanResponderRelease: () => (pinch.current = null),
      onPanResponderTerminate: () => (pinch.current = null),
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

  function revealBranch(branch: FamilyBranch) {
    pendingFocus.current = branch.member_ids ?? [];
    setExpanded(new Set(persons.map((p) => p.id)));
  }

  function resetView() {
    pendingFocus.current = null;
    setExpanded(new Set());
  }

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
          <Svg width={layout.width} height={layout.height} style={StyleSheet.absoluteFill} pointerEvents="none">
            {zones.map((z) => (
              <Rect
                key={z.id}
                x={z.x}
                y={z.y}
                width={z.w}
                height={z.h}
                rx={32}
                fill={z.color}
                fillOpacity={0.08}
                stroke={z.color}
                strokeOpacity={0.4}
                strokeWidth={2}
                strokeDasharray="2 10"
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
                opacity={0.65}
              />
            ))}
          </Svg>

          <Pressable style={StyleSheet.absoluteFill} onPress={handleBackgroundTap} />

          {zones.map((z) => (
            <View
              key={`label-${z.id}`}
              style={[styles.zoneLabel, { left: z.x + 18, top: z.y + 12, backgroundColor: z.color }]}
            >
              <AppText variant="caption" color={colors.textOnAccent} style={styles.zoneText}>
                {z.name}
              </AppText>
            </View>
          ))}

          {anchorNode ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.glow,
                {
                  left: anchorNode.x - 16,
                  top: anchorNode.y - 16,
                  width: NODE_W + 32,
                  height: NODE_H + 32,
                  opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.5] }),
                  transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }],
                },
              ]}
            />
          ) : null}

          {layout.nodes.map((node) => (
            <NodeCard
              key={node.person.id}
              node={node}
              isAnchor={node.person.id === anchorId}
              branchColor={zones.find((z) => z.memberIds.includes(node.person.id))?.color}
              relLabel={relationshipLabelByPerson[node.person.id]}
              hiddenCount={hiddenCountOf(node.person.id)}
              expanded={expanded.has(node.person.id)}
              onPress={() => onNodePress(node.person.id)}
              onOpenProfile={() => onSelectPerson(node.person.id)}
            />
          ))}
        </Animated.View>
      </View>

      {/* Familienbereiche – schnell einen Zweig erkunden */}
      <View style={styles.branchBar} pointerEvents="box-none">
        <Pressable style={[styles.branchChip, styles.resetChip]} onPress={resetView}>
          <Ionicons name="contract-outline" size={14} color={colors.primaryDark} />
          <AppText variant="caption" color={colors.primaryDark} style={styles.branchText}>
            Übersicht
          </AppText>
        </Pressable>
        {branches.map((b) => (
          <Pressable key={b.id} style={styles.branchChip} onPress={() => revealBranch(b)}>
            <View style={[styles.branchDot, { backgroundColor: b.color ?? colors.primary }]} />
            <AppText variant="caption" color={colors.textPrimary} style={styles.branchText} numberOfLines={1}>
              {b.name}
            </AppText>
          </Pressable>
        ))}
      </View>

      <View style={styles.controls}>
        <Pressable style={styles.ctrlBtn} onPress={() => zoomBy(1.25)} hitSlop={6}>
          <AppText variant="heading" color={colors.primaryDark}>+</AppText>
        </Pressable>
        <Pressable style={styles.ctrlBtn} onPress={() => zoomBy(0.8)} hitSlop={6}>
          <AppText variant="heading" color={colors.primaryDark}>−</AppText>
        </Pressable>
        <Pressable style={styles.ctrlBtn} onPress={fitWorld} hitSlop={6}>
          <Ionicons name="scan-outline" size={20} color={colors.primaryDark} />
        </Pressable>
      </View>
    </View>
  );
}

function NodeCard({
  node,
  isAnchor,
  branchColor,
  relLabel,
  hiddenCount,
  expanded,
  onPress,
  onOpenProfile,
}: {
  node: TreeNode;
  isAnchor: boolean;
  branchColor?: string;
  relLabel?: string;
  hiddenCount: number;
  expanded: boolean;
  onPress: () => void;
  onOpenProfile: () => void;
}) {
  const person = node.person;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale]);

  const ringColor = isAnchor ? colors.gold : branchColor ?? colors.border;
  const avatarSize = isAnchor ? 58 : 50;
  const canExpand = hiddenCount > 0 && !expanded;

  return (
    <Animated.View
      style={[
        styles.nodeWrap,
        { left: node.x, top: node.y, width: NODE_W, height: NODE_H, opacity, transform: [{ scale }] },
      ]}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.node, isAnchor && styles.nodeAnchor, pressed && styles.nodePressed]}
      >
        {isAnchor ? (
          <View style={styles.duBadge}>
            <AppText variant="caption" color={colors.textOnAccent} style={styles.duText}>Du</AppText>
          </View>
        ) : null}

        <Pressable onPress={onOpenProfile} hitSlop={6} style={styles.profileBtn}>
          <Ionicons name="ellipsis-horizontal" size={16} color={colors.textMuted} />
        </Pressable>

        <View
          style={[
            styles.avatarRing,
            { width: avatarSize + 7, height: avatarSize + 7, borderRadius: (avatarSize + 7) / 2, borderColor: ringColor },
          ]}
        >
          {person.avatar_url ? (
            <SignedImage
              bucket="photos"
              path={person.avatar_url}
              style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }}
            />
          ) : (
            <Avatar name={fullName(person.first_name, person.last_name)} size={avatarSize} />
          )}
        </View>

        <AppText variant="bodyStrong" center numberOfLines={1} style={styles.name}>
          {person.first_name}
        </AppText>
        {relLabel ? (
          <AppText variant="caption" center numberOfLines={1} color={branchColor ?? colors.primary} style={styles.relLabel}>
            {relLabel}
          </AppText>
        ) : null}
      </Pressable>

      {canExpand ? (
        <Pressable style={styles.expandChip} onPress={onPress}>
          <Ionicons name="add" size={14} color={colors.textOnAccent} />
          <AppText variant="caption" color={colors.textOnAccent} style={styles.expandText}>
            {hiddenCount}
          </AppText>
        </Pressable>
      ) : expanded ? (
        <Pressable style={[styles.expandChip, styles.collapseChip]} onPress={onPress}>
          <Ionicons name="remove" size={14} color={colors.primaryDark} />
        </Pressable>
      ) : null}
    </Animated.View>
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

function buildZones(branches: FamilyBranch[], layout: ReturnType<typeof computeTreeLayout>): Zone[] {
  const posById = new Map(layout.nodes.map((n) => [n.person.id, n]));
  const out: Zone[] = [];
  const pad = 20;
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
    const midX = (x1 + x2) / 2;
    return `M ${x1} ${y1} Q ${midX} ${y1 + 18} ${x2} ${y2}`;
  }
  const dy = y2 - y1;
  return `M ${x1} ${y1} C ${x1} ${y1 + dy * 0.5}, ${x2} ${y2 - dy * 0.5}, ${x2} ${y2}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative', overflow: 'hidden' },
  world: { position: 'absolute', left: 0, top: 0, transformOrigin: 'left top' },
  nodeWrap: { position: 'absolute' },
  node: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  nodeAnchor: { borderColor: colors.gold, borderWidth: 2.5, backgroundColor: colors.warmWhite },
  nodePressed: { opacity: 0.75 },
  glow: {
    position: 'absolute',
    borderRadius: radius.xl + 12,
    backgroundColor: withAlpha(colors.gold, 0.55),
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 22,
  },
  duBadge: {
    position: 'absolute',
    top: -11,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    borderRadius: radius.pill,
    zIndex: 2,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  duText: { fontSize: 11, fontWeight: '800' },
  profileBtn: {
    position: 'absolute',
    top: 4,
    right: 6,
    zIndex: 3,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginTop: 2,
  },
  name: { marginTop: 5 },
  relLabel: { fontWeight: '600' },
  expandChip: {
    position: 'absolute',
    bottom: -12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    ...shadow.soft,
  },
  collapseChip: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong, paddingHorizontal: 6 },
  expandText: { fontWeight: '800', fontSize: 11 },
  zoneLabel: {
    position: 'absolute',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    ...shadow.soft,
  },
  zoneText: { fontWeight: '800', letterSpacing: 0.3 },
  branchBar: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  branchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: withAlpha(colors.surface, 0.92),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    ...shadow.soft,
  },
  resetChip: { backgroundColor: colors.surfaceAlt },
  branchDot: { width: 9, height: 9, borderRadius: 5 },
  branchText: { fontWeight: '700', maxWidth: 110 },
  controls: { position: 'absolute', right: spacing.md, bottom: spacing.md, gap: spacing.sm },
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
});
