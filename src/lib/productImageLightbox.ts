interface GalleryImage {
  src: string;
  alt: string;
}

const CONTROL_SELECTOR = 'button, a, [data-catalog-gallery-control="true"], [data-secondary-catalog-media="control"], [data-secondary-catalog-media="dots"]';

export function collectProductImages(article: HTMLElement): GalleryImage[] {
  const media = article.firstElementChild;
  if (!(media instanceof HTMLElement)) return [];

  const seen = new Set<string>();
  const images: GalleryImage[] = [];
  const productImages = Array.from(media.querySelectorAll<HTMLImageElement>('img[data-catalog-gallery-image="true"], img'))
    .sort((a, b) => {
      const aIndex = Number.parseInt(a.dataset.catalogImageIndex ?? '0', 10) || 0;
      const bIndex = Number.parseInt(b.dataset.catalogImageIndex ?? '0', 10) || 0;
      return aIndex - bIndex;
    });

  productImages.forEach((image) => {
    const src = image.currentSrc || image.src;
    if (!src || seen.has(src)) return;
    seen.add(src);
    images.push({
      src,
      alt: image.alt || article.querySelector('h4')?.textContent?.trim() || 'תמונת עיצוב'
    });
  });
  return images;
}

function createIconButton(label: string, text: string, className: string) {
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-label', label);
  button.textContent = text;
  button.className = className;
  return button;
}

export function installProductImageLightbox() {
  if (typeof document === 'undefined') return () => {};

  let gallery: GalleryImage[] = [];
  let index = 0;
  let touchStartX = 0;
  let previousOverflow = '';
  let trigger: HTMLElement | null = null;

  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[1000] hidden items-center justify-center bg-black/92 p-3 backdrop-blur-sm sm:p-6';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'תצוגת תמונה מוגדלת');

  const frame = document.createElement('div');
  frame.className = 'relative flex h-full w-full max-w-6xl items-center justify-center overflow-hidden rounded-2xl';

  const image = document.createElement('img');
  image.className = 'max-h-full max-w-full select-none object-contain';
  image.draggable = false;

  const close = createIconButton(
    'סגירת התמונה',
    '×',
    'absolute end-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-3xl leading-none text-[#2C2C2C] shadow-xl transition hover:scale-105'
  );
  const previous = createIconButton(
    'התמונה הקודמת של הפריט',
    '›',
    'absolute start-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-3xl leading-none text-[#2C2C2C] shadow-xl transition hover:scale-105 sm:start-5'
  );
  const next = createIconButton(
    'התמונה הבאה של הפריט',
    '‹',
    'absolute end-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-3xl leading-none text-[#2C2C2C] shadow-xl transition hover:scale-105 sm:end-5'
  );

  const caption = document.createElement('div');
  caption.className = 'absolute bottom-3 left-1/2 z-20 max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-full bg-black/65 px-4 py-2 text-center text-xs font-bold text-white backdrop-blur sm:bottom-5 sm:text-sm';
  caption.setAttribute('aria-live', 'polite');

  frame.append(image, close, previous, next, caption);
  overlay.append(frame);
  document.body.append(overlay);

  const show = (nextIndex: number) => {
    if (gallery.length === 0) return;
    index = (nextIndex + gallery.length) % gallery.length;
    const current = gallery[index];
    image.src = current.src;
    image.alt = current.alt;
    caption.textContent = `${current.alt} · ${index + 1} / ${gallery.length}`;
    const hasMultiple = gallery.length > 1;
    previous.hidden = !hasMultiple;
    next.hidden = !hasMultiple;
  };

  const open = (images: GalleryImage[], startSrc: string, opener: HTMLElement) => {
    gallery = images;
    if (gallery.length === 0) return;
    const startIndex = gallery.findIndex((item) => item.src === startSrc);
    show(startIndex >= 0 ? startIndex : 0);
    trigger = opener;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    close.focus();
  };

  const dismiss = () => {
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
    document.body.style.overflow = previousOverflow;
    trigger?.focus({ preventScroll: true });
    trigger = null;
  };

  const onDocumentClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest(CONTROL_SELECTOR)) return;

    const media = target.closest<HTMLElement>('#products article > div:first-child');
    if (!media) return;
    const article = media.closest<HTMLElement>('article');
    if (!article) return;

    const clickedImage = target.closest<HTMLImageElement>('img');
    const visibleImage = clickedImage ?? Array.from(media.querySelectorAll<HTMLImageElement>('img')).find((item) => {
      const opacity = Number.parseFloat(getComputedStyle(item).opacity || '1');
      return opacity > 0.5 && item.getAttribute('aria-hidden') !== 'true';
    });
    if (!visibleImage) return;

    const images = collectProductImages(article);
    open(images, visibleImage.currentSrc || visibleImage.src, media);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (overlay.classList.contains('hidden')) return;
    if (event.key === 'Escape') dismiss();
    if (event.key === 'ArrowLeft') show(index + 1);
    if (event.key === 'ArrowRight') show(index - 1);
  };

  close.addEventListener('click', dismiss);
  previous.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay || event.target === frame) dismiss();
  });
  overlay.addEventListener('touchstart', (event) => {
    touchStartX = event.touches[0]?.clientX ?? 0;
  }, { passive: true });
  overlay.addEventListener('touchend', (event) => {
    const endX = event.changedTouches[0]?.clientX ?? touchStartX;
    const deltaX = endX - touchStartX;
    if (Math.abs(deltaX) < 45) return;
    show(index + (deltaX < 0 ? 1 : -1));
  }, { passive: true });
  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onKeyDown);

  return () => {
    document.removeEventListener('click', onDocumentClick);
    document.removeEventListener('keydown', onKeyDown);
    overlay.remove();
    document.body.style.overflow = previousOverflow;
  };
}
