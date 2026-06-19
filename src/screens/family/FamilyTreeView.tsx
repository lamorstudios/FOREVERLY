import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Animated,
  PanResponder,
  LayoutChangeEvent,
  Easing,
  Platform,
  type ViewStyle,
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

const MIN_SCALE = 0.3; // weiteres Herauszoomen für mehr Übersicht
const MAX_SCALE = 3;
// Eigener Boden für den Start-/Center-Fit, damit der Startzoom unverändert bleibt
// (Nutzer können danach manuell weiter bis MIN_SCALE herauszoomen).
const FIT_MIN_SCALE = 0.5;
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

interface TreeNodeView {
  id: string;
  cx: number;
  cy: number;
  size: number;
  ring: number;
  color: string;
  opacity: number;
  rel?: string;
}
interface TreeEdgeView {
  id: string;
  from: string;
  to: string;
  color: string;
  opacity: number;
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

  const { neighborMap, dirLabel, dirType, pairCat } = useMemo(() => {
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
    return { neighborMap, dirLabel, dirType, pairCat };
  }, [relationships]);

  const [activeId, setActiveId] = useState<string | null>(anchorId);
  useEffect(() => {
    setActiveId((cur) => cur ?? anchorId);
  }, [anchorId]);

  const hubId = activeId ?? anchorId;

