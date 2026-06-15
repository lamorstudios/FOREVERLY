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
import Svg, { Line } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Avatar } from '@/components';
import { SignedImage } from '@/components/SignedImage';
import { colors, spacing, radius, shadow, withAlpha, relationshipColor } from '@/theme';
import { RELATIONSHIP_LABELS } from '@/constants/relationships';
import { fullName } from '@/lib/format';
import type {
  Person,
  Relationship,
  RelationshipType,
  RelationshipCategory,
} from '@/types/models';

interface FamilyTreeViewProps {
  persons: Person[];
  relationships: Relationship[];
  anchorId: string | null;
  onSelectPerson: (personId: string) => void;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 2;
const HUB_D = 118; // Durchmesser des zentralen Hubs
const NODE_D = 88; // Durchmesser der umliegenden Kreise

const AnimatedLine = Animated.createAnimatedComponent(Line);

// „Nahe" Beziehungen, die im Ring um den aktiven Hub erscheinen.
const CLOSE_TYPES = new Set<RelationshipType>([
  'vater', 'mutter', 'stiefvater', 'stiefmutter',
  'sohn', 'tochter', 'stiefkind', 'adoptivkind', 'pflegekind',
  'bruder', 'schwester', 'ehepartner', 'lebenspartner',
]);

// Generische „Gegen-Beziehung" (für Personen relativ zum Hub).
const INVERSE_LABEL: Record<RelationshipType, string> = {
  vater: 'Kind', mutter: 'Kind',
  sohn: 'Elternteil', tochter: 'Elternteil',
  bruder: 'Geschwister', schwester: 'Geschwister',
  oma: 'Enkelkind', opa: 'Enkelkind',
  tante: 'Nichte/Neffe', onkel: 'Nichte/Neffe',
  cousin: 'Cousin/Cousine', cousine: 'Cousin/Cousine',
  nichte: 'Tante/Onkel', neffe: 'Tante/Onkel',
  ehepartner: 'Ehepartner', lebenspartner: 'Lebenspartner',
  stiefvater: 'Stiefkind', stiefmutter: 'Stiefkind',
  stiefkind: 'Stiefelternteil',
  adoptivkind: 'Adoptiv-Elternteil', pflegekind: 'Pflege-Elternteil',
  sonstige: 'Familie',
};

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

const PARENT_TYPES = new Set<RelationshipType>(['vater', 'mutter', 'stiefvater', 'stiefmutter']);
const CHILD_TYPES = new Set<RelationshipType>(['sohn', 'tochter', 'stiefkind', 'adoptivkind', 'pflegekind']);
const SIBLING_TYPES = new Set<RelationshipType>(['bruder', 'schwester']);
const PARTNER_TYPES = new Set<RelationshipType>(['ehepartner', 'lebenspartner']);

type Role = 'parent' | 'child' | 'sibling' | 'partner' | 'other';

/** Rolle des Knotens relativ zum Hub (für die Himmelsrichtung im Layout). */
function roleOf(
  hub: string,
  node: string,
  dirType: Map<string, RelationshipType>,
): Role {
  const fwd = dirType.get(`${hub}->${node}`); // node ist <fwd> von hub
  if (fwd) {
    if (PARENT_TYPES.has(fwd)) return 'parent';
    if (CHILD_TYPES.has(fwd)) return 'child';
    if (SIBLING_TYPES.has(fwd)) return 'sibling';
    if (PARTNER_TYPES.has(fwd)) return 'partner';
    return 'other';
  }
  const bwd = dirType.get(`${node}->${hub}`); // hub ist <bwd> von node → node invers
  if (bwd) {
    if (PARENT_TYPES.has(bwd)) return 'child';
    if (CHILD_TYPES.has(bwd)) return 'parent';
    if (SIBLING_TYPES.has(bwd)) return 'sibling';
    if (PARTNER_TYPES.has(bwd)) return 'partner';
  }
  return 'other';
}

/**
 * Interaktive Familienwelt als radialer Ego-Graph (im Geist von Obsidian
 * Graph / Miro / Apple Maps) – ausdrücklich kein Stammbaum.
 *
 * Die aktive Person steht immer exakt im Zentrum; ihre nächsten Angehörigen
 * liegen als Kreise rundherum. Erster Tipp auf einen Kreis macht ihn zum
 * neuen Zentrum (die Kamera zentriert, neue Kreise wachsen heraus, Linien
 * wachsen mit). Zweiter Tipp auf die zentrierte Person öffnet ihr Profil.
 */
export function FamilyTreeView({ persons, relationships, anchorId, onSelectPerson }: FamilyTreeViewProps) {
  const personById = useMemo(() => new Map(persons.map((p) => [p.id, p])), [persons]);

  const { neighborMap, pairTypeMap, dirLabel, dirType, pairCat } = useMemo(() => {
    const neighborMap = new Map<string, string[]>();
    const pairTypeMap = new Map<string, RelationshipType>();
    const pairCat = new Map<string, RelationshipCategory>();
    const dirLabel = new Map<string, string>();
    const dirType = new Map<string, RelationshipType>();
    const add = (a: string, b: string) => {
      if (!neighborMap.has(a)) neighborMap.set(a, []);
      const list = neighborMap.get(a)!;
      if (!list.includes(b)) list.push(b);
    };
    for (const rel of relationships) {
      const { from_person_id: f, to_person_id: t, type, category } = rel;
      add(f, t);
      add(t, f);
      const key = pairKey(f, t);
      if (!pairTypeMap.has(key)) {
        pairTypeMap.set(key, type);
        pairCat.set(key, category);
      }
      // to ist <type> von from; from ist <inverse> von to.
      dirLabel.set(`${f}->${t}`, RELATIONSHIP_LABELS[type]);
      dirLabel.set(`${t}->${f}`, INVERSE_LABEL[type]);
      if (!dirType.has(`${f}->${t}`)) dirType.set(`${f}->${t}`, type);
    }
    return { neighborMap, pairTypeMap, dirLabel, dirType, pairCat };
  }, [relationships]);

  const [activeId, setActiveId] = useState<string | null>(anchorId);
  useEffect(() => {
    setActiveId((cur) => cur ?? anchorId);
  }, [anchorId]);

  const hubId = activeId ?? anchorId;

  // Ring = nahe Angehörige des aktiven Hubs.
  const ringIds = useMemo(() => {
    if (!hubId) return [];
    return (neighborMap.get(hubId) ?? []).filter((n) => {
      const t = pairTypeMap.get(pairKey(hubId, n));
      return t ? CLOSE_TYPES.has(t) : false;
    });
  }, [hubId, neighborMap, pairTypeMap]);

  // Radiales Layout: Hub im Zentrum, Angehörige nach Himmelsrichtung —
  // Eltern oben, Kinder unten, Geschwister/Partner seitlich.
  const layout = useMemo(() => {
    const nodes: { id: string; cx: number; cy: number; size: number }[] = [];
    if (!hubId) return { nodes, width: 600, height: 600, center: 300 };

    // In Richtungs-Gruppen einsortieren.
    const top: string[] = []; // Eltern
    const bottom: string[] = []; // Kinder
    const left: string[] = [];
    const right: string[] = [];
    let sideToggle = true;
    for (const id of ringIds) {
      const role = roleOf(hubId, id, dirType);
      if (role === 'parent') top.push(id);
      else if (role === 'child') bottom.push(id);
      else if (role === 'partner') right.push(id);
      else {
        (sideToggle ? left : right).push(id);
        sideToggle = !sideToggle;
      }
    }

    const N = ringIds.length;
    const R = N <= 1 ? 168 : Math.max(186, 70 + N * 24);
    const half = R + HUB_D / 2 + 96;
    const C = half;
    nodes.push({ id: hubId, cx: C, cy: C, size: HUB_D });

    // Eine Gruppe entlang eines Bogens um eine Mittelrichtung verteilen.
    const place = (ids: string[], centerAngle: number, maxSpread: number) => {
      const k = ids.length;
      const spread = k <= 1 ? 0 : Math.min(maxSpread, 0.5 * k);
      ids.forEach((id, i) => {
        const a = k <= 1 ? centerAngle : centerAngle - spread / 2 + (spread * (i + 0.5)) / k;
        nodes.push({ id, cx: C + R * Math.cos(a), cy: C + R * Math.sin(a), size: NODE_D });
      });
    };
    const UP = -Math.PI / 2;
    const DOWN = Math.PI / 2;
    place(top, UP, 2.2);
    place(bottom, DOWN, 2.2);
    place(left, Math.PI, 1.6);
    place(right, 0, 1.6);

    return { nodes, width: half * 2, height: half * 2, center: C };
  }, [hubId, ringIds, dirType]);

  // ---- Kamera ----
  const translate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scale = useRef(new Animated.Value(1)).current;
  const tx = useRef(0);
  const ty = useRef(0);
  const sc = useRef(1);
  const viewport = useRef({ w: 0, h: 0 });
  const didInit = useRef(false);
  const lastTap = useRef(0);

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

  function animateCam(s: number, x: number, y: number) {
    Animated.parallel([
      Animated.spring(scale, { toValue: s, useNativeDriver: false, friction: 7, tension: 48 }),
      Animated.spring(translate, { toValue: { x, y }, useNativeDriver: false, friction: 7, tension: 48 }),
    ]).start();
  }

  // Hub immer exakt mittig: das gesamte (symmetrische) Layout einpassen.
  function centerHub() {
    const { w, h } = viewport.current;
    if (!w || !h) return;
    const pad = 80;
    const s = clamp(Math.min((w - pad) / layout.width, (h - pad) / layout.height, 1.05));
    animateCam(s, w / 2 - layout.center * s, h / 2 - layout.center * s);
  }

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    viewport.current = { w: width, h: height };
    if (width && height) {
      didInit.current = true;
      requestAnimationFrame(centerHub);
    }
  }

