import { afterEach, describe, expect, it } from 'vitest';
import { collectProductImages, installProductImageLightbox } from './productImageLightbox';

function image(src: string, index: number, alt = '') {
  const node = document.createElement('img');
  node.src = src;
  node.alt = alt;
  node.dataset.catalogGalleryImage = 'true';
  node.dataset.catalogImageIndex = String(index);
  node.style.opacity = index === 0 ? '1' : '0';
  if (index !== 0) node.setAttribute('aria-hidden', 'true');
  return node;
}

function buildProduct(urls: string[]) {
  const products = document.createElement('section');
  products.id = 'products';
  const article = document.createElement('article');
  const media = document.createElement('div');
  const title = document.createElement('h4');
  title.textContent = 'מוצר בדיקה';
  urls.forEach((url, index) => media.append(image(url, index, index === 0 ? 'תמונה ראשית' : '')));
  article.append(media, title);
  products.append(article);
  document.body.append(products);
  return { article, media, images: Array.from(media.querySelectorAll('img')) };
}

function touchEvent(type: string, x: number) {
  const event = new Event(type, { bubbles: true });
  Object.defineProperty(event, type === 'touchstart' ? 'touches' : 'changedTouches', {
    configurable: true,
    value: [{ clientX: x }]
  });
  return event;
}

afterEach(() => {
  document.body.replaceChildren();
  document.body.style.overflow = '';
});

describe('collectProductImages extra fallbacks', () => {
  it('returns empty when the first child is not an HTMLElement', () => {
    const article = document.createElement('article');
    article.append(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
    expect(collectProductImages(article)).toEqual([]);
  });

  it('uses the product title and then the generic fallback when image alt text is absent', () => {
    const article = document.createElement('article');
    const media = document.createElement('div');
    const title = document.createElement('h4');
    title.textContent = '  כותרת מוצר  ';
    media.append(image('https://example.com/a.jpg', 0));
    article.append(media, title);
    expect(collectProductImages(article)[0].alt).toBe('כותרת מוצר');

    title.remove();
    expect(collectProductImages(article)[0].alt).toBe('תמונת עיצוב');
  });
});

describe('installProductImageLightbox', () => {
  it('opens a product gallery, navigates with controls/keyboard/swipes, dismisses, restores focus/overflow, and cleans up', () => {
    document.body.style.overflow = 'auto';
    const { media, images } = buildProduct([
      'https://example.com/one.jpg',
      'https://example.com/two.jpg',
      'https://example.com/three.jpg'
    ]);
    media.tabIndex = 0;
    const dispose = installProductImageLightbox();
    const overlay = document.querySelector<HTMLElement>('[role="dialog"]')!;
    const shown = overlay.querySelector('img')!;
    const close = overlay.querySelector<HTMLButtonElement>('[aria-label="סגירת התמונה"]')!;
    const previous = overlay.querySelector<HTMLButtonElement>('[aria-label="התמונה הקודמת של הפריט"]')!;
    const next = overlay.querySelector<HTMLButtonElement>('[aria-label="התמונה הבאה של הפריט"]')!;
    const caption = overlay.querySelector('[aria-live="polite"]')!;

    // Hidden overlay ignores navigation keys.
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(overlay).toHaveClass('hidden');

    images[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(overlay).toHaveClass('flex');
    expect(document.body.style.overflow).toBe('hidden');
    expect(shown.src).toBe('https://example.com/one.jpg');
    expect(caption).toHaveTextContent('1 / 3');
    expect(previous.hidden).toBe(false);
    expect(next.hidden).toBe(false);

    next.click();
    expect(shown.src).toBe('https://example.com/two.jpg');
    previous.click();
    expect(shown.src).toBe('https://example.com/one.jpg');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(shown.src).toBe('https://example.com/two.jpg');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(shown.src).toBe('https://example.com/one.jpg');

    overlay.dispatchEvent(touchEvent('touchstart', 200));
    overlay.dispatchEvent(touchEvent('touchend', 190));
    expect(shown.src).toBe('https://example.com/one.jpg');
    overlay.dispatchEvent(touchEvent('touchstart', 200));
    overlay.dispatchEvent(touchEvent('touchend', 100));
    expect(shown.src).toBe('https://example.com/two.jpg');
    overlay.dispatchEvent(touchEvent('touchstart', 100));
    overlay.dispatchEvent(touchEvent('touchend', 200));
    expect(shown.src).toBe('https://example.com/one.jpg');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(overlay).toHaveClass('hidden');
    expect(document.body.style.overflow).toBe('auto');
    expect(document.activeElement).toBe(media);

    images[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    overlay.click();
    expect(overlay).toHaveClass('hidden');

    images[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    close.click();
    expect(overlay).toHaveClass('hidden');

    dispose();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('opens from the visible image when the media container itself is clicked and hides arrows for a single image', () => {
    const { media } = buildProduct(['https://example.com/only.jpg']);
    const dispose = installProductImageLightbox();
    media.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const overlay = document.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(overlay).toHaveClass('flex');
    expect(overlay.querySelector<HTMLButtonElement>('[aria-label="התמונה הקודמת של הפריט"]')!.hidden).toBe(true);
    expect(overlay.querySelector<HTMLButtonElement>('[aria-label="התמונה הבאה של הפריט"]')!.hidden).toBe(true);

    const frame = overlay.firstElementChild as HTMLElement;
    frame.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(overlay).toHaveClass('hidden');
    dispose();
  });

  it('ignores controls, non-elements, unrelated areas and media without a visible image', () => {
    const { media } = buildProduct([]);
    const control = document.createElement('button');
    media.append(control);
    const dispose = installProductImageLightbox();
    const overlay = document.querySelector<HTMLElement>('[role="dialog"]')!;

    control.click();
    expect(overlay).toHaveClass('hidden');
    document.dispatchEvent(new Event('click', { bubbles: true }));
    expect(overlay).toHaveClass('hidden');
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(overlay).toHaveClass('hidden');
    media.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(overlay).toHaveClass('hidden');
    dispose();
  });
});