  // Semantisches Raster-Layout aus Sicht des Hubs („ich"):
  // Eltern oben (Mutter links / Vater rechts), Großeltern über dem jeweiligen
  // Elternteil, Tante/Onkel daneben, Schwestern links, Brüder rechts, Kinder
  // unten, alles Weitere ausgegraut weiter außen. Eigene Rasterzellen ⇒ keine
  // Überschneidungen von Kreisen/Texten.
  const layout = useMemo<{
    nodes: TreeNodeView[];
    edges: TreeEdgeView[];
    width: number;
    height: number;
    hubX: number;
    hubY: number;
  }>(() => {
    if (!hubId) return { nodes: [], edges: [], width: 600, height: 600, hubX: 300, hubY: 300 };

    const PARENTS_T = new Set<RelationshipType>(['mutter', 'vater', 'stiefmutter', 'stiefvater']);
    const CHILDREN_T = new Set<RelationshipType>(['sohn', 'tochter', 'stiefkind', 'adoptivkind', 'pflegekind']);

    const relInfo = (a: string, b: string): { type: RelationshipType; inv: boolean } | null => {
      const f = dirType.get(`${a}->${b}`);
      if (f) return { type: f, inv: false };
      const g = dirType.get(`${b}->${a}`);
      if (g) return { type: g, inv: true };
      return null;
    };

    // Erreichbarkeit + Vorgänger (für „äußere" Verwandte).
    const dist = new Map<string, number>([[hubId, 0]]);
    const bpred = new Map<string, string>();
    const q = [hubId];
    while (q.length) {
      const u = q.shift()!;
      for (const n of neighborMap.get(u) ?? []) {
        if (!dist.has(n)) { dist.set(n, dist.get(u)! + 1); bpred.set(n, u); q.push(n); }
      }
    }
    const reachable = [...dist.keys()].filter((id) => id !== hubId && personById.has(id));

    const roleKind = new Map<string, string>();
    const parentOf = new Map<string, string>(); // strukturelle Kante
    const mothers: string[] = [];
    const fathers: string[] = [];
    const sisters: string[] = [];
    const brothers: string[] = [];
    const partners: string[] = [];
    const children: string[] = [];
    const placed = new Set<string>([hubId]);

    for (const n of neighborMap.get(hubId) ?? []) {
      const r = relInfo(hubId, n);
      if (!r || !CLOSE_TYPES.has(r.type)) continue;
      const T = r.type;
      let kind: string;
      if (!r.inv) {
        if (T === 'mutter' || T === 'stiefmutter') kind = 'mother';
        else if (T === 'vater' || T === 'stiefvater') kind = 'father';
        else if (T === 'schwester') kind = 'sister';
        else if (T === 'bruder') kind = 'brother';
        else if (T === 'ehepartner' || T === 'lebenspartner') kind = 'partner';
        else kind = 'child';
      } else {
        if (PARENTS_T.has(T)) kind = 'child'; // hub ist Elternteil von n
        else if (CHILDREN_T.has(T)) kind = 'father'; // hub ist Kind von n → n Elternteil
        else if (T === 'ehepartner' || T === 'lebenspartner') kind = 'partner';
        else if (T === 'schwester' || T === 'bruder') kind = 'brother';
        else kind = 'child';
      }
      ({ mother: mothers, father: fathers, sister: sisters, brother: brothers, partner: partners, child: children }[kind as 'mother'])?.push(n);
      roleKind.set(n, kind);
      parentOf.set(n, hubId);
      placed.add(n);
    }

    const aunts: string[] = [];
    const gpOf = new Map<string, string[]>();
    const addExtras = (parent: string) => {
      const gps: string[] = [];
      for (const n of neighborMap.get(parent) ?? []) {
        if (placed.has(n) || !personById.has(n)) continue;
        const r = relInfo(parent, n);
        if (!r) continue;
        const nIsParent = (!r.inv && PARENTS_T.has(r.type)) || (r.inv && CHILDREN_T.has(r.type));
        const nIsSibling = r.type === 'schwester' || r.type === 'bruder';
        if (nIsParent) { gps.push(n); roleKind.set(n, 'gp'); parentOf.set(n, parent); placed.add(n); }
        else if (nIsSibling) { aunts.push(n); roleKind.set(n, 'aunt'); parentOf.set(n, parent); placed.add(n); }
      }
      gpOf.set(parent, gps);
    };
    mothers.forEach(addExtras);
    fathers.forEach(addExtras);

    const gkOf = new Map<string, string[]>();
    for (const c of children) {
      const arr: string[] = [];
      for (const n of neighborMap.get(c) ?? []) {
        if (placed.has(n) || !personById.has(n)) continue;
        const r = relInfo(c, n);
        if (!r) continue;
        const nIsChild = (!r.inv && CHILDREN_T.has(r.type)) || (r.inv && PARENTS_T.has(r.type));
        if (nIsChild) { arr.push(n); roleKind.set(n, 'grandchild'); parentOf.set(n, c); placed.add(n); }
      }
      gkOf.set(c, arr);
    }

    const outer = reachable.filter((id) => !placed.has(id));
    outer.forEach((id) => { roleKind.set(id, 'outer'); parentOf.set(id, bpred.get(id) ?? hubId); });

    // ---- Rasterplatzierung (jede Person eine eigene Zelle) ----
    const used = new Set<string>();
    const cell = new Map<string, { c: number; r: number }>();
    const claim = (c0: number, r: number, dir: number) => {
      let c = c0;
      if (dir === 0) {
        let k = 0;
        while (used.has(`${c},${r}`)) { k++; c = c0 + (k % 2 ? Math.ceil(k / 2) : -Math.ceil(k / 2)); }
      } else {
        while (used.has(`${c},${r}`)) c += dir;
      }
      used.add(`${c},${r}`);
      return c;
    };
    const put = (id: string, c0: number, r: number, dir: number) => cell.set(id, { c: claim(c0, r, dir), r });

    put(hubId, 0, 0, 0);
    mothers.forEach((id, i) => put(id, -1 - i, -1, -1));
    fathers.forEach((id, i) => put(id, 1 + i, -1, 1));
    mothers.forEach((m) => (gpOf.get(m) ?? []).forEach((g, i) => put(g, cell.get(m)!.c + (i % 2 ? Math.ceil(i / 2) : -Math.ceil(i / 2)), -2, -1)));
    fathers.forEach((f) => (gpOf.get(f) ?? []).forEach((g, i) => put(g, cell.get(f)!.c + (i % 2 ? Math.ceil(i / 2) : -Math.ceil(i / 2)), -2, 1)));
    const leftMother = mothers.length ? Math.min(...mothers.map((m) => cell.get(m)!.c)) : -1;
    aunts.filter((a) => mothers.includes(parentOf.get(a)!)).forEach((id, i) => put(id, leftMother - 1 - i, -1, -1));
    const rightFather = fathers.length ? Math.max(...fathers.map((f) => cell.get(f)!.c)) : 1;
    aunts.filter((a) => fathers.includes(parentOf.get(a)!)).forEach((id, i) => put(id, rightFather + 1 + i, -1, 1));
    partners.forEach((id, i) => put(id, 1 + i, 0, 1));
    sisters.forEach((id, i) => put(id, -1 - i, 0, -1));
    brothers.forEach((id, i) => put(id, 1 + i + partners.length, 0, 1));
    children.forEach((id) => put(id, 0, 1, 0));
    children.forEach((c) => (gkOf.get(c) ?? []).forEach((g) => put(g, cell.get(c)!.c, 2, 0)));
    outer.forEach((id) => {
      const p = parentOf.get(id)!;
      const pc = cell.get(p)?.c ?? 0;
      const pr = cell.get(p)?.r ?? 0;
      const r = pr < 0 ? pr - 1 : pr > 0 ? pr + 1 : (id.charCodeAt(0) % 2 ? 2 : -2);
      const dir = pc < 0 ? -1 : pc > 0 ? 1 : id.charCodeAt(0) % 2 ? 1 : -1;
      put(id, pc, r, dir);
    });

    const COLW = 164;
    const ROWH = 192;
    const tierOf = (id: string): number => {
      if (id === hubId) return 0;
      const k = roleKind.get(id);
      if (k === 'gp' || k === 'aunt' || k === 'grandchild') return 2;
      if (k === 'outer' || !k) return 3;
      return 1;
    };
    const SIZE = [HUB_D, 84, 76, 58];
    const OPACITY = [1, 1, 1, 0.5];
    const genericLabel = (id: string): string | undefined => {
      const k = roleKind.get(id);
      if (k === 'gp') return 'Großeltern';
      if (k === 'aunt') return 'Tante/Onkel';
      if (k === 'grandchild') return 'Enkelkind';
      return undefined;
    };

    const ids = [hubId, ...reachable.filter((id) => cell.has(id))];
    const xs = ids.map((id) => cell.get(id)!.c * COLW);
    const ys = ids.map((id) => cell.get(id)!.r * ROWH);
    const margin = 150;
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const offX = margin - minX;
    const offY = margin - minY;
    const width = Math.max(...xs) - minX + margin * 2;
    const height = Math.max(...ys) - minY + margin * 2;
    const hubX = -minX + margin;
    const hubY = -minY + margin;

    const nodes: TreeNodeView[] = [];
    const edges: TreeEdgeView[] = [];
    for (const id of ids) {
      const t = tierOf(id);
      const cx = cell.get(id)!.c * COLW + offX;
      const cy = cell.get(id)!.r * ROWH + offY;
      const p = parentOf.get(id);
      const cat = p ? pairCat.get(pairKey(p, id)) : undefined;
      // Das ausgewählte (zentrierte) Node behält seine ursprüngliche
      // Beziehungsfarbe (zur eigenen Person), statt auf Blau zu springen.
      const hubCat = id === hubId && anchorId && id !== anchorId ? pairCat.get(pairKey(id, anchorId)) : undefined;
      const color =
        id === anchorId
          ? colors.primary // „Du" bleibt blau
          : id === hubId
            ? (hubCat ? relationshipColor(hubCat) : colors.primary)
            : t >= 3
              ? colors.textMuted
              : cat
                ? relationshipColor(cat)
                : colors.border;
      const rel = id === hubId ? undefined : t <= 2 ? dirLabel.get(`${hubId}->${id}`) ?? genericLabel(id) : undefined;
      nodes.push({ id, cx, cy, size: SIZE[t]!, ring: t, color, opacity: OPACITY[t]!, rel });
      if (p) {
        const ec = t >= 3 ? colors.textMuted : cat ? relationshipColor(cat) : colors.border;
        edges.push({ id: `${p}->${id}`, from: p, to: id, color: ec, opacity: [0, 0.6, 0.5, 0.22][t]! });
      }
    }

    return { nodes, edges, width, height, hubX, hubY };
  }, [hubId, anchorId, neighborMap, dirType, dirLabel, pairCat, personById]);

