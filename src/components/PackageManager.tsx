import { useState } from 'react';
import { Save, RotateCcw, Eye, EyeOff, AlertCircle, Package as PackageIcon, Plus, Trash2, ImagePlus, X } from 'lucide-react';
import { useI18n } from '../i18n/i18n';
import { usePackages } from '../packages/PackagesProvider';
import { isSupabaseConfigured } from '../lib/supabase';
import { categoryLabel } from '../i18n/content';
import { PACKAGES, CATEGORIES } from '../App';
import { uploadPackageImage, type PackageOverride } from '../lib/packages';

interface Draft {
  title: string;
  subtitle: string;
  description: string;
  benefits: string;
  price: string;
  image_url: string;
  category: string;
}

interface Item {
  id: string;
  isCustom: boolean;
  current: Draft;
  hidden: boolean;
  hasOverride: boolean;
  pricingTiers: Record<number, number> | null;
  svgType: string | null;
}

const EMPTY_NEW: Draft = { title: '', subtitle: '', description: '', benefits: '', price: '', image_url: '', category: '' };

const strOrNull = (v: string) => (v.trim() === '' ? null : v.trim());
const numOrNull = (v: string) => (v.trim() === '' ? null : Math.max(0, Number(v) || 0));

/**
 * ניהול קטלוג מלא בידי המנהל — עריכת כל השדות (כולל תמונה), הסתרה,
 * הוספת חבילות חדשות ומחיקה. נשמר ב-Supabase (כתיבה למנהל בלבד ב-RLS).
 */