  // ---- Knoten-Positionen (Center-Koordinaten), animiert ----
  const positions = useRef(new Map<string, Animated.ValueXY>()).current;
  const appears = useRef(new Map<string, Animated.Value>()).current;
  const targets = useRef(new Map<string, { x: number; y: number }>()).current;
  const prevIds = useRef<string[]>([]);
  const justEntered = useRef<Set<string>>(new Set()).current;
  const [exiting, setExiting] = useState<{ id: string; size: number }[]>([]);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  function getPos(id: string): Animated.ValueXY {
    let p = positions.get(id);
    if (!p) {
      const t = targets.get(id);
      p = new Animated.ValueXY(t ?? { x: layout.center, y: layout.center });
      positions.set(id, p);
    }
    return p;
  }
  function getAppear(id: string): Animated.Value {
    let a = appears.get(id);
    if (!a) {
      a = new Animated.Value(0);
      appears.set(id, a);
    }
    return a;
  }

  // Neue Knoten in der Render-Phase am Hub starten (damit sie herauswachsen).
  for (const n of layout.nodes) {
    if (!positions.has(n.id)) {
      const start = (hubId && targets.get(hubId)) || { x: layout.center, y: layout.center };
      positions.set(n.id, new Animated.ValueXY(start));
      appears.set(n.id, new Animated.Value(0));
      justEntered.add(n.id);
    }
  }