  // Stabile Referenz auf das aktuelle Layout (PanResponder wird nur 1× erzeugt).
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  // ---- Kamera ----
  const translate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scale = useRef(new Animated.Value(1)).current;
  const tx = useRef(0);
  const ty = useRef(0);
  const sc = useRef(1);
  const viewport = useRef({ w: 0, h: 0 });
  const didInit = useRef(false);
  const lastTap = useRef(0);
  // Absolute Bildschirmposition des Tree-Containers – nötig, um den Finger-
  // Mittelpunkt aus pageX/Y zuverlässig in View-Koordinaten umzurechnen.
  const containerRef = useRef<View>(null);
  const containerOffset = useRef({ x: 0, y: 0 });
  const measureContainer = () =>
    containerRef.current?.measureInWindow?.((x, y) => {
      containerOffset.current = { x, y };
    });

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

  // Zoom um einen festen Punkt (px,py = View-Koordinaten). Der Weltpunkt unter
  // (px,py) bleibt exakt stehen: worldX=(px-tx)/old; newTx=px-worldX*new.
  // tx/ty/sc werden direkt aktualisiert (kein Listener-Lag -> kein Springen).
  function zoomAt(px: number, py: number, factor: number) {
    const oldScale = sc.current || 1;
    const ns = clamp(oldScale * factor);
    if (ns === oldScale) return;
    const worldX = (px - tx.current) / oldScale;
    const worldY = (py - ty.current) / oldScale;
    const nx = px - worldX * ns;
    const ny = py - worldY * ns;
    scale.setValue(ns);
    sc.current = ns;
    translate.setValue({ x: nx, y: ny });
    tx.current = nx;
    ty.current = ny;
  }

