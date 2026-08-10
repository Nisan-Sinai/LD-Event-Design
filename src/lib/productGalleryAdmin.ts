import { SHOP_PRODUCTS, SHOP_PRODUCT_CATEGORIES } from '../catalog/shopProducts';
import {
  fetchPackageOverrides,
  savePackageImage,
  uploadPackageImage,
  type OverrideMap,
  type PackageOverride
} from './packages';
import { isSupabaseConfigured } from './supabase';

const SLOT_KEYS = ['image_url', 'image_url_2', 'image_url_3', 'image_url_4'] as const;
type SlotNumber = 1 | 2 | 3 | 4;

interface ManagedGalleryProduct {
  id: string;
  title: string;
  category: string;
  override: PackageOverride | undefined;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function managedProducts(overrides: OverrideMap): ManagedGalleryProduct[] {
  const base = SHOP_PRODUCTS.map((product) => ({
    id: product.id,
    title: overrides[product.id]?.title ?? product.title,
    category: overrides[product.id]?.category ?? product.category,
    override: overrides[product.id]
  }));

  const custom = Object.values(overrides)
    .filter((override) => override.is_custom && override.package_id.startsWith('product-'))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((override) => ({
      id: override.package_id,
      title: override.title ?? 'מוצר ללא שם',
      category: override.category ?? SHOP_PRODUCT_CATEGORIES.CENTERPIECES,
      override
    }));

  return [...base, ...custom];
}

function valueForSlot(product: ManagedGalleryProduct, slot: SlotNumber): string {
  const key = SLOT_KEYS[slot - 1];
  return product.override?.[key]?.trim() ?? '';
}

function setLocalSlot(product: ManagedGalleryProduct, slot: SlotNumber, value: string | null) {
  const key = SLOT_KEYS[slot - 1];
  if (!product.override) {
    product.override = {
      package_id: product.id,
      price: null,
      title: null,
      subtitle: null,
      description: null,
      benefits: null,
      image_url: null,
      image_url_2: null,
      image_url_3: null,
      image_url_4: null,
      category: null,
      svg_type: null,
      pricing_tiers: null,
      hidden: false,
      is_custom: false,
      sort_order: null
    };
  }
  product.override[key] = value;
}

function createSlot(product: ManagedGalleryProduct, slot: SlotNumber) {
  const wrapper = el('div', 'min-w-0 rounded-2xl border border-[#EAE3D2] bg-[#FAF7F2] p-2.5');
  wrapper.dataset.gallerySlot = String(slot);

  const label = el('div', 'mb-1.5 flex items-center justify-between gap-2');
  const title = el('span', 'text-[11px] font-extrabold text-[#5F554D]');
  title.textContent = slot === 1 ? 'תמונה ראשית' : `תמונה ${slot}`;
  const state = el('span', 'text-[9px] font-bold text-emerald-700');
  label.append(title, state);

  const preview = el('div', 'relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-xl border border-[#EAE3D2] bg-white');
  const currentUrl = valueForSlot(product, slot);

  const renderPreview = (url: string) => {
    preview.replaceChildren();
    if (url) {
      const image = el('img', 'h-full w-full object-cover');
      image.src = url;
      image.alt = `${product.title} — תמונה ${slot}`;
      image.loading = 'lazy';
      preview.append(image);

      const remove = el('button', 'absolute end-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-lg font-black text-gray-600 shadow transition hover:text-red-600');
      remove.type = 'button';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `הסרת תמונה ${slot} של ${product.title}`);
      remove.addEventListener('click', async () => {
        remove.disabled = true;
        state.textContent = 'מסיר…';
        state.className = 'text-[9px] font-bold text-[#8C6D3F]';
        try {
          await savePackageImage(product.id, null, slot);
          setLocalSlot(product, slot, null);
          renderPreview('');
          state.textContent = 'נשמר';
          state.className = 'text-[9px] font-bold text-emerald-700';
        } catch {
          state.textContent = 'שגיאה';
          state.className = 'text-[9px] font-bold text-red-600';
        } finally {
          remove.disabled = false;
        }
      });
    } else {
      const empty = el('div', 'px-3 text-center');
      const icon = el('div', 'text-2xl text-[#B29259]/60');
      icon.textContent = '▧';
      const text = el('span', 'mt-1 block text-[9px] font-bold text-gray-400');
      text.textContent = 'אין תמונה';
      empty.append(icon, text);
      preview.append(empty);
    }
  };
  renderPreview(currentUrl);

