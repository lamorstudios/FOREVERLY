import { createContext, useContext, useRef, useCallback, ReactNode, RefObject, useEffect } from 'react';
import type { View } from 'react-native';

/**
 * Tour-Infrastruktur: echte UI-Elemente registrieren ihre Position, damit die
 * interaktive Tour zu ihnen scrollen und sie per Spotlight hervorheben kann.
 */

export interface Rect { x: number; y: number; width: number; height: number }

export interface Scroller {
  scrollTo: (y: number) => void;
  getOffset: () => number;
}

interface TourContextValue {
  registerTarget: (id: string, ref: RefObject<View>) => void;
  unregisterTarget: (id: string) => void;
  setScroller: (s: Scroller | null) => void;
  /** Position eines registrierten Elements (Fenster-Koordinaten). */
  measure: (id: string) => Promise<Rect | null>;
  /** Scrollt das Element in den sichtbaren Bereich und liefert die neue Position. */
  focus: (id: string, desiredY: number) => Promise<Rect | null>;
}

const TourContext = createContext<TourContextValue | undefined>(undefined);

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function measureNode(ref: RefObject<View>): Promise<Rect | null> {
  return new Promise((resolve) => {
    const node = ref.current as unknown as { measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void } | null;
    if (!node || typeof node.measureInWindow !== 'function') {
      resolve(null);
      return;
    }
    node.measureInWindow((x, y, width, height) => {
      if (!width && !height) resolve(null);
      else resolve({ x, y, width, height });
    });
  });
}

export function TourProvider({ children }: { children: ReactNode }) {
  const targets = useRef(new Map<string, RefObject<View>>());
  const scroller = useRef<Scroller | null>(null);

  const registerTarget = useCallback((id: string, ref: RefObject<View>) => {
    targets.current.set(id, ref);
  }, []);
  const unregisterTarget = useCallback((id: string) => {
    targets.current.delete(id);
  }, []);
  const setScroller = useCallback((s: Scroller | null) => {
    scroller.current = s;
  }, []);

  const measure = useCallback((id: string) => {
    const ref = targets.current.get(id);
    return ref ? measureNode(ref) : Promise.resolve(null);
  }, []);

  const focus = useCallback(async (id: string, desiredY: number) => {
    const ref = targets.current.get(id);
    if (!ref) return null;
    let rect = await measureNode(ref);
    if (!rect) return null;
    const sc = scroller.current;
    if (sc && Math.abs(rect.y - desiredY) > 8) {
      sc.scrollTo(Math.max(0, sc.getOffset() + (rect.y - desiredY)));
      // Auf das Einrasten des Scrollens warten und mehrfach nachmessen,
      // damit die Endposition (nicht eine Zwischenposition) verwendet wird.
      for (let i = 0; i < 8; i++) {
        await wait(90);
        const r = await measureNode(ref);
        if (r) {
          rect = r;
          if (Math.abs(r.y - desiredY) < 24) break;
        }
      }
    }
    return rect;
  }, []);

  return (
    <TourContext.Provider value={{ registerTarget, unregisterTarget, setScroller, measure, focus }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour muss innerhalb von TourProvider verwendet werden.');
  return ctx;
}

/** Registriert ein Element als Tour-Ziel und liefert die anzuhängende Ref. */
export function useTourTarget(id: string): RefObject<View> {
  const ref = useRef<View>(null);
  const { registerTarget, unregisterTarget } = useTour();
  useEffect(() => {
    registerTarget(id, ref);
    return () => unregisterTarget(id);
  }, [id, registerTarget, unregisterTarget]);
  return ref;
}