  // Mausrad/Trackpad-Zoom (nur Web): um den Cursor herum, stabil.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = containerRef.current as unknown as HTMLElement | null;
    if (!el || typeof el.addEventListener !== 'function') return;
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = ev.clientX - rect.left;
      const py = ev.clientY - rect.top;
      const factor = ev.deltaY < 0 ? 1.12 : 1 / 1.12;
      zoomAt(px, py, factor);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function animateCam(s: number, x: number, y: number) {
    Animated.parallel([
      Animated.spring(scale, { toValue: s, useNativeDriver: false, friction: 7, tension: 48 }),
      Animated.spring(translate, { toValue: { x, y }, useNativeDriver: false, friction: 7, tension: 48 }),
    ]).start();
  }

  // Hub immer exakt mittig: auf hubX/hubY zentrieren und alles einpassen.
  function centerHub() {
    const { w, h } = viewport.current;
    if (!w || !h) return;
    const pad = 56;
    const halfW = Math.max(layout.hubX, layout.width - layout.hubX);
    const halfH = Math.max(layout.hubY, layout.height - layout.hubY);
    // Start-/Center-Fit nutzt den eigenen Boden FIT_MIN_SCALE (= bisheriger
    // Startzoom). MIN_SCALE/MAX_SCALE gelten weiterhin für freies Zoomen.
    const s = Math.min(MAX_SCALE, Math.max(FIT_MIN_SCALE, Math.min((w / 2 - pad) / halfW, (h / 2 - pad) / halfH, 1.05)));
    animateCam(s, w / 2 - layout.hubX * s, h / 2 - layout.hubY * s);
  }

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    viewport.current = { w: width, h: height };
    measureContainer();
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
  // Frei verschobene Knoten (Long-Press-Drag) – Layout überschreibt sie nicht.
  const overridden = useRef<Set<string>>(new Set()).current;
  const avoiding = useRef<Set<string>>(new Set()).current;
  const grabbed = useRef<string | null>(null);
  const grabStart = useRef({ x: 0, y: 0 });
  const [grabbedId, setGrabbedId] = useState<string | null>(null);
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