  const uploadLabel = el('label', 'mt-2 flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#B29259] px-2 py-2 text-[10px] font-extrabold text-[#8C6D3F] transition hover:bg-white');
  uploadLabel.textContent = currentUrl ? `החלפת תמונה ${slot}` : `העלאת תמונה ${slot}`;
  const input = el('input', 'sr-only');
  input.type = 'file';
  input.accept = 'image/*,.heic,.heif';
  input.setAttribute('aria-label', `העלאת תמונה ${slot} של ${product.title}`);
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    input.disabled = true;
    state.textContent = 'מעלה…';
    state.className = 'text-[9px] font-bold text-[#8C6D3F]';
    try {
      const url = await uploadPackageImage(file);
      await savePackageImage(product.id, url, slot);
      setLocalSlot(product, slot, url);
      renderPreview(url);
      uploadLabel.childNodes[0].textContent = `החלפת תמונה ${slot}`;
      state.textContent = 'נשמר';
      state.className = 'text-[9px] font-bold text-emerald-700';
    } catch {
      state.textContent = 'שגיאה';
      state.className = 'text-[9px] font-bold text-red-600';
    } finally {
      input.disabled = false;
    }
  });
  uploadLabel.append(input);

  wrapper.append(label, preview, uploadLabel);
  return wrapper;
}

function productCard(product: ManagedGalleryProduct) {
  const card = el('article', 'rounded-3xl border border-[#EAE3D2] bg-white p-4 shadow-sm');
  const header = el('div', 'mb-3');
  const category = el('p', 'text-[9px] font-bold uppercase tracking-[0.18em] text-[#B8860B]');
  category.textContent = product.category;
  const title = el('h4', 'mt-1 text-sm font-black leading-snug text-[#3F352F]');
  title.textContent = product.title;
  header.append(category, title);

  const grid = el('div', 'grid grid-cols-2 gap-2.5 sm:grid-cols-4');
  ([1, 2, 3, 4] as SlotNumber[]).forEach((slot) => grid.append(createSlot(product, slot)));
  card.append(header, grid);
  return card;
}

function buildManager(overrides: OverrideMap) {
  const section = el('section', 'mt-5 rounded-3xl border border-[#D8C29A] bg-gradient-to-br from-[#FFFDF9] to-[#FAF7F2] p-4 shadow-sm sm:p-5');
  section.dataset.fourImageAdmin = 'true';

  const heading = el('div', 'mb-5 flex flex-wrap items-start justify-between gap-3');
  const text = el('div');
  const title = el('h3', 'text-base font-black text-[#8C6D3F] sm:text-lg');
  title.textContent = 'גלריית תמונות למוצרים — עד 4 תמונות לכל מרובע';
  const subtitle = el('p', 'mt-1 max-w-3xl text-xs leading-relaxed text-gray-500');
  subtitle.textContent = 'כל תמונה נשמרת מיד. אפשר להשאיר 1, 2, 3 או 4 תמונות — באתר יוצגו רק התמונות שבאמת קיימות, בלי מקומות ריקים.';
  text.append(title, subtitle);

  const badge = el('span', 'rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-extrabold text-emerald-700');
  badge.textContent = 'שמירה אוטומטית';
  heading.append(text, badge);

  const grid = el('div', 'grid gap-4 lg:grid-cols-2');
  managedProducts(overrides).forEach((product) => grid.append(productCard(product)));
  section.append(heading, grid);
  return section;
}

export function installProductGalleryAdmin() {
  if (!isSupabaseConfigured || typeof document === 'undefined') return () => {};

  let disposed = false;
  let loading = false;
  let cachedOverrides: OverrideMap | null = null;

  const mount = async () => {
    if (disposed || loading) return;
    const host = document.querySelector<HTMLElement>('#admin-products');
    if (!host || host.querySelector('[data-four-image-admin="true"]')) return;

    loading = true;
    try {
      cachedOverrides ??= await fetchPackageOverrides();
      if (disposed || !document.contains(host)) return;
      host.append(buildManager(cachedOverrides));

      const productManager = host.querySelector<HTMLElement>('section:not([data-four-image-admin="true"]) p');
      if (productManager && /שתי תמונות|two product images/i.test(productManager.textContent ?? '')) {
        productManager.textContent = 'כאן לירון יכולה לשנות מחיר וטקסט, להסתיר מוצר או להוסיף מוצר חדש. לניהול מלא של 4 התמונות השתמשו בגלריה שמתחת.';
      }
    } finally {
      loading = false;
    }
  };

  const observer = new MutationObserver(() => void mount());
  observer.observe(document.getElementById('root') ?? document.body, { childList: true, subtree: true });
  void mount();

  return () => {
    disposed = true;
    observer.disconnect();
    document.querySelector('[data-four-image-admin="true"]')?.remove();
  };
}
