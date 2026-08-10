import { SHOP_PRODUCTS } from '../catalog/shopProducts';
import { isSupabaseConfigured, supabase } from './supabase';

interface CatalogImageRow {
  package_id: string;
  title: string | null;
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  image_url_4: string | null;
}

const normalizeTitle = (value: string | null | undefined) => value?.trim() ?? '';

export function catalogImageUrls(row: Pick<CatalogImageRow, 'image_url' | 'image_url_2' | 'image_url_3' | 'image_url_4'>): string[] {
  const seen = new Set<string>();
  return [row.image_url, row.image_url_2, row.image_url_3, row.image_url_4]
    .map((url) => url?.trim() ?? '')
    .filter((url) => {
      if (!url || seen.has(url)) return false;
      seen.add(url);
      return true;
    });
}

function button(className: string, label: string, text: string) {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = className;
  element.setAttribute('aria-label', label);
  element.textContent = text;
  element.dataset.catalogGalleryControl = 'true';
  return element;
}

function enhanceProductCard(article: HTMLElement, urls: string[]) {
  const media = article.firstElementChild;
  if (!(media instanceof HTMLElement)) return;

  const primary = media.querySelector<HTMLImageElement>('img');
  if (!primary) return;

  const primarySrc = primary.currentSrc || primary.src;
  const orderedUrls = [primarySrc, ...urls].filter((url, index, items) => Boolean(url) && items.indexOf(url) === index);
  const galleryKey = JSON.stringify(orderedUrls);
  if (media.dataset.catalogGalleryKey === galleryKey) return;

  media.querySelectorAll('[data-catalog-gallery-generated]').forEach((node) => node.remove());
  media.dataset.catalogGalleryKey = galleryKey;
  media.dataset.catalogGalleryIndex = '0';
  media.dataset.catalogGalleryCount = String(orderedUrls.length);

  primary.dataset.catalogGalleryImage = 'true';
  primary.classList.add('absolute', 'inset-0', 'transition-opacity', 'duration-300');
  primary.style.opacity = '1';
  primary.style.pointerEvents = 'auto';

  const images: HTMLImageElement[] = [primary];
  orderedUrls.slice(1).forEach((url, index) => {
    const image = document.createElement('img');
    image.src = url;
    image.alt = `${primary.alt} — תמונה ${index + 2}`;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.className = 'absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300';
    image.dataset.catalogGalleryImage = 'true';
    image.dataset.catalogGalleryGenerated = 'image';
    image.style.pointerEvents = 'none';
    media.insertBefore(image, primary.nextSibling);
    images.push(image);
  });

  if (images.length <= 1) return;

  const dots = document.createElement('div');
  dots.className = 'absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/28 px-2.5 py-1.5 backdrop-blur';
  dots.dataset.catalogGalleryGenerated = 'dots';
  dots.dataset.catalogGalleryControl = 'true';

  const dotButtons = images.map((_, dotIndex) => {
    const dot = button(
      'h-1.5 w-1.5 rounded-full bg-white/65 transition-all',
      `תמונה ${dotIndex + 1} מתוך ${images.length} של ${primary.alt}`,
      ''
    );
    dot.dataset.catalogGalleryGenerated = 'dot';
    dots.append(dot);
    return dot;
  });
  media.append(dots);

  const previous = button(
    'absolute start-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 text-xl leading-none text-[#2C2C2C] shadow-md backdrop-blur transition hover:scale-105',
    `תמונה קודמת של ${primary.alt}`,
    '›'
  );
  const next = button(
    'absolute end-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 text-xl leading-none text-[#2C2C2C] shadow-md backdrop-blur transition hover:scale-105',
    `תמונה הבאה של ${primary.alt}`,
    '‹'
  );
  previous.dataset.catalogGalleryGenerated = 'previous';
  next.dataset.catalogGalleryGenerated = 'next';
  media.append(previous, next);

  const show = (requestedIndex: number) => {
    const index = (requestedIndex + images.length) % images.length;
    media.dataset.catalogGalleryIndex = String(index);
    images.forEach((image, imageIndex) => {
      const active = imageIndex === index;
      image.style.opacity = active ? '1' : '0';
      image.style.pointerEvents = active ? 'auto' : 'none';
      image.setAttribute('aria-hidden', String(!active));
    });
    dotButtons.forEach((dot, dotIndex) => {
      const active = dotIndex === index;
      dot.className = `h-1.5 rounded-full bg-white transition-all ${active ? 'w-6' : 'w-1.5 opacity-65'}`;
      dot.setAttribute('aria-pressed', String(active));
    });
  };

  const currentIndex = () => Number.parseInt(media.dataset.catalogGalleryIndex ?? '0', 10) || 0;
  previous.addEventListener('click', () => show(currentIndex() - 1));
  next.addEventListener('click', () => show(currentIndex() + 1));
  dotButtons.forEach((dot, dotIndex) => dot.addEventListener('click', () => show(dotIndex)));

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
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      show(currentIndex() + (deltaX < 0 ? 1 : -1));
    }
  }, { passive: true });

  show(0);
}

export function installSecondaryCatalogMedia() {
  if (!isSupabaseConfigured || typeof document === 'undefined') return () => {};

  let disposed = false;
  let scheduled = false;
  const galleryByTitle = new Map<string, string[]>();
  const baseTitleById = new Map(SHOP_PRODUCTS.map((product) => [product.id, product.title]));

  const apply = () => {
    if (disposed) return;
    document.querySelectorAll<HTMLElement>('#products article').forEach((article) => {
      const title = normalizeTitle(article.querySelector('h4')?.textContent);
      const urls = galleryByTitle.get(title);
      if (urls?.length) enhanceProductCard(article, urls);
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
    .select('package_id,title,image_url,image_url_2,image_url_3,image_url_4')
    .then(({ data, error }) => {
      if (disposed || error) return;
      for (const row of (data ?? []) as CatalogImageRow[]) {
        if (!row.package_id.startsWith('product-')) continue;
        const urls = catalogImageUrls(row);
        if (urls.length === 0) continue;
        const title = normalizeTitle(row.title) || baseTitleById.get(row.package_id) || '';
        if (title) galleryByTitle.set(title, urls);
      }
      apply();
    });

  return () => {
    disposed = true;
    observer.disconnect();
  };
}