  // Sehr dezente, langsame „Atmen"-Animation (eine geteilte Schleife für alle Nodes).
  const breathe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 2800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(breathe, { toValue: 0, duration: 2800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  function getPos(id: string): Animated.ValueXY {
    let p = positions.get(id);
    if (!p) {
      const t = targets.get(id);
      p = new Animated.ValueXY(t ?? { x: layout.hubX, y: layout.hubY });
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
      const start = (hubId && targets.get(hubId)) || { x: layout.hubX, y: layout.hubY };
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
      if (pos && !overridden.has(n.id))
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
  // Inkrementeller Pinch: nur der letzte Finger-Abstand als Baseline.
  const pinch = useRef<{ dist: number } | null>(null);
  // Verhindert, dass nach einem Pinch ein Node-/Hintergrund-Tap fälschlich
  // eine Person fokussiert (Kamera-Sprung). didPinch wird beim 2-Finger-Move
  // gesetzt; nach dem Loslassen unterdrücken wir Taps kurz.
  const didPinch = useRef(false);
  const suppressTapUntil = useRef(0);
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
        measureContainer(); // Container-Offset vor der Geste aktualisieren
        if (grabbed.current) {
          const p = positions.get(grabbed.current);
          // aktuellen Wert auslesen, um von dort weiterzuziehen
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          grabStart.current = { x: (p?.x as any)?.__getValue?.() ?? 0, y: (p?.y as any)?.__getValue?.() ?? 0 };
        } else {
          scale.stopAnimation();
          translate.stopAnimation();
        }
      },
      onPanResponderMove: (e, g) => {
        const touches = e.nativeEvent.touches;
        // Long-Press-Drag: gegriffenen Kreis frei verschieben, andere weichen aus.
        if (grabbed.current && (!touches || touches.length < 2)) {
          const s = sc.current || 1;
          const gid = grabbed.current;
          const gx = grabStart.current.x + g.dx / s;
          const gy = grabStart.current.y + g.dy / s;
          const gp = positions.get(gid);
          if (gp) {
            overridden.add(gid);
            gp.setValue({ x: gx, y: gy });
          }
          const nodes = layoutRef.current.nodes;
          const gSize = nodes.find((n) => n.id === gid)?.size ?? NODE_D;
          for (const n of nodes) {
            if (n.id === gid) continue;
            const p = positions.get(n.id);
            if (!p) continue;
            const home = targets.get(n.id) ?? { x: n.cx, y: n.cy };
            const dx = home.x - gx;
            const dy = home.y - gy;
            const dd = Math.hypot(dx, dy) || 0.0001;
            const minD = (gSize + n.size) / 2 + 30;
            if (dd < minD) {
              const k = minD / dd;
              p.setValue({ x: gx + dx * k, y: gy + dy * k });
              avoiding.add(n.id);
            } else if (avoiding.has(n.id)) {
              // Platz wieder frei → sanft an die Heimatposition zurück.
              avoiding.delete(n.id);
              Animated.spring(p, { toValue: home, useNativeDriver: false, friction: 7, tension: 60 }).start();
            }
          }
          return;
        }
        if (touches && touches.length === 2) {
          const t1 = touches[0]!;
          const t2 = touches[1]!;
          const dist = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
          didPinch.current = true; // markiert die Geste -> Tap danach unterdrücken
          // Finger-Mittelpunkt zuverlässig in View-Koordinaten:
          // pageX/Y (absolut) minus die gemessene Container-Position.
          const mx = (t1.pageX + t2.pageX) / 2 - containerOffset.current.x;
          const my = (t1.pageY + t2.pageY) / 2 - containerOffset.current.y;
          if (!pinch.current || pinch.current.dist <= 0) {
            pinch.current = { dist }; // Baseline-Abstand merken
          } else {
            // Inkrementell um den AKTUELLEN Finger-Mittelpunkt zoomen:
            // worldX = (pointer - translate) / oldScale; danach
            // newTranslate = pointer - worldX * newScale  -> Punkt bleibt stabil.
            zoomAt(mx, my, dist / pinch.current.dist);
            pinch.current.dist = dist; // Baseline für nächsten Frame
          }
        } else {
          pinch.current = null;
          translate.setValue({ x: panStart.current.x + g.dx, y: panStart.current.y + g.dy });
        }
      },
      onPanResponderRelease: () => {
        pinch.current = null;
        if (didPinch.current) suppressTapUntil.current = Date.now() + 400;
        didPinch.current = false;
        // ausgewichene Kreise an ihrer ausgewichenen Position belassen (kein Overlap)
        avoiding.forEach((id) => overridden.add(id));
        avoiding.clear();
        grabbed.current = null;
        setGrabbedId(null);
      },
      onPanResponderTerminate: () => {
        pinch.current = null;
        if (didPinch.current) suppressTapUntil.current = Date.now() + 400;
        didPinch.current = false;
        avoiding.forEach((id) => overridden.add(id));
        avoiding.clear();
        grabbed.current = null;
        setGrabbedId(null);
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  function beginGrab(id: string) {
    grabbed.current = id;
    setGrabbedId(id);
  }

  function handleBackgroundTap() {
    if (Date.now() < suppressTapUntil.current) return; // direkt nach Pinch ignorieren
    const now = Date.now();
    if (now - lastTap.current < 300 && anchorId) focusPerson(anchorId);
    lastTap.current = now;
  }

  function zoomBy(factor: number) {
    const { w, h } = viewport.current;
    const ns = clamp(sc.current * factor);
    const cx = (w / 2 - tx.current) / sc.current;
    const cy = (h / 2 - ty.current) / sc.current;
    animateCam(ns, w / 2 - cx * ns, h / 2 - cy * ns);
  }

  function focusPerson(id: string) {
    overridden.clear(); // frei verschobene Positionen beim Neuaufbau zurücksetzen
    setActiveId(id);
  }

  // Center-Button: aktive Person (oder „Du") mittig im Viewport – Zoom bleibt.
  function recenterOnActive() {
    const id = hubId ?? anchorId;
    if (!id) return;
    const { w, h } = viewport.current;
    if (!w || !h) return;
    const p = positions.get(id);
    const nv = nodeViewById.get(id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wx = (p?.x as any)?.__getValue?.() ?? nv?.cx ?? layout.hubX;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wy = (p?.y as any)?.__getValue?.() ?? nv?.cy ?? layout.hubY;
    const s = sc.current || 1; // aktuellen Zoom beibehalten
    animateCam(s, w / 2 - wx * s, h / 2 - wy * s);
  }

  function onNodePress(id: string) {
    // Direkt nach einem Pinch keinen Fokuswechsel auslösen (kein Kamera-Sprung).
    if (Date.now() < suppressTapUntil.current) return;
    if (id === hubId) onSelectPerson(id); // zweiter Tipp = Profil
    else focusPerson(id); // erster Tipp = erkunden / neues Zentrum
  }

  const currentIds = useMemo(() => new Set(layout.nodes.map((n) => n.id)), [layout]);
  const exitingVisible = exiting.filter((e) => !currentIds.has(e.id));
  const nodeViewById = useMemo(() => {
    const m = new Map<string, TreeNodeView>();
    for (const n of layout.nodes) m.set(n.id, n);
    return m;
  }, [layout]);
  // Fokus-Glow folgt dem ausgewählten (zentrierten) Node und nutzt dessen
  // Beziehungsfarbe – „Du" bleibt blau.
  const hubVisible = !!hubId && currentIds.has(hubId);
  const hubSize = (hubId && nodeViewById.get(hubId)?.size) || NODE_D;
  const hubColor =
    (hubId === anchorId ? colors.primary : hubId ? nodeViewById.get(hubId)?.color : null) || colors.primary;

  return (
    <View ref={containerRef} style={styles.container} onLayout={onLayout}>
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
            {layout.edges.map((e) => {
              const a = getPos(e.from);
              const b = getPos(e.to);
              return (
                <AnimatedLine
                  key={`edge-${e.id}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={e.color}
                  strokeWidth={e.opacity > 0.4 ? 2 : 1.5}
                  strokeLinecap="round"
                  opacity={Math.min(0.7, e.opacity + 0.1)}
                />
              );
            })}
          </Svg>

          <Pressable style={StyleSheet.absoluteFill} onPress={handleBackgroundTap} />

          {hubVisible && hubId ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.glow,
                coloredGlowStyle(hubColor),
                {
                  width: hubSize + 26,
                  height: hubSize + 26,
                  backgroundColor: withAlpha(hubColor, 0.1),
                  shadowColor: hubColor,
                  opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.5] }),
                  transform: [
                    { translateX: Animated.subtract(getPos(hubId).x, (hubSize + 26) / 2) },
                    { translateY: Animated.subtract(getPos(hubId).y, (hubSize + 26) / 2) },
                    { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] }) },
                  ],
                },
              ]}
            />
          ) : null}

          {[...exitingVisible.map((e) => e.id), ...layout.nodes.map((n) => n.id)].map((id) => {
            const person = personById.get(id);
            if (!person) return null;
            const nv = nodeViewById.get(id);
            const isHub = id === hubId;
            const isAnchor = id === anchorId;
            return (
              <NodeCircle
                key={id}
                person={person}
                pos={getPos(id)}
                appear={getAppear(id)}
                size={nv?.size ?? NODE_D}
                isHub={isHub}
                isAnchor={isAnchor}
                breathe={breathe}
                color={isAnchor ? colors.primary : nv?.color ?? colors.border}
                ringOpacity={nv?.opacity ?? 1}
                faded={(nv?.ring ?? 0) >= 3}
                grabbed={id === grabbedId}
                relLabel={nv?.rel}
                onPress={() => onNodePress(id)}
                onLongPress={() => beginGrab(id)}
              />
            );
          })}
        </Animated.View>
      </View>

      <View style={styles.controls}>
        <Pressable style={[styles.ctrlBtn, webGlassBtn]} onPress={() => zoomBy(1.25)} hitSlop={6}>
          <AppText variant="heading" color={colors.primary}>+</AppText>
        </Pressable>
        <Pressable style={[styles.ctrlBtn, webGlassBtn]} onPress={() => zoomBy(0.8)} hitSlop={6}>
          <AppText variant="heading" color={colors.primary}>−</AppText>
        </Pressable>
        {anchorId ? (
          <Pressable style={[styles.ctrlBtn, webGlassBtn]} onPress={recenterOnActive} hitSlop={6}>
            <Ionicons name="locate" size={20} color={colors.primary} />
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
  breathe,
  color,
  ringOpacity,
  faded,
  grabbed,
  relLabel,
  onPress,
  onLongPress,
}: {
  person: Person;
  pos: Animated.ValueXY;
  appear: Animated.Value;
  size: number;
  isHub: boolean;
  isAnchor: boolean;
  breathe: Animated.Value;
  color: string;
  ringOpacity: number;
  faded: boolean;
  grabbed: boolean;
  relLabel?: string;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const press = useRef(new Animated.Value(0)).current;
  const animatePress = (to: number) =>
    Animated.spring(press, { toValue: to, useNativeDriver: false, friction: 6, tension: 120 }).start();

  const baseScale = appear.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] });
  const pressScale = press.interpolate({ inputRange: [0, 1], outputRange: [1, grabbed ? 1.14 : 1.07] });
  // Sehr dezentes „Atmen" (~2,2 %) – nicht beim aktiv gegriffenen Node.
  const breatheScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, grabbed ? 1 : 1.022] });
  const wrapW = Math.max(size, 132);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.nodeWrap,
        {
          width: wrapW,
          opacity: appear,
          zIndex: grabbed ? 50 : isHub ? 10 : 1,
          transform: [
            { translateX: Animated.subtract(pos.x, wrapW / 2) },
            { translateY: Animated.subtract(pos.y, size / 2) },
            { scale: Animated.multiply(Animated.multiply(baseScale, pressScale), breatheScale) },
          ],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={280}
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
            borderColor: color,
            borderWidth: isHub ? 3.5 : grabbed ? 3.5 : 3,
            opacity: ringOpacity,
            // Glassmorphism: leicht durchscheinende Fläche + weicher Glow.
            backgroundColor: faded ? withAlpha(colors.surface, 0.6) : withAlpha(colors.surface, 0.82),
            shadowColor: color,
            shadowOpacity: faded ? 0.12 : isHub || grabbed ? 0.5 : 0.34,
            shadowRadius: grabbed ? 26 : isHub ? 22 : 15,
            shadowOffset: { width: 0, height: 6 },
            elevation: faded ? 1 : isHub || grabbed ? 9 : 5,
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
        {person.is_legend && !faded ? (
          <View style={styles.legendBadge}>
            <Ionicons name="star" size={11} color={colors.textOnAccent} />
          </View>
        ) : null}
      </Pressable>

      <AppText
        variant={isHub ? 'bodyStrong' : 'caption'}
        center
        numberOfLines={1}
        color={faded ? colors.textMuted : colors.textPrimary}
        style={[styles.name, { width: wrapW, opacity: faded ? 0.7 : 1 }]}
      >
        {person.first_name}
      </AppText>
      {relLabel ? (
        <AppText variant="caption" center numberOfLines={1} color={color} style={[styles.rel, { width: wrapW }]}>
          {relLabel}
        </AppText>
      ) : null}
    </Animated.View>
  );
}

// Weicher, mehrschichtiger Fokus-Glow in der jeweiligen Beziehungsfarbe (Web).
function coloredGlowStyle(color: string): ViewStyle | null {
  if (Platform.OS !== 'web') return null;
  return {
    boxShadow: `0 0 0 6px ${withAlpha(color, 0.12)}, 0 14px 34px ${withAlpha(color, 0.30)}, 0 8px 22px ${withAlpha(color, 0.16)}`,
  } as unknown as ViewStyle;
}
// Glas-Effekt für die Floating-Controls (Web).
const webGlassBtn =
  Platform.OS === 'web'
    ? ({ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 8px 24px rgba(20,22,40,0.10)' } as unknown as ViewStyle)
    : null;

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
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  duText: { fontSize: 10, fontWeight: '800', color: colors.textOnAccent },
  legendBadge: {
    position: 'absolute',
    top: -4,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  name: { marginTop: 8 },
  rel: { fontWeight: '600', marginTop: 1 },
  glow: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 999,
    // Kein gelber Schimmer mehr – weicher, mehrschichtiger Glow (Web via webActiveGlow).
    backgroundColor: withAlpha(colors.primary, 0.06),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
  },
  controls: { position: 'absolute', right: spacing.md, bottom: spacing.md, gap: spacing.sm },
  ctrlBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    // Weißer Glas-Button, kein harter Rahmen, weicher Schatten.
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E2233',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
});
