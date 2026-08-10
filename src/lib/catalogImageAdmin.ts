import { isSupabaseConfigured, supabase } from './supabase';
import { uploadPackageImage } from './packages';

type ImageSlot = 1 | 2;
type CatalogKind = 'product' | 'package';

interface ImageOverrideRow {
  package_id: string;
  title: string | null;
  image_url: string | null;
  image_url_2: string | null;
  is_custom: boolean;
  sort_order: number | null;
}

interface CatalogImageItem {
  id: string;
  title: string;
  kind: CatalogKind;
  image1: string;
  image2: string;
  custom: boolean;
  sortOrder: number;
}

const PANEL_ID = 'admin-catalog-two-images';

export function imageColumnForSlot(slot: ImageSlot): 'image_url' | 'image_url_2' {
  return slot === 1 ? 'image_url' : 'image_url_2';
}

function text(he: string, en: string) {
  return document.documentElement.lang === 'en' ? en : he;
}

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  content?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}

async function loadCatalogItems(): Promise<CatalogImageItem[]> {
  const [{ SHOP_PRODUCTS }, { PACKAGES }] = await Promise.all([
    import('../catalog/shopProducts'),
    import('../App')
  ]);

  const { data, error } = await supabase
    .from('package_overrides')
    .select('package_id,title,image_url,image_url_2,is_custom,sort_order');
  if (error) throw error;

  const rows = (data ?? []) as ImageOverrideRow[];
  const byId = new Map(rows.map((row) => [row.package_id, row]));
  const baseIds = new Set<string>();

  const baseProducts: CatalogImageItem[] = SHOP_PRODUCTS.map((product, index) => {
    baseIds.add(product.id);
    const row = byId.get(product.id);
    return {
      id: product.id,
      title: row?.title?.trim() || product.title,
      kind: 'product',
      image1: row?.image_url?.trim() || product.image?.trim() || '',
      image2: row?.image_url_2?.trim() || '',
      custom: false,
      sortOrder: index
    };
  });

  const basePackages: CatalogImageItem[] = PACKAGES.map((pkg, index) => {
    baseIds.add(pkg.id);
    const row = byId.get(pkg.id);
    return {
      id: pkg.id,
      title: row?.title?.trim() || pkg.title,
      kind: 'package',
      image1: row?.image_url?.trim() || pkg.image?.trim() || '',
      image2: row?.image_url_2?.trim() || '',
      custom: false,
      sortOrder: index
    };
  });

  const customItems = rows
    .filter((row) => row.is_custom && !baseIds.has(row.package_id) && row.package_id !== '__site_branding__')
    .map<CatalogImageItem>((row) => ({
      id: row.package_id,
      title: row.title?.trim() || row.package_id,
      kind: row.package_id.startsWith('product-') ? 'product' : 'package',
      image1: row.image_url?.trim() || '',
      image2: row.image_url_2?.trim() || '',
      custom: true,
      sortOrder: row.sort_order ?? Number.MAX_SAFE_INTEGER
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return [...baseProducts, ...basePackages, ...customItems];
}

async function saveImageSlot(item: CatalogImageItem, slot: ImageSlot, value: string | null) {
  const column = imageColumnForSlot(slot);
  const { error } = await supabase
    .from('package_overrides')
    .upsert(
      {
        package_id: item.id,
        [column]: value,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'package_id' }
    );
  if (error) throw error;

  if (slot === 1) item.image1 = value ?? '';
  else item.image2 = value ?? '';
}

function createImageSlot(item: CatalogImageItem, slot: ImageSlot, report: (message: string, error?: boolean) => void) {
  const wrapper = element('div', 'rounded-2xl border border-[#EAE3D2] bg-[#FAF7F2] p-3');
  let busy = false;

  const draw = () => {
    wrapper.replaceChildren();
    const url = slot === 1 ? item.image1 : item.image2;
    const header = element('div', 'mb-2 flex items-center justify-between gap-2');
    header.append(element('strong', 'text-[11px] font-black text-[#5F554D]', `${text('תמונה', 'Image')} ${slot}`));
    if (url) header.append(element('span', 'text-[9px] font-bold text-emerald-700', text('קיימת', 'Active')));
    wrapper.append(header);

    const preview = element('div', 'relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-[#E2D8C8] bg-white');
    if (url) {
      const img = element('img', 'h-full w-full object-cover');
      img.src = url;
      img.alt = `${item.title} — ${text('תמונה', 'Image')} ${slot}`;
      img.loading = 'lazy';
      preview.append(img);

      const remove = element('button', 'absolute end-2 top-2 rounded-full border border-red-100 bg-white/95 px-2.5 py-1.5 text-[10px] font-extrabold text-red-600 shadow-sm hover:bg-red-50', text('מחיקה', 'Remove'));
      remove.type = 'button';
      remove.disabled = busy;
      remove.setAttribute('aria-label', `${text('מחיקת תמונה', 'Remove image')} ${slot} — ${item.title}`);
      remove.addEventListener('click', async () => {
        if (busy) return;
        busy = true;
        draw();
        report(text('מוחק תמונה…', 'Removing image…'));
        try {
          await saveImageSlot(item, slot, null);
          report(`${text('תמונה', 'Image')} ${slot} ${text('נמחקה', 'removed')}`);
        } catch {
          report(text('מחיקת התמונה נכשלה.', 'Image removal failed.'), true);
        } finally {
          busy = false;
          draw();
        }
      });
      preview.append(remove);
    } else {
      preview.append(element('span', 'px-3 text-center text-[10px] font-bold leading-relaxed text-gray-400', text('אין תמונה כרגע', 'No image yet')));
    }
    wrapper.append(preview);

    const label = element('label', `mt-2 flex items-center justify-center rounded-xl border border-dashed border-[#B29259]/70 px-3 py-2 text-[11px] font-extrabold text-[#8C6D3F] ${busy ? 'cursor-wait opacity-60' : 'cursor-pointer hover:bg-white'}`, busy ? text('שומר…', 'Saving…') : url ? text('החלפת תמונה', 'Replace image') : text('העלאת תמונה', 'Upload image'));
    const input = element('input');
    input.type = 'file';
    input.accept = 'image/*,.heic,.heif';
    input.className = 'sr-only';
    input.disabled = busy;
    input.setAttribute('aria-label', `${url ? text('החלפת', 'Replace') : text('העלאת', 'Upload')} ${text('תמונה', 'image')} ${slot} — ${item.title}`);
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      input.value = '';
      if (!file || busy) return;
      busy = true;
      draw();
      report(text('מעלה ושומר תמונה…', 'Uploading and saving image…'));
      try {
        const uploadedUrl = await uploadPackageImage(file);
        await saveImageSlot(item, slot, uploadedUrl);
        report(`${text('תמונה', 'Image')} ${slot} ${text('נשמרה', 'saved')}`);
      } catch {
        report(text('העלאת התמונה נכשלה.', 'Image upload failed.'), true);
      } finally {
        busy = false;
        draw();
      }
    });
    label.append(input);
    wrapper.append(label);
  };

  draw();
  return wrapper;
}

function createItemCard(item: CatalogImageItem, report: (message: string, error?: boolean) => void) {
  const card = element('article', 'rounded-3xl border border-[#EAE3D2] bg-white p-4 shadow-sm');
  const heading = element('div', 'mb-3 flex items-start justify-between gap-3');
  const titleWrap = element('div');
  titleWrap.append(element('h4', 'text-sm font-black leading-snug text-[#3F352F]', item.title));
  titleWrap.append(element('p', 'mt-1 break-all text-[9px] text-gray-400', item.id));
  heading.append(titleWrap);
  heading.append(element('span', 'shrink-0 rounded-full bg-[#FAF7F2] px-2.5 py-1 text-[9px] font-extrabold text-[#8C6D3F]', item.kind === 'product' ? text('מוצר', 'Product') : text('חבילה', 'Package')));
  card.append(heading);

  const slots = element('div', 'grid grid-cols-2 gap-3');
  slots.append(createImageSlot(item, 1, report), createImageSlot(item, 2, report));
  card.append(slots);
  return card;
}

async function populatePanel(panel: HTMLElement) {
  const status = panel.querySelector<HTMLElement>('[data-catalog-image-status]');
  const body = panel.querySelector<HTMLElement>('[data-catalog-image-body]');
  if (!status || !body) return;

  const report = (message: string, error = false) => {
    status.textContent = message;
    status.className = `mt-3 min-h-5 text-center text-[11px] font-bold ${error ? 'text-red-600' : 'text-emerald-700'}`;
  };

  try {
    const items = await loadCatalogItems();
    if (!panel.isConnected) return;
    body.replaceChildren();

    const productItems = items.filter((item) => item.kind === 'product');
    const packageItems = items.filter((item) => item.kind === 'package');

    const addGroup = (title: string, groupItems: CatalogImageItem[]) => {
      if (groupItems.length === 0) return;
      const group = element('div', 'mt-6');
      group.append(element('h3', 'mb-3 text-sm font-black text-[#5F554D]', title));
      const grid = element('div', 'grid gap-3 md:grid-cols-2');
      groupItems.forEach((item) => grid.append(createItemCard(item, report)));
      group.append(grid);
      body.append(group);
    };

    addGroup(text('מוצרים ופריטי עיצוב', 'Products & design items'), productItems);
    addGroup(text('חבילות עיצוב', 'Design packages'), packageItems);
    report(text(`נטענו ${items.length} פריטים. כל תמונה ניתנת להחלפה או למחיקה בנפרד.`, `Loaded ${items.length} items. Each image can be replaced or removed independently.`));
  } catch {
    report(text('טעינת התמונות נכשלה. רעננו את העמוד ונסו שוב.', 'Could not load images. Refresh and try again.'), true);
  }
}

function createPanel() {
  const panel = element('section', 'mb-6 rounded-3xl border border-[#D8C29A] bg-gradient-to-br from-white to-[#FAF7F2] p-4 shadow-sm sm:p-6');
  panel.id = PANEL_ID;
  panel.setAttribute('aria-labelledby', `${PANEL_ID}-title`);

  const header = element('div', 'text-center');
  const title = element('h2', 'text-lg font-black text-[#8C6D3F]', text('ניהול שתי התמונות לכל כרטיס', 'Manage both images for every card'));
  title.id = `${PANEL_ID}-title`;
  header.append(title);
  header.append(element('p', 'mx-auto mt-2 max-w-2xl text-xs leading-relaxed text-gray-500', text('לכל מוצר וחבילה יש תמונה 1 ותמונה 2. מכאן אפשר להעלות, להחליף או למחוק כל אחת בנפרד — והשינוי נשמר מיד ב־Supabase.', 'Every product and package has Image 1 and Image 2. Upload, replace or remove each one independently; changes are saved immediately to Supabase.')));
  panel.append(header);

  const status = element('p', 'mt-3 min-h-5 text-center text-[11px] font-bold text-gray-500', text('טוען תמונות…', 'Loading images…'));
  status.dataset.catalogImageStatus = 'true';
  panel.append(status);

  const body = element('div');
  body.dataset.catalogImageBody = 'true';
  panel.append(body);

  return panel;
}

export function installCatalogImageAdmin() {
  if (!isSupabaseConfigured || typeof document === 'undefined') return () => {};

  let disposed = false;
  let scheduled = false;

  const mount = () => {
    if (disposed || window.location.pathname !== '/admin' || document.getElementById(PANEL_ID)) return;
    const productsSection = document.getElementById('admin-products');
    if (!productsSection?.parentElement) return;
    const panel = createPanel();
    productsSection.parentElement.insertBefore(panel, productsSection);
    void populatePanel(panel);
  };

  const scheduleMount = () => {
    if (scheduled || disposed) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      mount();
    });
  };

  const observer = new MutationObserver(scheduleMount);
  observer.observe(document.getElementById('root') ?? document.body, { childList: true, subtree: true });
  scheduleMount();

  return () => {
    disposed = true;
    observer.disconnect();
  };
}
