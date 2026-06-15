import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { listMyFamilies } from '@/api/families';
import { qk } from '@/api/queryKeys';
import { useAuth } from './AuthContext';
import type { Family, MemberRole } from '@/types/models';

const ACTIVE_FAMILY_KEY = 'foreverly.activeFamilyId';

interface FamilyContextValue {
  families: { family: Family; role: MemberRole }[];
  activeFamily: Family | null;
  activeRole: MemberRole | null;
  isAdmin: boolean;
  loading: boolean;
  setActiveFamily: (familyId: string) => void;
  refetch: () => void;
}

const FamilyContext = createContext<FamilyContextValue | undefined>(undefined);

export function FamilyProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: qk.families(),
    queryFn: listMyFamilies,
    enabled: !!userId,
  });

  const families = useMemo(() => data ?? [], [data]);

  // Zuletzt gewählte Familie wiederherstellen.
  useEffect(() => {
    AsyncStorage.getItem(ACTIVE_FAMILY_KEY).then((stored) => {
      setActiveId(stored);
      setRestored(true);
    });
  }, []);

  // Falls keine/ungültige Auswahl: erste Familie wählen.
  useEffect(() => {
    if (!restored || families.length === 0) return;
    const stillMember = families.some((f) => f.family.id === activeId);
    if (!activeId || !stillMember) {
      const first = families[0];
      if (first) {
        setActiveId(first.family.id);
        AsyncStorage.setItem(ACTIVE_FAMILY_KEY, first.family.id);
      }
    }
  }, [restored, families, activeId]);

  const setActiveFamily = useCallback((familyId: string) => {
    setActiveId(familyId);
    AsyncStorage.setItem(ACTIVE_FAMILY_KEY, familyId);
  }, []);

  const activeEntry = families.find((f) => f.family.id === activeId) ?? null;

  const value = useMemo<FamilyContextValue>(
    () => ({
      families,
      activeFamily: activeEntry?.family ?? null,
      activeRole: activeEntry?.role ?? null,
      isAdmin: activeEntry?.role === 'admin',
      // Solange Familien existieren, aber die aktive Familie noch nicht
      // gesetzt ist (Effekt läuft erst nach dem Render), weiter laden lassen –
      // sonst rendern Screens mit activeFamily === null.
      loading: isLoading || !restored || (families.length > 0 && !activeEntry),
      setActiveFamily,
      refetch,
    }),
    [families, activeEntry, isLoading, restored, setActiveFamily, refetch],
  );

  return (
    <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>
  );
}

export function useFamily(): FamilyContextValue {
  const ctx = useContext(FamilyContext);
  if (!ctx)
    throw new Error('useFamily muss innerhalb von FamilyProvider verwendet werden.');
  return ctx;
}