export function PackageManager() {
  const { t, lang } = useI18n();
  const { overrides, saveOverride, removeOverride } = usePackages();
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newDraft, setNewDraft] = useState<Draft>(EMPTY_NEW);

  if (!isSupabaseConfigured) return null;

  const baseItems: Item[] = PACKAGES.map((p) => {
    const o = overrides[p.id];
    return {
      id: p.id,
      isCustom: false,
      current: {
        title: o?.title ?? p.title,
        subtitle: o?.subtitle ?? p.subtitle,
        description: o?.description ?? p.description,
        benefits: o?.benefits ?? p.benefits,
        price: String(o?.price ?? p.price),
        image_url: o?.image_url ?? '',
        category: p.category
      },
      hidden: o?.hidden ?? false,
      hasOverride: !!o,
      pricingTiers: o?.pricing_tiers ?? p.pricingTiers ?? null,
      svgType: p.svgType
    };
  });

  const customItems: Item[] = Object.values(overrides)
    .filter((o) => o.is_custom)
    .map((o) => ({
      id: o.package_id,
      isCustom: true,
      current: {
        title: o.title ?? '',
        subtitle: o.subtitle ?? '',
        description: o.description ?? '',
        benefits: o.benefits ?? '',
        price: String(o.price ?? 0),
        image_url: o.image_url ?? '',
        category: o.category ?? ''
      },
      hidden: o.hidden,
      hasOverride: true,
      pricingTiers: o.pricing_tiers ?? null,
      svgType: o.svg_type ?? null
    }));

  const items = [...baseItems, ...customItems];

  const draftFor = (item: Item): Draft => drafts[item.id] ?? item.current;
  const setField = (item: Item, field: keyof Draft, value: string) =>
    setDrafts((prev) => ({ ...prev, [item.id]: { ...draftFor(item), [field]: value } }));

  const isDirty = (item: Item) => {
    const d = drafts[item.id];
    if (!d) return false;
    return (Object.keys(item.current) as (keyof Draft)[]).some((k) => d[k] !== item.current[k]);
  };

  const buildOverride = (item: Item, d: Draft, hidden: boolean): PackageOverride => ({
    package_id: item.id,
    price: numOrNull(d.price),
    title: strOrNull(d.title),
    subtitle: strOrNull(d.subtitle),
    description: strOrNull(d.description),
    benefits: strOrNull(d.benefits),
    image_url: strOrNull(d.image_url),
    category: item.isCustom ? strOrNull(d.category) : null,
    svg_type: item.svgType,
    pricing_tiers: item.pricingTiers,
    hidden,
    is_custom: item.isCustom,
    sort_order: null
  });

  const run = async (id: string, action: () => Promise<void>) => {
    setBusyId(id);
    setErrorId(null);
    try {
      await action();
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setSavedId(id);
      setTimeout(() => setSavedId((cur) => (cur === id ? null : cur)), 2000);
    } catch {
      setErrorId(id);
    } finally {
      setBusyId((cur) => (cur === id ? null : cur));
    }
  };

  const save = (item: Item) => run(item.id, () => saveOverride(buildOverride(item, draftFor(item), item.hidden)));
  const toggleHidden = (item: Item) => run(item.id, () => saveOverride(buildOverride(item, draftFor(item), !item.hidden)));
  const removeItem = (item: Item) => run(item.id, () => removeOverride(item.id));

  const pickImage = async (id: string, file: File | undefined, apply: (url: string) => void) => {
    if (!file) return;
    setUploadingId(id);
    setErrorId(null);
    try {
      apply(await uploadPackageImage(file));
    } catch {
      setErrorId(id);
    } finally {
      setUploadingId((cur) => (cur === id ? null : cur));
    }
  };

  const createPackage = async () => {
    if (!newDraft.category || !newDraft.title.trim() || newDraft.price.trim() === '') {
      setErrorId('__new__');
      return;
    }
    const id = `custom-${crypto.randomUUID().slice(0, 8)}`;
    await run('__new__', () =>
      saveOverride({
        package_id: id,
        price: numOrNull(newDraft.price),
        title: strOrNull(newDraft.title),
        subtitle: strOrNull(newDraft.subtitle),
        description: strOrNull(newDraft.description),
        benefits: strOrNull(newDraft.benefits),
        image_url: strOrNull(newDraft.image_url),
        category: newDraft.category,
        svg_type: null,
        pricing_tiers: null,
        hidden: false,
        is_custom: true,
        sort_order: Date.now()
      })
    );
    setNewDraft(EMPTY_NEW);
    setShowAdd(false);
  };

  const inputCls = 'w-full px-3 py-2 bg-[#FAF7F2] border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#B29259]';
  const labelCls = 'block text-[10px] font-bold text-gray-500 mb-1';

  const imageControl = (id: string, url: string, onUrl: (u: string) => void) => (
    <div>
      <label className={labelCls}>{t('packageManager.image')}</label>
      <div className="flex items-center gap-2">
        {url ? (
          <div className="relative">
            <img src={url} alt="" className="h-12 w-16 object-cover rounded-md border border-[#EAE3D2]" />
            <button type="button" onClick={() => onUrl('')} aria-label={t('packageManager.removeImage')} className="absolute -top-1.5 -end-1.5 bg-white border border-gray-200 rounded-full p-0.5 text-gray-400 hover:text-red-500 shadow-sm">
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : null}
        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-[#8C6D3F] border border-dashed border-[#B29259]/50 hover:border-[#B29259] rounded-lg px-2.5 py-2 transition-colors">
          <ImagePlus className="w-3.5 h-3.5" aria-hidden="true" />
          {uploadingId === id ? t('packageManager.uploading') : t('packageManager.uploadImage')}
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => { void pickImage(id, e.target.files?.[0], onUrl); e.target.value = ''; }} />
        </label>
      </div>
    </div>
  );

  return (
    <section className="bg-white border border-[#EAE3D2] rounded-2xl p-5 mb-6">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex items-start gap-2">
          <PackageIcon className="w-5 h-5 text-[#B29259] mt-0.5" aria-hidden="true" />
          <div>
            <h3 className="text-base font-bold text-[#8C6D3F]">{t('packageManager.title')}</h3>
            <p className="text-xs text-gray-500">{t('packageManager.subtitle')}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="shrink-0 flex items-center gap-1.5 bg-[#8C6D3F] hover:bg-[#705630] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          {t('packageManager.addPackage')}
        </button>
      </div>

      {/* טופס הוספת חבילה חדשה */}
      {showAdd && (
        <div className="mt-4 rounded-xl border border-[#B29259]/40 bg-[#FAF7F2] p-4 space-y-3 animate-fadeIn">
          <p className="text-sm font-bold text-[#8C6D3F]">{t('packageManager.newPackage')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>{t('packageManager.category')}</label>
              <select value={newDraft.category} onChange={(e) => setNewDraft({ ...newDraft, category: e.target.value })} className={inputCls}>
                <option value="">—</option>
                {Object.values(CATEGORIES).map((c) => (
                  <option key={c} value={c}>{categoryLabel(c, lang)}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className={labelCls}>{t('packageManager.titleField')}</label>
              <input type="text" value={newDraft.title} onChange={(e) => setNewDraft({ ...newDraft, title: e.target.value })} className={inputCls} />
            </div>
            <div className="sm:col-span-1">
              <label className={labelCls}>{t('packageManager.price')}</label>
              <input type="number" min="0" value={newDraft.price} onChange={(e) => setNewDraft({ ...newDraft, price: e.target.value })} className={`${inputCls} text-center`} />
            </div>
            <div className="sm:col-span-3">
              <label className={labelCls}>{t('packageManager.subtitleField')}</label>
              <input type="text" value={newDraft.subtitle} onChange={(e) => setNewDraft({ ...newDraft, subtitle: e.target.value })} className={inputCls} />
            </div>
            <div className="sm:col-span-3">
              <label className={labelCls}>{t('packageManager.benefitsField')}</label>
              <input type="text" value={newDraft.benefits} onChange={(e) => setNewDraft({ ...newDraft, benefits: e.target.value })} className={inputCls} />
            </div>
            <div className="sm:col-span-6">
              <label className={labelCls}>{t('packageManager.descriptionField')}</label>
              <textarea rows={2} value={newDraft.description} onChange={(e) => setNewDraft({ ...newDraft, description: e.target.value })} className={inputCls} />
            </div>
            <div className="sm:col-span-6">
              {imageControl('__new__', newDraft.image_url, (u) => setNewDraft({ ...newDraft, image_url: u }))}
            </div>
          </div>
          <p className="text-[10px] text-gray-400">{t('packageManager.requiredNote')}</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => void createPackage()} disabled={busyId === '__new__'} className="flex items-center gap-1.5 bg-[#B29259] hover:bg-[#8C6D3F] disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              {t('packageManager.create')}
            </button>
            <button type="button" onClick={() => { setShowAdd(false); setNewDraft(EMPTY_NEW); }} className="text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold">
              {t('packageManager.cancel')}
            </button>
            {errorId === '__new__' && (
              <span className="flex items-center gap-1 text-[11px] text-red-500 font-bold">
                <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                {t('packageManager.requiredNote')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* רשימת החבילות לעריכה */}
      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const d = draftFor(item);
          const busy = busyId === item.id;
          const aria = (field: string) => `${field} — ${item.current.title || item.id}`;
          return (
            <div key={item.id} className={`rounded-xl border p-3 ${item.hidden ? 'border-gray-200 bg-gray-50 opacity-80' : 'border-[#EAE3D2] bg-white'}`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{item.current.category ? categoryLabel(item.current.category, lang) : '—'}</span>
                <div className="flex items-center gap-1.5">
                  {item.isCustom && <span className="text-[10px] font-bold text-[#8C6D3F] bg-[#FAF7F2] px-2 py-0.5 rounded-full">{t('packageManager.customBadge')}</span>}
                  {item.hidden && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{t('packageManager.hiddenBadge')}</span>}
                  {!item.hidden && !item.isCustom && item.hasOverride && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{t('packageManager.editedBadge')}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                <div className="sm:col-span-3">
                  <label className={labelCls}>{t('packageManager.titleField')}</label>
                  <input type="text" value={d.title} aria-label={aria(t('packageManager.titleField'))} onChange={(e) => setField(item, 'title', e.target.value)} className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>{t('packageManager.subtitleField')}</label>
                  <input type="text" value={d.subtitle} aria-label={aria(t('packageManager.subtitleField'))} onChange={(e) => setField(item, 'subtitle', e.target.value)} className={inputCls} />
                </div>
                <div className="sm:col-span-1">
                  <label className={labelCls}>{t('packageManager.price')}</label>
                  <input type="number" min="0" value={d.price} aria-label={aria(t('packageManager.price'))} onChange={(e) => setField(item, 'price', e.target.value)} className={`${inputCls} text-center`} />
                </div>
                <div className="sm:col-span-6">
                  <label className={labelCls}>{t('packageManager.descriptionField')}</label>
                  <textarea rows={2} value={d.description} aria-label={aria(t('packageManager.descriptionField'))} onChange={(e) => setField(item, 'description', e.target.value)} className={inputCls} />
                </div>
                <div className="sm:col-span-3">
                  <label className={labelCls}>{t('packageManager.benefitsField')}</label>
                  <input type="text" value={d.benefits} aria-label={aria(t('packageManager.benefitsField'))} onChange={(e) => setField(item, 'benefits', e.target.value)} className={inputCls} />
                </div>
                <div className="sm:col-span-3">
                  {imageControl(item.id, d.image_url, (u) => setField(item, 'image_url', u))}
                </div>
              </div>

              {item.pricingTiers && <p className="text-[10px] text-gray-400 mt-1.5">{t('packageManager.tierNote')}</p>}

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <button type="button" onClick={() => save(item)} disabled={busy || !isDirty(item)} className="flex items-center gap-1.5 bg-[#B29259] hover:bg-[#8C6D3F] disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                  <Save className="w-3.5 h-3.5" aria-hidden="true" />
                  {busy ? t('packageManager.saving') : savedId === item.id ? t('packageManager.saved') : t('packageManager.save')}
                </button>

                <button type="button" onClick={() => toggleHidden(item)} disabled={busy} className="flex items-center gap-1.5 border border-gray-200 hover:border-[#B29259] text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-40">
                  {item.hidden ? <Eye className="w-3.5 h-3.5" aria-hidden="true" /> : <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />}
                  {item.hidden ? t('packageManager.show') : t('packageManager.hide')}
                </button>

                {item.isCustom ? (
                  <button type="button" onClick={() => removeItem(item)} disabled={busy} className="flex items-center gap-1.5 text-red-500 hover:text-red-700 px-2 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-40">
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    {t('packageManager.delete')}
                  </button>
                ) : (
                  item.hasOverride && (
                    <button type="button" onClick={() => removeItem(item)} disabled={busy} className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 px-2 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-40">
                      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                      {t('packageManager.reset')}
                    </button>
                  )
                )}

                {errorId === item.id && (
                  <span className="flex items-center gap-1 text-[11px] text-red-500 font-bold">
                    <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    {t('packageManager.saveError')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
