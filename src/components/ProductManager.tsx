import { useState } from 'react';
import { AlertCircle, Eye, EyeOff, ImagePlus, Plus, RotateCcw, Save, ShoppingBag, Trash2, X } from 'lucide-react';
import {
  SHOP_PRODUCTS,
  SHOP_PRODUCT_CATEGORIES,
  type ShopProduct,
  type ShopProductCategory
} from '../catalog/shopProducts';
import { useI18n } from '../i18n/i18n';
import { uploadPackageImage, type PackageOverride } from '../lib/packages';
import { isSupabaseConfigured } from '../lib/supabase';
import { usePackages } from '../packages/PackagesProvider';

interface ProductDraft {
  title: string;
  subtitle: string;
  price: string;
  image: string;
  image2: string;
  category: ShopProductCategory | '';
}

interface ManagedProduct extends ShopProduct {
  image2: string;
  hidden: boolean;
  custom: boolean;
  hasOverride: boolean;
}

const EMPTY_DRAFT: ProductDraft = { title: '', subtitle: '', price: '', image: '', image2: '', category: '' };

const COPY = {
  he: {
    title: 'מוצרים קטנים בחנות',
    subtitle: 'כאן לירון יכולה להעלות שתי תמונות, לשנות מחיר וטקסט, להסתיר מוצר או להוסיף מוצר חדש.',
    add: 'הוספת מוצר',
    newProduct: 'מוצר חדש',
    category: 'קטגוריה',
    name: 'שם המוצר',
    description: 'תיאור קצר',
    price: 'מחיר',
    image: 'תמונת מוצר',
    upload: 'העלאת תמונה',
    uploading: 'מעלה תמונה…',
    removeImage: 'הסרת תמונה',
    create: 'יצירת מוצר',
    cancel: 'ביטול',
    save: 'שמירה',
    saving: 'שומר…',
    saved: 'נשמר',
    hide: 'הסתרה מהחנות',
    show: 'הצגה בחנות',
    reset: 'שחזור ברירת מחדל',
    delete: 'מחיקת מוצר',
    required: 'יש למלא קטגוריה, שם ומחיר.',
    error: 'השמירה נכשלה. נסו שוב.',
    custom: 'מוצר חדש',
    hidden: 'מוסתר',
    edited: 'נערך',
    noImage: 'ללא תמונה',
    imageHint: 'מומלץ להעלות תמונה ריבועית או ביחס 4:5 באיכות גבוהה.'
  },
  en: {
    title: 'Small shop products',
    subtitle: 'Upload two product images, change prices and text, hide products or create new products.',
    add: 'Add product',
    newProduct: 'New product',
    category: 'Category',
    name: 'Product name',
    description: 'Short description',
    price: 'Price',
    image: 'Product image',
    upload: 'Upload image',
    uploading: 'Uploading…',
    removeImage: 'Remove image',
    create: 'Create product',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving…',
    saved: 'Saved',
    hide: 'Hide from shop',
    show: 'Show in shop',
    reset: 'Restore default',
    delete: 'Delete product',
    required: 'Category, name and price are required.',
    error: 'Saving failed. Please try again.',
    custom: 'New product',
    hidden: 'Hidden',
    edited: 'Edited',
    noImage: 'No image',
    imageHint: 'A high-quality square or 4:5 image is recommended.'
  }
} as const;

function toDraft(product: ManagedProduct): ProductDraft {
  return {
    title: product.title,
    subtitle: product.subtitle,
    price: String(product.price),
    image: product.image ?? '',
    image2: product.image2,
    category: product.category
  };
}

