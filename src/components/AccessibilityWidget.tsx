import { useEffect, useState } from 'react';
import { Accessibility, X, Plus, Minus, Contrast, Link2, Type, RotateCcw, FileText } from 'lucide-react';
import { useI18n } from '../i18n/i18n';

interface A11ySettings {
  fontScale: number;
  contrast: boolean;
  links: boolean;
  readable: boolean;
}

const DEFAULTS: A11ySettings = { fontScale: 1, contrast: false, links: false, readable: false };
const STORAGE_KEY = 'ld-a11y';

function loadSettings(): A11ySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<A11ySettings>) };
  } catch {
    /* localStorage לא זמין */
  }
  return DEFAULTS;
}

export function AccessibilityWidget({ onOpenStatement }: { onOpenStatement: () => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<A11ySettings>(loadSettings);

  // החלת ההגדרות על הדף + שמירה
  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = settings.fontScale === 1 ? '' : `${Math.round(settings.fontScale * 100)}%`;
    document.body.classList.toggle('a11y-contrast', settings.contrast);
    document.body.classList.toggle('a11y-links', settings.links);
    document.body.classList.toggle('a11y-readable', settings.readable);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* localStorage לא זמין */
    }
  }, [settings]);

  // סגירה ב-Esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const changeFont = (delta: number) =>
    setSettings((p) => ({ ...p, fontScale: Math.min(1.5, Math.max(0.9, +(p.fontScale + delta).toFixed(2))) }));
  const toggle = (key: 'contrast' | 'links' | 'readable') =>
    setSettings((p) => ({ ...p, [key]: !p[key] }));

  const itemClass = (active: boolean) =>
    `flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-[11px] font-bold transition-colors ${
      active ? 'bg-[#B29259] text-white border-[#B29259]' : 'bg-[#FAF7F2] text-gray-700 border-[#EAE3D2] hover:border-[#B29259]'
    }`;

  return (
    <div className="fixed bottom-4 start-4 z-[110] no-print">
      {open && (
        <div
          role="dialog"
          aria-label={t('a11yWidget.title')}
          className="absolute bottom-14 start-0 w-64 bg-white rounded-2xl shadow-xl border border-[#EAE3D2] p-3"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="font-bold text-sm text-[#8C6D3F] flex items-center gap-1.5">
              <Accessibility className="w-4 h-4" aria-hidden="true" />
              {t('a11yWidget.title')}
            </span>
            <button type="button" onClick={() => setOpen(false)} aria-label={t('legal.close')} className="text-gray-400 hover:text-gray-700">
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => changeFont(0.1)} className={itemClass(settings.fontScale > 1)}>
              <Plus className="w-4 h-4" aria-hidden="true" />
              {t('a11yWidget.increaseFont')}
            </button>
            <button type="button" onClick={() => changeFont(-0.1)} className={itemClass(settings.fontScale < 1)}>
              <Minus className="w-4 h-4" aria-hidden="true" />
              {t('a11yWidget.decreaseFont')}
            </button>
            <button type="button" onClick={() => toggle('contrast')} aria-pressed={settings.contrast} className={itemClass(settings.contrast)}>
              <Contrast className="w-4 h-4" aria-hidden="true" />
              {t('a11yWidget.contrast')}
            </button>
            <button type="button" onClick={() => toggle('links')} aria-pressed={settings.links} className={itemClass(settings.links)}>
              <Link2 className="w-4 h-4" aria-hidden="true" />
              {t('a11yWidget.links')}
            </button>
            <button type="button" onClick={() => toggle('readable')} aria-pressed={settings.readable} className={itemClass(settings.readable)}>
              <Type className="w-4 h-4" aria-hidden="true" />
              {t('a11yWidget.readable')}
            </button>
            <button type="button" onClick={() => setSettings(DEFAULTS)} className={itemClass(false)}>
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              {t('a11yWidget.reset')}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onOpenStatement();
              setOpen(false);
            }}
            className="mt-2.5 w-full flex items-center justify-center gap-1.5 bg-[#8C6D3F] hover:bg-[#705630] text-white py-2 rounded-xl text-[11px] font-bold"
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            {t('a11yWidget.statement')}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={t('a11yWidget.open')}
        className="w-12 h-12 rounded-full bg-[#B29259] hover:bg-[#8C6D3F] text-white shadow-lg flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#8C6D3F]"
      >
        <Accessibility className="w-6 h-6" aria-hidden="true" />
      </button>
    </div>
  );
}
