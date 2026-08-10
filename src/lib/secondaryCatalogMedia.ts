import { SHOP_PRODUCTS } from '../catalog/shopProducts';
import { isSupabaseConfigured, supabase } from './supabase';

interface SecondaryImageRow {
  package_id: string;
  title: string | null;
  image_url_2: string | null;
}

const normalizeTitle = (value: string | null | undefined) => value?.trim() ?? '';

function button(className: string, label: string, text: string) {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = className;
  element.setAttribute('aria-label', label);
  element.textContent = text;
  element.dataset.secondaryCatalogMedia = 'control';
  return element;
}

function enhanceProductCard(article: HTMLElement, secondaryUrl: string) {
  const media = article.firstElementChild;
  if (!(media instanceof HTMLElement)) return;

  const primary = media.querySelector<HTMLImageElement>('img');
  if (!primary || primary.src === secondaryUrl) return;
  if (media.dataset.secondaryCatalogUrl === secondaryUrl) return;

  media.querySelectorAll('[data-secondary-catalog-media]').forEach((node) => node.remove());
  media.dataset.secondaryCatalogUrl = secondaryUrl;
  media.dataset.secondaryCatalogIndex = '0';

  primary.classList.add('absolute', 'inset-0', 'transition-opacity', 'duration-300');
  primary.style.opacity = '1';

  const secondary = document.createElement('img');
  secondary.src = secondaryUrl;
  secondary.alt = `${primary.alt} — תמונה נוספת`;
  secondary.loading = 'lazy';
  secondary.className = 'absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300';
  secondary.dataset.secondaryCatalogMedia = 'image';
  media.insertBefore(secondary, primary.nextSibling);

  const dots = document.createElement('div');
  dots.className = 'absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/25 px-2.5 py-1.5 backdrop-blur';
  dots.dataset.secondaryCatalogMedia = 'dots';

  const firstDot = button('h-1.5 w-6 rounded-full bg-white transition-all', `תמונה 1 של ${primary.alt}`, '');
  const secondDot = button('h-1.5 w-1.5 rounded-full bg-white/65 transition-all', `תמונה 2 של ${primary.alt}`, '');
  dots.append(firstDot, secondDot);
  media.append(dots);

  const previous = button('absolute start-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl leading-none text-[#2C2C2C] shadow-md backdrop-blur', `תמונה קודמת של ${primary.alt}`, '›');
  const next = button('absolute end-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl leading-none text-[#2C2C2C] shadow-md backdrop-blur', `תמונה הבאה של ${primary.alt}`, '‹');
  media.append(previous, next);

  const show = (index: 0 | 1) => {
    media.dataset.secondaryCatalogIndex = String(index);
    primary.style.opacity = index === 0 ? '1' : '0';
    secondary.style.opacity = index === 1 ? '1' : '0';
    firstDot.className = `h-1.5 rounded-full bg-white transition-all ${index === 0 ? 'w-6' : 'w-1.5 opacity-65'}`;
    secondDot.className = `h-1.5 rounded-full bg-white transition-all ${index === 1 ? 'w-6' : 'w-1.5 opacity-65'}`;
    firstDot.setAttribute('aria-pressed', String(index === 0));
    secondDot.setAttribute('aria-pressed', String(index === 1));
  };

  const toggle = () => show(media.dataset.secondaryCatalogIndex === '1' ? 0 : 1);
  previous.addEventListener('click', toggle);
  next.addEventListener('click', toggle);
  firstDot.addEventListener('click', () => show(0));
  secondDot.addEventListener('click', () => show(1));

  let touchX = 0;
  let touchY = 0;
  media.addEventListener('touchstart', (event) => {
    touchX = event.touches[0]?.clientX ?? 0;
    touchY = event.touches[0]?.clientY ?? 0;
  }, { passive: true });
  media.addEventListener('touchend', (event) => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    const deltaX = touch.clientX - touchX;
    const deltaY = touch.clientY - touchY;
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) toggle();
  }, { passive: true });

  show(0);
}

export function installSecondaryCatalogMedia() {
  if (!isSupabaseConfigured || typeof document === 'undefined') return () => {};

  let disposed = false;
  let scheduled = false;
  const secondaryByTitle = new Map<string, string>();
  const baseTitleById = new Map(SHOP_PRODUCTS.map((product) => [product.id, product.title]));

  const apply = () => {
    if (disposed) return;
    document.querySelectorAll<HTMLElement>('#products article').forEach((article) => {
      const title = normalizeTitle(article.querySelector('h4')?.textContent);
      const secondaryUrl = secondaryByTitle.get(title);
      if (secondaryUrl) enhanceProductCard(article, secondaryUrl);
    });
  };

  const scheduleApply = () => {
    if (scheduled || disposed) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      apply();
    });
  };

  const observer = new MutationObserver(scheduleApply);
  observer.observe(document.getElementById('root') ?? document.body, { childList: true, subtree: true });

  void supabase
    .from('package_overrides')
    .select('package_id,title,image_url_2')
    .not('image_url_2', 'is', null)
    .then(({ data, error }) => {
      if (disposed || error) return;
      for (const row of (data ?? []) as SecondaryImageRow[]) {
        if (!row.package_id.startsWith('product-') || !row.image_url_2) continue;
        const title = normalizeTitle(row.title) || baseTitleById.get(row.package_id) || '';
        if (title) secondaryByTitle.set(title, row.image_url_2);
      }
      apply();
    });

  return () => {
    disposed = true;
    observer.disconnect();
  };
}
