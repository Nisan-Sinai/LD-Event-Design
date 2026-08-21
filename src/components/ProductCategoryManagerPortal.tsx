import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Check, FolderPlus, Pencil, RotateCcw, Save, Trash2 } from 'lucide-react';
import {
  categoryOverrideForRecord,
  createProductCategoryOverride,
  getShopProductCategoryRecords,
  type ShopProductCategoryRecord
} from '../catalog/shopProducts';
import { useI18n } from '../i18n/i18n';
import { usePackages } from '../packages/PackagesProvider';

const COPY = {
  he: {
    title: 'ניהול קטגוריות',
    subtitle: 'אפשר להוסיף קטגוריה חדשה, לשנות שם או למחוק קטגוריה מהחנות.',
    addPlaceholder: 'שם קטגוריה חדשה',
    add: 'הוספת קטגוריה',
    rename: 'שינוי שם',
    save: 'שמירת שם',
    delete: 'מחיקת קטגוריה',
    restore: 'שחזור קטגוריה',
    deletedTitle: 'קטגוריות שנמחקו',
    duplicate: 'כבר קיימת קטגוריה בשם הזה.',
    required: 'יש להזין שם קטגוריה.',
    failed: 'הפעולה נכשלה. נסו שוב.',
    saved: 'נשמר',
    deletingConfirm: 'למחוק את הקטגוריה? היא תיעלם מהחנות. המוצרים שלה יישארו בניהול כדי שתוכלו להעביר אותם לקטגוריה אחרת.'
  },
  en: {
    title: 'Category management',
    subtitle: 'Add a new category, rename an existing one or remove it from the shop.',
    addPlaceholder: 'New category name',
    add: 'Add category',
    rename: 'Rename',
    save: 'Save name',
    delete: 'Delete category',
    restore: 'Restore category',
    deletedTitle: 'Deleted categories',
    duplicate: 'A category with this name already exists.',
    required: 'Enter a category name.',
    failed: 'The action failed. Please try again.',
    saved: 'Saved',
    deletingConfirm: 'Delete this category? It will disappear from the shop. Its products will remain in admin so they can be reassigned.'
  }
} as const;

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function CategoryManager() {
  const { lang } = useI18n();
  const copy = COPY[lang];
  const { overrides, saveOverride } = usePackages();
  const records = useMemo(() => getShopProductCategoryRecords(overrides, true), [overrides]);
  const activeRecords = records.filter((record) => !record.hidden);
  const deletedRecords = records.filter((record) => record.hidden);
  const [newName, setNewName] = useState('');
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);

  const nameExists = (name: string, exceptId?: string) => {
    const normalized = normalizeName(name).toLocaleLowerCase(lang === 'he' ? 'he-IL' : 'en-US');
    return activeRecords.some((record) =>
      record.id !== exceptId && normalizeName(record.name).toLocaleLowerCase(lang === 'he' ? 'he-IL' : 'en-US') === normalized
    );
  };

  const run = async (id: string, action: () => Promise<void>) => {
    setBusyId(id);
    setError('');
    try {
      await action();
      setSavedId(id);
      window.setTimeout(() => setSavedId((current) => (current === id ? null : current)), 1600);
    } catch {
      setError(copy.failed);
    } finally {
      setBusyId((current) => (current === id ? null : current));
    }
  };

  const addCategory = () => {
    const name = normalizeName(newName);
    if (!name) {
      setError(copy.required);
      return;
    }
    if (nameExists(name)) {
      setError(copy.duplicate);
      return;
    }
    void run('__new_category__', async () => {
      await saveOverride(createProductCategoryOverride(name));
      setNewName('');
    });
  };

  const renameCategory = (record: ShopProductCategoryRecord) => {
    const name = normalizeName(draftNames[record.id] ?? record.name);
    if (!name) {
      setError(copy.required);
      return;
    }
    if (nameExists(name, record.id)) {
      setError(copy.duplicate);
      return;
    }
    if (name === record.name) return;

    const aliases = [...record.aliases, record.name]
      .map(normalizeName)
      .filter((alias) => alias && alias !== name && alias !== record.sourceName);

    void run(record.id, async () => {
      await saveOverride(categoryOverrideForRecord(record, overrides, name, false, aliases));
      setDraftNames((current) => {
        const next = { ...current };
        delete next[record.id];
        return next;
      });
    });
  };

  const deleteCategory = (record: ShopProductCategoryRecord) => {
    if (!window.confirm(copy.deletingConfirm)) return;
    void run(record.id, () => saveOverride(categoryOverrideForRecord(record, overrides, record.name, true)));
  };

  const restoreCategory = (record: ShopProductCategoryRecord) => {
    if (nameExists(record.name, record.id)) {
      setError(copy.duplicate);
      return;
    }
    void run(record.id, () => saveOverride(categoryOverrideForRecord(record, overrides, record.name, false)));
  };

  const inputClass = 'w-full min-w-0 rounded-xl border border-[#DDD2C1] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#B29259] focus:ring-2 focus:ring-[#B29259]/20';

  return (
    <section className="mt-6 rounded-3xl border border-[#EAE3D2] bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-[#FAF7F2] p-2.5 text-[#8C6D3F]"><FolderPlus className="h-5 w-5" aria-hidden="true" /></div>
        <div>
          <h3 className="text-lg font-extrabold text-[#8C6D3F]">{copy.title}</h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-gray-500">{copy.subtitle}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') addCategory();
          }}
          placeholder={copy.addPlaceholder}
          aria-label={copy.addPlaceholder}
          className={inputClass}
        />
        <button
          type="button"
          onClick={addCategory}
          disabled={busyId === '__new_category__'}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#8C6D3F] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
        >
          <FolderPlus className="h-4 w-4" aria-hidden="true" />
          {copy.add}
        </button>
      </div>

      {error && <p role="alert" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-red-600"><AlertCircle className="h-4 w-4" aria-hidden="true" />{error}</p>}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {activeRecords.map((record) => {
          const draftName = draftNames[record.id] ?? record.name;
          const changed = normalizeName(draftName) !== record.name;
          const busy = busyId === record.id;
          return (
            <div key={record.id} className="rounded-2xl border border-[#EAE3D2] bg-[#FAF7F2] p-3">
              <label className="block">
                <span className="mb-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-gray-600"><Pencil className="h-3.5 w-3.5" aria-hidden="true" />{copy.rename}</span>
                <input
                  value={draftName}
                  onChange={(event) => setDraftNames((current) => ({ ...current, [record.id]: event.target.value }))}
                  className={inputClass}
                />
              </label>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => renameCategory(record)}
                  disabled={busy || !changed}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#B29259] px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
                >
                  {savedId === record.id ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Save className="h-3.5 w-3.5" aria-hidden="true" />}
                  {savedId === record.id ? copy.saved : copy.save}
                </button>
                <button
                  type="button"
                  onClick={() => deleteCategory(record)}
                  disabled={busy || activeRecords.length <= 1}
                  className="inline-flex items-center gap-1.5 rounded-xl px-2 py-2 text-xs font-bold text-red-600 disabled:opacity-35"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {copy.delete}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {deletedRecords.length > 0 && (
        <div className="mt-6 border-t border-[#EAE3D2] pt-4">
          <h4 className="text-xs font-extrabold text-gray-500">{copy.deletedTitle}</h4>
          <div className="mt-3 flex flex-wrap gap-2">
            {deletedRecords.map((record) => (
              <button
                key={record.id}
                type="button"
                onClick={() => restoreCategory(record)}
                disabled={busyId === record.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#EAE3D2] bg-white px-3 py-2 text-xs font-bold text-gray-600 disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                {copy.restore}: {record.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function ProductCategoryManagerPortal() {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const syncTarget = () => setTarget(document.getElementById('admin-products'));
    syncTarget();

    if (typeof MutationObserver === 'undefined') return undefined;
    const observer = new MutationObserver(syncTarget);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  if (!target) return null;

  return createPortal(
    <>
      <style>{'#admin-products button:has(.lucide-rotate-ccw){display:none!important} #admin-products [data-category-restore] .lucide-rotate-ccw{display:inline-block!important}'}</style>
      <CategoryManager />
    </>,
    target
  );
}
