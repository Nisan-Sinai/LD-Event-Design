import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  configured: true,
  data: [] as Array<Record<string, unknown>>,
  error: null as unknown
}));

vi.mock('./supabase', () => ({
  get isSupabaseConfigured() {
    return state.configured;
  },
  supabase: {
    from: () => ({
      select: async () => ({ data: state.data, error: state.error })
    })
  }
}));

import { SHOP_PRODUCTS } from '../catalog/shopProducts';
import { installSecondaryCatalogMedia } from './secondaryCatalogMedia';

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function buildArticle(titleText: string, primarySrc = 'https://example.com/primary.jpg') {
  let products = document.getElementById('products');
  if (!products) {
    products = document.createElement('section');
    products.id = 'products';
    document.body.append(products);
  }
  const article = document.createElement('article');
  const media = document.createElement('div');
  const img = document.createElement('img');
  img.src = primarySrc;
  img.alt = titleText;
  media.append(img);
  const title = document.createElement('h4');
  title.textContent = titleText;
  article.append(media, title);
  products.append(article);
  return { article, media, img };
}

function touch(type: string, x: number, y: number) {
  const event = new Event(type, { bubbles: true });
  Object.defineProperty(event, type === 'touchstart' ? 'touches' : 'changedTouches', {
    configurable: true,
    value: [{ clientX: x, clientY: y }]
  });
  return event;
}

beforeEach(() => {
  document.body.innerHTML = '<div id="root"></div>';
  state.configured = true;
  state.data = [];
  state.error = null;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    callback(0);
    return 1;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe('installSecondaryCatalogMedia', () => {
  it('is a no-op when Supabase is unavailable', () => {
    state.configured = false;
    const dispose = installSecondaryCatalogMedia();
    buildArticle('No gallery');
    expect(document.querySelector('[data-catalog-gallery-generated]')).toBeNull();
    dispose();
  });

  it('builds a four-image gallery for a base product and supports arrows, dots and horizontal swipes', async () => {
    const product = SHOP_PRODUCTS[0];
    const primary = 'https://example.com/one.jpg';
    state.data = [
      { package_id: 'not-a-product', title: 'skip', image_url: 'skip', image_url_2: null, image_url_3: null, image_url_4: null },
      { package_id: 'product-empty', title: 'empty', image_url: null, image_url_2: null, image_url_3: null, image_url_4: null },
      {
        package_id: product.id,
        title: null,
        image_url: primary,
        image_url_2: 'https://example.com/two.jpg',
        image_url_3: 'https://example.com/three.jpg',
        image_url_4: 'https://example.com/four.jpg'
      }
    ];
    const { media } = buildArticle(product.title, primary);
    const dispose = installSecondaryCatalogMedia();
    await tick();

    const images = Array.from(media.querySelectorAll<HTMLImageElement>('[data-catalog-gallery-image="true"]'));
    expect(images).toHaveLength(4);
    expect(media.dataset.catalogGalleryCount).toBe('4');
    expect(media.querySelectorAll('[data-catalog-gallery-generated="dot"]')).toHaveLength(4);

    const next = media.querySelector<HTMLButtonElement>('[data-catalog-gallery-generated="next"]')!;
    const previous = media.querySelector<HTMLButtonElement>('[data-catalog-gallery-generated="previous"]')!;
    const dots = Array.from(media.querySelectorAll<HTMLButtonElement>('[data-catalog-gallery-generated="dot"]'));

    next.click();
    expect(media.dataset.catalogGalleryIndex).toBe('1');
    expect(media.querySelector<HTMLImageElement>('[data-catalog-image-index="1"]')?.style.opacity).toBe('1');
    previous.click();
    expect(media.dataset.catalogGalleryIndex).toBe('0');
    dots[3].click();
    expect(media.dataset.catalogGalleryIndex).toBe('3');

    media.dataset.catalogGalleryIndex = 'not-a-number';
    next.click();
    expect(media.dataset.catalogGalleryIndex).toBe('1');

    media.dispatchEvent(touch('touchstart', 200, 10));
    media.dispatchEvent(touch('touchend', 100, 15));
    expect(media.dataset.catalogGalleryIndex).toBe('2');
    media.dispatchEvent(touch('touchstart', 100, 10));
    media.dispatchEvent(touch('touchend', 200, 15));
    expect(media.dataset.catalogGalleryIndex).toBe('1');
    media.dispatchEvent(touch('touchstart', 100, 10));
    media.dispatchEvent(touch('touchend', 150, 200));
    expect(media.dataset.catalogGalleryIndex).toBe('1');

    document.getElementById('root')!.append(document.createElement('span'));
    await tick();
    expect(media.querySelectorAll('[data-catalog-gallery-generated="next"]')).toHaveLength(1);

    dispose();
  });

  it('handles missing/invalid product media, one-image galleries, custom titles, API errors and disposal before async data resolves', async () => {
    const product = SHOP_PRODUCTS[1];
    state.data = [
      {
        package_id: 'product-custom-qa',
        title: '  מוצר מותאם  ',
        image_url: 'https://example.com/custom.jpg',
        image_url_2: null,
        image_url_3: null,
        image_url_4: null
      },
      {
        package_id: product.id,
        title: null,
        image_url: 'https://example.com/base.jpg',
        image_url_2: null,
        image_url_3: null,
        image_url_4: null
      }
    ];

    const products = document.createElement('section');
    products.id = 'products';
    const noMedia = document.createElement('article');
    noMedia.append(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
    const noImage = document.createElement('article');
    noImage.append(document.createElement('div'));
    products.append(noMedia, noImage);
    document.body.append(products);
    const custom = buildArticle('מוצר מותאם', 'https://example.com/custom.jpg');
    const base = buildArticle(product.title, 'https://example.com/base.jpg');

    const dispose = installSecondaryCatalogMedia();
    await tick();
    expect(custom.media.dataset.catalogGalleryCount).toBe('1');
    expect(custom.media.querySelector('[data-catalog-gallery-generated="next"]')).toBeNull();
    expect(base.media.dataset.catalogGalleryCount).toBe('1');
    dispose();

    state.error = new Error('api');
    const errorDispose = installSecondaryCatalogMedia();
    await tick();
    errorDispose();
  });
});