  useEffect(() => {
    const current = layout.nodes;
    const currentIds = new Set(current.map((n) => n.id));

    let enterIdx = 0;
    for (const n of current) {
      const pos = positions.get(n.id);
      const ap = appears.get(n.id);
      const isNew = justEntered.has(n.id);
      // Neue Kreise „poppen" mit leichter Überschwingung und versetzt herein.
      const delay = isNew ? enterIdx++ * 55 : 0;
      if (pos)
        Animated.spring(pos, {
          toValue: { x: n.cx, y: n.cy },
          useNativeDriver: false,
          friction: isNew ? 6.5 : 8,
          tension: isNew ? 70 : 46,
          delay,
        }).start();
      if (ap) Animated.timing(ap, { toValue: 1, duration: 320, delay, useNativeDriver: false }).start();
      targets.set(n.id, { x: n.cx, y: n.cy });
    }
    justEntered.clear();

    const gone = prevIds.current.filter((id) => !currentIds.has(id));
    if (gone.length) {
      const hubTarget = (hubId && targets.get(hubId)) || null;
      gone.forEach((id) => {
        const ap = appears.get(id);
        if (ap) Animated.timing(ap, { toValue: 0, duration: 240, useNativeDriver: false }).start();
        const pos = positions.get(id);
        if (pos && hubTarget) Animated.timing(pos, { toValue: hubTarget, duration: 280, useNativeDriver: false }).start();
      });
      setExiting(gone.map((id) => ({ id, size: NODE_D })));
      const timer = setTimeout(() => {
        gone.forEach((id) => {
          positions.delete(id);
          appears.delete(id);
          targets.delete(id);
        });
        setExiting([]);
      }, 300);
      prevIds.current = current.map((n) => n.id);
      if (didInit.current) centerHub();
      return () => clearTimeout(timer);
    }

    prevIds.current = current.map((n) => n.id);
    if (didInit.current) centerHub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  // ---- Gesten ----
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
            pinch.current = { dist, scale: sc.current, cx: (w / 2 - tx.current) / sc.current, cy: (h / 2 - ty.current) / sc.current };
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
    if (now - lastTap.current < 300 && anchorId) setActiveId(anchorId);
    lastTap.current = now;
  }

  function zoomBy(factor: number) {
    const { w, h } = viewport.current;
    const ns = clamp(sc.current * factor);
    const cx = (w / 2 - tx.current) / sc.current;
    const cy = (h / 2 - ty.current) / sc.current;
    animateCam(ns, w / 2 - cx * ns, h / 2 - cy * ns);
  }

  function onNodePress(id: string) {
    if (id === hubId) onSelectPerson(id); // zweiter Tipp = Profil
    else setActiveId(id); // erster Tipp = erkunden / neues Zentrum
  }

  const currentIds = useMemo(() => new Set(layout.nodes.map((n) => n.id)), [layout]);
  const exitingVisible = exiting.filter((e) => !currentIds.has(e.id));
  const anchorVisible = !!anchorId && currentIds.has(anchorId);
  const sizeById = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of layout.nodes) m.set(n.id, n.size);
    return m;
  }, [layout]);

  return (
    <View style={styles.container} onLayout={onLayout}>
      <View style={StyleSheet.absoluteFill} {...responder.panHandlers}>
        <Animated.View
          style={[
            styles.world,
            {
              width: layout.width,
              height: layout.height,
              transform: [{ translateX: translate.x }, { translateY: translate.y }, { scale }],
            },
          ]}
        >
          <Svg width={layout.width} height={layout.height} style={StyleSheet.absoluteFill} pointerEvents="none">
            {hubId
              ? layout.nodes
                  .filter((n) => n.id !== hubId)
                  .map((n) => {
                    const cat = pairCat.get(pairKey(hubId, n.id));
                    const hubPos = getPos(hubId);
                    const nodePos = getPos(n.id);
                    return (
                      <AnimatedLine
                        key={`edge-${n.id}`}
                        x1={hubPos.x}
                        y1={hubPos.y}
                        x2={nodePos.x}
                        y2={nodePos.y}
                        stroke={cat ? relationshipColor(cat) : colors.border}
                        strokeWidth={3}
                        strokeLinecap="round"
                        opacity={0.6}
                      />
                    );
                  })
              : null}
          </Svg>

          <Pressable style={StyleSheet.absoluteFill} onPress={handleBackgroundTap} />

          {anchorVisible && anchorId ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.glow,
                {
                  width: (sizeById.get(anchorId) ?? NODE_D) + 26,
                  height: (sizeById.get(anchorId) ?? NODE_D) + 26,
                  opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.5] }),
                  transform: [
                    { translateX: Animated.subtract(getPos(anchorId).x, ((sizeById.get(anchorId) ?? NODE_D) + 26) / 2) },
                    { translateY: Animated.subtract(getPos(anchorId).y, ((sizeById.get(anchorId) ?? NODE_D) + 26) / 2) },
                    { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] }) },
                  ],
                },
              ]}
            />
          ) : null}

          {[...exitingVisible.map((e) => e.id), ...layout.nodes.map((n) => n.id)].map((id) => {
            const person = personById.get(id);
            if (!person) return null;
            const size = sizeById.get(id) ?? NODE_D;
            const isHub = id === hubId;
            const isAnchor = id === anchorId;
            const cat = hubId && id !== hubId ? pairCat.get(pairKey(hubId, id)) : undefined;
            const ringColor = isAnchor
              ? colors.gold
              : isHub
                ? colors.primary
                : cat
                  ? relationshipColor(cat)
                  : colors.border;
            const relLabel = hubId && id !== hubId ? dirLabel.get(`${hubId}->${id}`) : undefined;
            return (
              <NodeCircle
                key={id}
                person={person}
                pos={getPos(id)}
                appear={getAppear(id)}
                size={size}
                isHub={isHub}
                isAnchor={isAnchor}
                ringColor={ringColor}
                glowColor={cat ? relationshipColor(cat) : isAnchor ? colors.gold : isHub ? colors.primary : undefined}
                relLabel={relLabel}
                onPress={() => onNodePress(id)}
              />
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
        {anchorId ? (
          <Pressable style={styles.ctrlBtn} onPress={() => setActiveId(anchorId)} hitSlop={6}>
            <Ionicons name="locate-outline" size={20} color={colors.primaryDark} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function NodeCircle({
  person,
  pos,
  appear,
  size,
  isHub,
  isAnchor,
  ringColor,
  glowColor,
  relLabel,
  onPress,
}: {
  person: Person;
  pos: Animated.ValueXY;
  appear: Animated.Value;
  size: number;
  isHub: boolean;
  isAnchor: boolean;
  ringColor: string;
  glowColor?: string;
  relLabel?: string;
  onPress: () => void;
}) {
  const press = useRef(new Animated.Value(0)).current;
  const animatePress = (to: number) =>
    Animated.spring(press, { toValue: to, useNativeDriver: false, friction: 6, tension: 120 }).start();

  const baseScale = appear.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] });
  const pressScale = press.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });
  const wrapW = Math.max(size, 132);
  const halo = glowColor ?? colors.border;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.nodeWrap,
        {
          width: wrapW,
          opacity: appear,
          transform: [
            { translateX: Animated.subtract(pos.x, wrapW / 2) },
            { translateY: Animated.subtract(pos.y, size / 2) },
            { scale: Animated.multiply(baseScale, pressScale) },
          ],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => animatePress(1)}
        onPressOut={() => animatePress(0)}
        onHoverIn={() => animatePress(1)}
        onHoverOut={() => animatePress(0)}
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: ringColor,
            borderWidth: isHub ? 3.5 : 3,
            backgroundColor: withAlpha(halo, 0.1),
            shadowColor: halo,
            shadowOpacity: isHub ? 0.45 : 0.32,
            shadowRadius: isHub ? 22 : 16,
            shadowOffset: { width: 0, height: 0 },
            elevation: isHub ? 8 : 5,
          },
        ]}
      >
        {person.avatar_url ? (
          <SignedImage
            bucket="photos"
            path={person.avatar_url}
            style={{ width: size - 8, height: size - 8, borderRadius: (size - 8) / 2 }}
          />
        ) : (
          <Avatar name={fullName(person.first_name, person.last_name)} size={size - 8} />
        )}
        {isAnchor ? (
          <View style={styles.duBadge}>
            <AppText variant="caption" color={colors.textOnAccent} style={styles.duText}>Du</AppText>
          </View>
        ) : null}
      </Pressable>

      <AppText variant="bodyStrong" center numberOfLines={1} style={[styles.name, { width: wrapW }]}>
        {person.first_name}
      </AppText>
      {relLabel ? (
        <AppText variant="caption" center numberOfLines={1} color={ringColor} style={[styles.rel, { width: wrapW }]}>
          {relLabel}
        </AppText>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative', overflow: 'hidden' },
  world: { position: 'absolute', left: 0, top: 0, transformOrigin: 'left top' },
  nodeWrap: { position: 'absolute', left: 0, top: 0, alignItems: 'center' },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    ...shadow.soft,
  },
  duBadge: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  duText: { fontSize: 10, fontWeight: '800' },
  name: { marginTop: 8 },
  rel: { fontWeight: '600', marginTop: 1 },
  glow: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 999,
    backgroundColor: withAlpha(colors.gold, 0.5),
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 24,
  },
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
