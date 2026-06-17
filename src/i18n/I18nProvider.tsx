import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_LOCALE,
  TRANSLATIONS,
  type Locale,
} from './translations';

const STORAGE_KEY = 'famii.locale';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Übersetzt einen Punkt-Schlüssel; fällt auf Englisch, dann auf den Key zurück. */
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

/** Geräte-/Browsersprache erkennen (fehlertolerant). Deutsch → de, sonst en. */
function detectDeviceLocale(): Locale {
  try {
    let lang = '';
    const nav =
      typeof navigator !== 'undefined'
        ? (navigator as unknown as { language?: string; languages?: readonly string[] })
        : undefined;
    if (nav) {
      lang = nav.language || nav.languages?.[0] || '';
    }
    if (!lang && typeof Intl !== 'undefined') {
      try {
        lang = Intl.DateTimeFormat().resolvedOptions().locale;
      } catch {
        /* ignore */
      }
    }
    return lang.toLowerCase().startsWith('de') ? 'de' : 'en';
  } catch {
    return DEFAULT_LOCALE;
  }
}

function lookup(dict: Record<string, unknown>, key: string): string | undefined {
  const parts = key.split('.');
  let cur: unknown = dict;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return typeof cur === 'string' ? cur : undefined;
}

function interpolate(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function I18nProvider({ children }: { children: ReactNode }) {
  // Sofort eine sinnvolle Sprache (Geräteerkennung); gespeicherte Wahl folgt async.
  const [locale, setLocaleState] = useState<Locale>(() => detectDeviceLocale());

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'de' || saved === 'en') setLocaleState(saved);
      })
      .catch(() => undefined);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const t = useCallback<I18nContextValue['t']>(
    (key, vars) => {
      const val =
        lookup(TRANSLATIONS[locale], key) ??
        lookup(TRANSLATIONS.en, key) ??
        key;
      return interpolate(val, vars);
    },
    [locale],
  );

  const value = useMemo<I18nContextValue>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n muss innerhalb von I18nProvider verwendet werden.');
  return ctx;
}