export function ProductManager() {
  const { lang } = useI18n();
  const copy = COPY[lang];
  const { overrides, saveOverride, saveImage, removeOverride } = usePackages();
  const [drafts, setDrafts] = useState<Record<string, ProductDraft>>({});
  const [newDraft, setNewDraft] = useState<ProductDraft>(EMPTY_DRAFT);
  const [showAdd, setShowAdd] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  if (!isSupabaseConfigured) return null;

  const baseProducts: ManagedProduct[] = SHOP_PRODUCTS.map((product) => {
    const override = overrides[product.id];
    return {
      ...product,
      title: override?.title ?? product.title,
      subtitle: override?.subtitle ?? product.subtitle,
      price: override?.price ?? product.price,
      image: override?.image_url ?? product.image,
      image2: override?.image_url_2 ?? '',
      category: (override?.category ?? product.category) as ShopProductCategory,
      svgType: override?.svg_type ?? product.svgType,
      hidden: override?.hidden ?? false,
      custom: false,
      hasOverride: !!override
    };
  });

  const customProducts: ManagedProduct[] = Object.values(overrides)
    .filter((override) => override.is_custom && override.package_id.startsWith('product-'))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((override) => ({
      id: override.package_id,
      category: (override.category ?? SHOP_PRODUCT_CATEGORIES.CENTERPIECES) as ShopProductCategory,
      title: override.title ?? '',
      subtitle: override.subtitle ?? '',
      price: override.price ?? 0,
      image: override.image_url ?? undefined,
      image2: override.image_url_2 ?? '',
      svgType: override.svg_type ?? 'default',
      hidden: override.hidden,
      custom: true,
      hasOverride: true
    }));

  const products = [...baseProducts, ...customProducts];
  const inputClass = 'w-full rounded-xl border border-[#DDD2C1] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#B29259] focus:ring-2 focus:ring-[#B29259]/20';
  const labelClass = 'mb-1.5 block text-[11px] font-bold text-gray-600';

  const draftFor = (product: ManagedProduct) => drafts[product.id] ?? toDraft(product);
  const setField = (product: ManagedProduct, field: keyof ProductDraft, value: string) => {
    setDrafts((current) => ({
      ...current,
      [product.id]: { ...draftFor(product), [field]: value }
    }));
  };

  const run = async (id: string, action: () => Promise<void>) => {
    setBusyId(id);
    setErrorId(null);
    try {
      await action();
      setDrafts((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setSavedId(id);
      window.setTimeout(() => setSavedId((current) => (current === id ? null : current)), 1800);
    } catch {
      setErrorId(id);
    } finally {
      setBusyId((current) => (current === id ? null : current));
    }
  };

  const toOverride = (product: ManagedProduct, draft: ProductDraft, hidden: boolean): PackageOverride => ({
    package_id: product.id,
    price: Math.max(0, Number(draft.price) || 0),
    title: draft.title.trim() || null,
    subtitle: draft.subtitle.trim() || null,
    description: null,
    benefits: null,
    image_url: draft.image.trim() || null,
    image_url_2: draft.image2.trim() || null,
    category: draft.category || product.category,
    svg_type: product.svgType,
    pricing_tiers: null,
    hidden,
    is_custom: product.custom,
    sort_order: product.custom ? overrides[product.id]?.sort_order ?? Date.now() : null
  });

  const persistImage = (product: ManagedProduct, imageUrl: string, slot: 1 | 2) =>
    run(product.id, () => slot === 1
      ? saveImage(product.id, imageUrl.trim() || null)
      : saveImage(product.id, imageUrl.trim() || null, 2));

  const saveProduct = (product: ManagedProduct) => {
    const draft = draftFor(product);
    if (!draft.category || !draft.title.trim() || draft.price.trim() === '') {
      setErrorId(product.id);
      return;
    }
    void run(product.id, () => saveOverride(toOverride(product, draft, product.hidden)));
  };

  const toggleHidden = (product: ManagedProduct) => {
    void run(product.id, () => saveOverride(toOverride(product, draftFor(product), !product.hidden)));
  };

  const uploadImage = async (
    uploadKey: string,
    file: File | undefined,
    apply: (url: string) => void,
    slot: 1 | 2,
    product?: ManagedProduct
  ) => {
    if (!file) return;
    setUploadingId(uploadKey);
    setErrorId(null);
    try {
      const url = await uploadPackageImage(file);
      apply(url);
      if (product) await persistImage(product, url, slot);
    } catch {
      setErrorId(product?.id ?? '__new_product__');
    } finally {
      setUploadingId((current) => (current === uploadKey ? null : current));
    }
  };

  const createProduct = () => {
    if (!newDraft.category || !newDraft.title.trim() || newDraft.price.trim() === '') {
      setErrorId('__new_product__');
      return;
    }

    const id = `product-custom-${crypto.randomUUID().slice(0, 8)}`;
    void run('__new_product__', () => saveOverride({
      package_id: id,
      price: Math.max(0, Number(newDraft.price) || 0),
      title: newDraft.title.trim(),
      subtitle: newDraft.subtitle.trim() || null,
      description: null,
      benefits: null,
      image_url: newDraft.image.trim() || null,
      image_url_2: newDraft.image2.trim() || null,
      category: newDraft.category,
      svg_type: 'default',
      pricing_tiers: null,
      hidden: false,
      is_custom: true,
      sort_order: Date.now()
    }, { includeImage: true }));
    setNewDraft(EMPTY_DRAFT);
    setShowAdd(false);
  };

  const imageControl = (
    uploadKey: string,
    url: string,
    apply: (url: string) => void,
    slot: 1 | 2,
    product?: ManagedProduct
  ) => (
    <div className="min-w-0 rounded-2xl border border-[#EAE3D2] bg-[#FAF7F2] p-2.5">
      <span className={labelClass}>{copy.image} {slot}</span>
      <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl border border-[#EAE3D2] bg-white">
        {url ? (
          <>
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => {
                apply('');
                if (product) void persistImage(product, '', slot);
              }}
              aria-label={slot === 1 ? copy.removeImage : `${copy.removeImage} 2`}
              className="absolute end-1.5 top-1.5 rounded-full bg-white/95 p-1.5 text-gray-500 shadow hover:text-red-600"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </>
        ) : (
          <div className="text-center">
            <ImagePlus className="mx-auto h-6 w-6 text-[#B29259]/60" aria-hidden="true" />
            <span className="mt-1 block text-[9px] font-bold text-gray-400">{copy.noImage}</span>
          </div>
        )}
      </div>
      <label className="mt-2 flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#B29259] px-2 py-2 text-[10px] font-bold text-[#8C6D3F] hover:bg-white">
        <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
        {uploadingId === uploadKey ? copy.uploading : url ? `${copy.upload} ${slot}` : `${copy.upload} ${slot}`}
        <input
          type="file"
          accept="image/*,.heic,.heif"
          className="sr-only"
          aria-label={`${copy.upload} ${slot}`}
          disabled={uploadingId === uploadKey || Boolean(product && busyId === product.id)}
          onChange={(event) => {
            void uploadImage(uploadKey, event.target.files?.[0], apply, slot, product);
            event.target.value = '';
          }}
        />
      </label>
    </div>
  );

  return (
    <section className="mb-6 rounded-3xl border border-[#EAE3D2] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-[#FAF7F2] p-2.5 text-[#8C6D3F]"><ShoppingBag className="h-5 w-5" aria-hidden="true" /></div>
          <div>
            <h3 className="text-lg font-extrabold text-[#8C6D3F]">{copy.title}</h3>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-gray-500">{copy.subtitle}</p>
          </div>
        </div>
        <button type="button" onClick={() => setShowAdd((current) => !current)} className="inline-flex items-center gap-2 rounded-xl bg-[#8C6D3F] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#6d5430]">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {copy.add}
        </button>
      </div>

      {showAdd && (
        <div className="mt-6 rounded-2xl border border-[#D8C29A] bg-[#FAF7F2] p-4 sm:p-5">
          <h4 className="font-bold text-[#8C6D3F]">{copy.newProduct}</h4>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label><span className={labelClass}>{copy.category}</span><select value={newDraft.category} onChange={(event) => setNewDraft({ ...newDraft, category: event.target.value as ShopProductCategory })} className={inputClass}><option value="">—</option>{Object.values(SHOP_PRODUCT_CATEGORIES).map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
            <label className="lg:col-span-2"><span className={labelClass}>{copy.name}</span><input value={newDraft.title} onChange={(event) => setNewDraft({ ...newDraft, title: event.target.value })} className={inputClass} /></label>
            <label><span className={labelClass}>{copy.price}</span><input type="number" min="0" value={newDraft.price} onChange={(event) => setNewDraft({ ...newDraft, price: event.target.value })} className={inputClass} /></label>
            <label className="sm:col-span-2 lg:col-span-4"><span className={labelClass}>{copy.description}</span><input value={newDraft.subtitle} onChange={(event) => setNewDraft({ ...newDraft, subtitle: event.target.value })} className={inputClass} /></label>
            <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-4">
              {imageControl('__new_product__:1', newDraft.image, (image) => setNewDraft((current) => ({ ...current, image })), 1)}
              {imageControl('__new_product__:2', newDraft.image2, (image2) => setNewDraft((current) => ({ ...current, image2 })), 2)}
            </div>
          </div>
          {errorId === '__new_product__' && <p role="alert" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-red-600"><AlertCircle className="h-4 w-4" aria-hidden="true" />{copy.required}</p>}
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={createProduct} disabled={busyId === '__new_product__'} className="rounded-xl bg-[#B29259] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{copy.create}</button>
            <button type="button" onClick={() => { setShowAdd(false); setNewDraft(EMPTY_DRAFT); setErrorId(null); }} className="rounded-xl px-4 py-2 text-xs font-bold text-gray-500 hover:bg-white">{copy.cancel}</button>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {products.map((product) => {
          const draft = draftFor(product);
          const busy = busyId === product.id || Boolean(uploadingId?.startsWith(`${product.id}:`));
          return (
            <article key={product.id} className={`rounded-2xl border p-4 ${product.hidden ? 'border-gray-200 bg-gray-50 opacity-75' : 'border-[#EAE3D2] bg-white'}`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <strong className="text-xs text-[#8C6D3F]">{draft.category || product.category}</strong>
                <div className="flex gap-1.5">
                  {product.custom && <span className="rounded-full bg-[#FAF7F2] px-2 py-1 text-[10px] font-bold text-[#8C6D3F]">{copy.custom}</span>}
                  {product.hidden && <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600">{copy.hidden}</span>}
                  {!product.hidden && product.hasOverride && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">{copy.edited}</span>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-[minmax(220px,260px)_1fr]">
                <div className="grid grid-cols-2 gap-2">
                  {imageControl(`${product.id}:1`, draft.image, (image) => setField(product, 'image', image), 1, product)}
                  {imageControl(`${product.id}:2`, draft.image2, (image2) => setField(product, 'image2', image2), 2, product)}
                </div>
                <div className="grid gap-3">
                  <label><span className={labelClass}>{copy.category}</span><select value={draft.category} onChange={(event) => setField(product, 'category', event.target.value)} className={inputClass}>{Object.values(SHOP_PRODUCT_CATEGORIES).map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
                  <label><span className={labelClass}>{copy.name}</span><input value={draft.title} onChange={(event) => setField(product, 'title', event.target.value)} className={inputClass} /></label>
                  <label><span className={labelClass}>{copy.description}</span><input value={draft.subtitle} onChange={(event) => setField(product, 'subtitle', event.target.value)} className={inputClass} /></label>
                  <label><span className={labelClass}>{copy.price}</span><input type="number" min="0" value={draft.price} onChange={(event) => setField(product, 'price', event.target.value)} className={inputClass} /></label>
                </div>
              </div>

              <p className="mt-2 text-[10px] text-gray-400">{copy.imageHint}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => saveProduct(product)} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl bg-[#B29259] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                  <Save className="h-3.5 w-3.5" aria-hidden="true" />
                  {busy ? copy.saving : savedId === product.id ? copy.saved : copy.save}
                </button>
                <button type="button" onClick={() => toggleHidden(product)} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl border border-[#EAE3D2] px-3 py-2 text-xs font-bold text-gray-600 disabled:opacity-50">
                  {product.hidden ? <Eye className="h-3.5 w-3.5" aria-hidden="true" /> : <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />}
                  {product.hidden ? copy.show : copy.hide}
                </button>
                {product.custom ? (
                  <button type="button" onClick={() => void run(product.id, () => removeOverride(product.id))} disabled={busy} className="inline-flex items-center gap-1.5 px-2 py-2 text-xs font-bold text-red-600 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" aria-hidden="true" />{copy.delete}</button>
                ) : product.hasOverride ? (
                  <button type="button" onClick={() => void run(product.id, () => removeOverride(product.id))} disabled={busy} className="inline-flex items-center gap-1.5 px-2 py-2 text-xs font-bold text-gray-500 disabled:opacity-50"><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />{copy.reset}</button>
                ) : null}
                {errorId === product.id && <span role="alert" className="inline-flex items-center gap-1 text-xs font-bold text-red-600"><AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />{copy.error}</span>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
