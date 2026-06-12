import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import he from './he.json';
import en from './en.json';

export type Lang = 'he' | 'en';
export type Dir = 'rtl' | 'ltr';

type Dict = Record<string, unknown>;
const DICTS: Record<Lang, Dict> = { he, en };
const STORAGE_KEY = 'ld-lang';

// שליפת ערך לפי נתיב מנוקד (a.b.c) מתוך מילון מקונן
function resolve(dict: Dict, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Dict)) return (acc as Dict)[key];
    return undefined;
  }, dict);
}

interface I18nValue {
  lang: Lang;
  dir: Dir;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  /** טקסט בודד עם החלפת משתנים {name} */
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** רשימת טקסטים (למערכים במילון) */
  tList: (key: string) => string[];
}

const I18nContext = createContext<I18nValue | null>(null);

function getInitialLang(): Lang {
  if (typeof window === 'undefined') return 'he';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'he' || saved === 'en') return saved;
  return 'he';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);
  const dir: Dir = lang === 'he' ? 'rtl' : 'ltr';

  // עדכון lang / dir / meta בכל החלפת שפה (חשוב לנגישות ול-SEO)
  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = dir;
    const title = resolve(DICTS[lang], 'meta.title');
    if (typeof title === 'string') document.title = title;
    const desc = resolve(DICTS[lang], 'meta.description');
    if (typeof desc === 'string') {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', 'description');
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', desc);
    }
  }, [lang, dir]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* localStorage לא זמין — מתעלמים */
    }
  }, []);

  const toggleLang = useCallback(() => setLang(lang === 'he' ? 'en' : 'he'), [lang, setLang]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const raw = resolve(DICTS[lang], key) ?? resolve(DICTS.he, key);
      let str = typeof raw === 'string' ? raw : key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.split(`{${k}}`).join(String(v));
        }
      }
      return str;
    },
    [lang]
  );

  const tList = useCallback(
    (key: string) => {
      const raw = resolve(DICTS[lang], key) ?? resolve(DICTS.he, key);
      return Array.isArray(raw) ? (raw as string[]) : [];
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, dir, setLang, toggleLang, t, tList }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
