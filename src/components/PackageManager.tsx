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
  image_url_2: string;
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

const EMPTY_NEW: Draft = {
  title: '',
  subtitle: '',
  description: '',
  benefits: '',
  price: '',
  image_url: '',
  image_url_2: '',
  category: ''
};

const strOrNull = (v: string) => (v.trim() === '' ? null : v.trim());
const numOrNull = (v: string) => (v.trim() === '' ? null : Math.max(0, Number(v) || 0));

/**
 * ניהול קטלוג מלא בידי המנהל — עריכת כל השדות, שתי תמונות, הסתרה,
 * הוספת חבילות חדשות ומחיקה. נשמר ב-Supabase (כתיבה למנהל בלבד ב-RLS).
 */
export function PackageManager() {
  const { t, lang } = useI18n();
  const { overrides, saveOverride, saveImage, removeOverride } = usePackages();
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [imageDrafts, setImageDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newDraft, setNewDraft] = useState<Draft>(EMPTY_NEW);

  if (!isSupabaseConfigured) return null;

  const imageSavedLabel = lang === 'he' ? '✅ שמור' : '✅ Saved';
  const imageSaveLabel = lang === 'he' ? '✅ שמור' : '✅ Save';
  const imageUndoLabel = lang === 'he' ? '↩️ חזור בלי לשמור' : '↩️ Revert without saving';

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
        image_url_2: o?.image_url_2 ?? '',
        category: p.category
      },
      hidden: o?.hidden ?? false,
      hasOverride: !!o,
      pricingTiers: o?.pricing_tiers ?? p.pricingTiers ?? null,
      svgType: p.svgType
    };
  });

  const customItems: Item[] = Object.values(overrides)
    .filter((o) => o.is_custom && !o.package_id.startsWith('product-'))
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
        image_url_2: o.image_url_2 ?? '',
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
    image_url_2: strOrNull(d.image_url_2),
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

  const persistImage = async (item: Item, imageUrl: string, slot: 1 | 2) => {
    const key = `${item.id}:${slot}`;
    setBusyId(key);
    setErrorId(null);
    try {
      await (slot === 1
        ? saveImage(item.id, strOrNull(imageUrl))
        : saveImage(item.id, strOrNull(imageUrl), 2));
      setSavedId(key);
      setTimeout(() => setSavedId((cur) => (cur === key ? null : cur)), 2000);
    } catch {
      setErrorId(item.id);
    } finally {
      setBusyId((cur) => (cur === key ? null : cur));
    }
  };

  const pickImage = async (
    uploadKey: string,
    file: File | undefined,
    apply: (url: string) => void,
    item?: Item
  ) => {
    if (!file) return;
    setUploadingId(uploadKey);
    setErrorId(null);
    try {
      const url = await uploadPackageImage(file);
      apply(url);
    } catch {
      setErrorId(item?.id ?? '__new__');
    } finally {
      setUploadingId((cur) => (cur === uploadKey ? null : cur));
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
        image_url_2: strOrNull(newDraft.image_url_2),
        category: newDraft.category,
        svg_type: null,
        pricing_tiers: null,
        hidden: false,
        is_custom: true,
        sort_order: Date.now()
      }, { includeImage: true })
    );
    setNewDraft(EMPTY_NEW);
    setShowAdd(false);
  };

  const inputCls = 'w-full px-3 py-2 bg-[#FAF7F2] border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#B29259]';
  const labelCls = 'block text-[10px] font-bold text-gray-500 mb-1';

  const imageControl = (
    uploadKey: string,
    url: string,
    onUrl: (u: string) => void,
    slot: 1 | 2,
    item?: Item
  ) => {
    const savedUrl = item ? (slot === 1 ? item.current.image_url : item.current.image_url_2) : url;
    const displayUrl = item ? imageDrafts[uploadKey] ?? savedUrl : url;
    const changed = Boolean(item && displayUrl !== savedUrl);
    const imageBusy = busyId === uploadKey;

    const setDisplayUrl = (nextUrl: string) => {
      if (!item) {
        onUrl(nextUrl);
        return;
      }
      setImageDrafts((current) => ({ ...current, [uploadKey]: nextUrl }));
    };

    const undoImage = () => {
      if (!item) return;
      setImageDrafts((current) => {
        const next = { ...current };
        delete next[uploadKey];
        return next;
      });
    };

    return (
      <div className="min-w-0 rounded-xl border border-[#EAE3D2] bg-[#FAF7F2] p-2.5">
        <label className={labelCls}>{t('packageManager.image')} {slot}</label>
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-[#EAE3D2] bg-white">
          {displayUrl ? (
            <>
              <img src={displayUrl} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setDisplayUrl('')}
                aria-label={slot === 1 ? t('packageManager.removeImage') : `${t('packageManager.removeImage')} 2`}
                className="absolute end-1.5 top-1.5 rounded-full border border-gray-200 bg-white/95 p-1 text-gray-400 shadow-sm hover:text-red-500"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </>
          ) : (
            <ImagePlus className="h-6 w-6 text-[#B29259]/50" aria-hidden="true" />
          )}
        </div>
        <label className="mt-2 flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#B29259]/50 px-2 py-2 text-[10px] font-bold text-[#8C6D3F] transition-colors hover:border-[#B29259] hover:bg-white">
          <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
          {uploadingId === uploadKey ? t('packageManager.uploading') : `${t('packageManager.uploadImage')} ${slot}`}
          <input
            type="file"
            accept="image/*,.heic,.heif"
            className="sr-only"
            aria-label={`${t('packageManager.uploadImage')} ${slot}`}
            disabled={uploadingId === uploadKey || imageBusy}
            onChange={(e) => {
              void pickImage(uploadKey, e.target.files?.[0], setDisplayUrl, item);
              e.target.value = '';
            }}
          />
        </label>

        {item && (
          changed ? (
            <div className="mt-2 grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => void persistImage(item, displayUrl, slot)}
                disabled={imageBusy || uploadingId === uploadKey}
                aria-label={`${imageSaveLabel} ${slot}`}
                className="rounded-lg bg-emerald-600 px-2 py-2 text-[10px] font-extrabold text-white disabled:opacity-50"
              >
                {imageBusy ? t('packageManager.saving') : imageSaveLabel}
              </button>
              <button
                type="button"
                onClick={undoImage}
                disabled={imageBusy || uploadingId === uploadKey}
                aria-label={`${imageUndoLabel} ${slot}`}
                className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-[10px] font-bold text-gray-600 disabled:opacity-50"
              >
                {imageUndoLabel}
              </button>
            </div>
          ) : (
            <div className="mt-2 text-center text-[10px] font-extrabold text-emerald-700">
              {savedId === uploadKey ? t('packageManager.saved') : imageSavedLabel}
            </div>
          )
        )}
      </div>
    );
  };

  return (
    <section className="mb-6 rounded-2xl border border-[#EAE3D2] bg-white p-5">
      <div className="mb-1 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <PackageIcon className="mt-0.5 h-5 w-5 text-[#B29259]" aria-hidden="true" />
          <div>
            <h3 className="text-base font-bold text-[#8C6D3F]">{t('packageManager.title')}</h3>
            <p className="text-xs text-gray-500">{t('packageManager.subtitle')}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#8C6D3F] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#705630]"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {t('packageManager.addPackage')}
        </button>
      </div>

      {showAdd && (
        <div className="mt-4 space-y-3 rounded-xl border border-[#B29259]/40 bg-[#FAF7F2] p-4 animate-fadeIn">
          <p className="text-sm font-bold text-[#8C6D3F]">{t('packageManager.newPackage')}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <label className={labelCls}>{t('packageManager.category')}</label>
              <select aria-label={`${t('packageManager.category')} — ${t('packageManager.newPackage')}`} value={newDraft.category} onChange={(e) => setNewDraft({ ...newDraft, category: e.target.value })} className={inputCls}>
                <option value="">—</option>
                {Object.values(CATEGORIES).map((c) => (
                  <option key={c} value={c}>{categoryLabel(c, lang)}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className={labelCls}>{t('packageManager.titleField')}</label>
              <input type="text" aria-label={`${t('packageManager.titleField')} — ${t('packageManager.newPackage')}`} value={newDraft.title} onChange={(e) => setNewDraft({ ...newDraft, title: e.target.value })} className={inputCls} />
            </div>
            <div className="sm:col-span-1">
              <label className={labelCls}>{t('packageManager.price')}</label>
              <input type="number" min="0" aria-label={`${t('packageManager.price')} — ${t('packageManager.newPackage')}`} value={newDraft.price} onChange={(e) => setNewDraft({ ...newDraft, price: e.target.value })} className={`${inputCls} text-center`} />
            </div>
            <div className="sm:col-span-3">
              <label className={labelCls}>{t('packageManager.subtitleField')}</label>
              <input type="text" aria-label={`${t('packageManager.subtitleField')} — ${t('packageManager.newPackage')}`} value={newDraft.subtitle} onChange={(e) => setNewDraft({ ...newDraft, subtitle: e.target.value })} className={inputCls} />
            </div>
            <div className="sm:col-span-3">
              <label className={labelCls}>{t('packageManager.benefitsField')}</label>
              <input type="text" aria-label={`${t('packageManager.benefitsField')} — ${t('packageManager.newPackage')}`} value={newDraft.benefits} onChange={(e) => setNewDraft({ ...newDraft, benefits: e.target.value })} className={inputCls} />
            </div>
            <div className="sm:col-span-6">
              <label className={labelCls}>{t('packageManager.descriptionField')}</label>
              <textarea rows={2} aria-label={`${t('packageManager.descriptionField')} — ${t('packageManager.newPackage')}`} value={newDraft.description} onChange={(e) => setNewDraft({ ...newDraft, description: e.target.value })} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:col-span-6">
              {imageControl('__new__:1', newDraft.image_url, (image_url) => setNewDraft((current) => ({ ...current, image_url })), 1)}
              {imageControl('__new__:2', newDraft.image_url_2, (image_url_2) => setNewDraft((current) => ({ ...current, image_url_2 })), 2)}
            </div>
          </div>
          <p className="text-[10px] text-gray-400">{t('packageManager.requiredNote')}</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => void createPackage()} disabled={busyId === '__new__'} className="flex items-center gap-1.5 rounded-lg bg-[#B29259] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#8C6D3F] disabled:opacity-50">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {t('packageManager.create')}
            </button>
            <button type="button" onClick={() => { setShowAdd(false); setNewDraft(EMPTY_NEW); }} className="rounded-lg px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700">
              {t('packageManager.cancel')}
            </button>
            {errorId === '__new__' && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-red-500">
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {t('packageManager.requiredNote')}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const d = draftFor(item);
          const busy = busyId === item.id || Boolean(uploadingId?.startsWith(`${item.id}:`));
          const aria = (field: string) => `${field} — ${item.current.title || item.id}`;
          return (
            <div key={item.id} className={`rounded-xl border p-3 ${item.hidden ? 'border-gray-200 bg-gray-50 opacity-80' : 'border-[#EAE3D2] bg-white'}`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{item.current.category ? categoryLabel(item.current.category, lang) : '—'}</span>
                <div className="flex items-center gap-1.5">
                  {item.isCustom && <span className="rounded-full bg-[#FAF7F2] px-2 py-0.5 text-[10px] font-bold text-[#8C6D3F]">{t('packageManager.customBadge')}</span>}
                  {item.hidden && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-500">{t('packageManager.hiddenBadge')}</span>}
                  {!item.hidden && !item.isCustom && item.hasOverride && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">{t('packageManager.editedBadge')}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-6">
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
                <div className="sm:col-span-2">
                  <label className={labelCls}>{t('packageManager.benefitsField')}</label>
                  <input type="text" value={d.benefits} aria-label={aria(t('packageManager.benefitsField'))} onChange={(e) => setField(item, 'benefits', e.target.value)} className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:col-span-4">
                  {imageControl(`${item.id}:1`, d.image_url, (u) => setField(item, 'image_url', u), 1, item)}
                  {imageControl(`${item.id}:2`, d.image_url_2, (u) => setField(item, 'image_url_2', u), 2, item)}
                </div>
              </div>

              {item.pricingTiers && <p className="mt-1.5 text-[10px] text-gray-400">{t('packageManager.tierNote')}</p>}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => save(item)} disabled={busy || !isDirty(item)} className="flex items-center gap-1.5 rounded-lg bg-[#B29259] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#8C6D3F] disabled:cursor-not-allowed disabled:opacity-40">
                  <Save className="h-3.5 w-3.5" aria-hidden="true" />
                  {busy ? t('packageManager.saving') : savedId === item.id ? t('packageManager.saved') : t('packageManager.save')}
                </button>

                <button type="button" onClick={() => toggleHidden(item)} disabled={busy} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 transition-colors hover:border-[#B29259] disabled:opacity-40">
                  {item.hidden ? <Eye className="h-3.5 w-3.5" aria-hidden="true" /> : <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />}
                  {item.hidden ? t('packageManager.show') : t('packageManager.hide')}
                </button>

                {item.isCustom ? (
                  <button type="button" onClick={() => removeItem(item)} disabled={busy} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-red-500 transition-colors hover:text-red-700 disabled:opacity-40">
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('packageManager.delete')}
                  </button>
                ) : (
                  item.hasOverride && (
                    <button type="button" onClick={() => removeItem(item)} disabled={busy} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-500 transition-colors hover:text-red-500 disabled:opacity-40">
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('packageManager.reset')}
                    </button>
                  )
                )}

                {errorId === item.id && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-red-500">
                    <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
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
