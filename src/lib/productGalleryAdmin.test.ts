import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import type { PackageOverride } from './packages';

const state = vi.hoisted(() => ({
  configured: true,
  overrides: {} as Record<string, PackageOverride>,
  fetch: vi.fn(),
  saveImage: vi.fn(),
  upload: vi.fn()
}));

vi.mock('./supabase', () => ({
  get isSupabaseConfigured() {
    return state.configured;
  }
}));
vi.mock('./packages', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./packages')>();
  return {
    ...actual,
    fetchPackageOverrides: state.fetch,
    savePackageImage: state.saveImage,
    uploadPackageImage: state.upload
  };
});

import { SHOP_PRODUCTS, SHOP_PRODUCT_CATEGORIES } from '../catalog/shopProducts';
import { installProductGalleryAdmin } from './productGalleryAdmin';

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function override(input: Partial<PackageOverride> & { package_id: string }): PackageOverride {
  return {
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
    sort_order: null,
    ...input,
    package_id: input.package_id
  };
}

function addAdminHost(helpText = 'אפשר להעלות שתי תמונות לכל מוצר') {
  const root = document.getElementById('root') ?? document.body.appendChild(document.createElement('div'));
  root.id = 'root';
  const host = document.createElement('div');
  host.id = 'admin-products';
  const section = document.createElement('section');
  const p = document.createElement('p');
  p.textContent = helpText;
  section.append(p);
  host.append(section);
  root.append(host);
  return { host, p };
}

beforeEach(() => {
  document.body.innerHTML = '<div id="root"></div>';
  state.configured = true;
  state.overrides = {};
  state.fetch.mockReset().mockImplementation(async () => state.overrides);
  state.saveImage.mockReset().mockResolvedValue(undefined);
  state.upload.mockReset().mockResolvedValue('https://cdn.example/new.jpg');
});

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('installProductGalleryAdmin', () => {
  it('is safe when Supabase is disabled', async () => {
    state.configured = false;
    addAdminHost();
    const dispose = installProductGalleryAdmin();
    await tick();
    expect(state.fetch).not.toHaveBeenCalled();
    expect(document.querySelector('[data-four-image-admin="true"]')).toBeNull();
    dispose();
  });

  it('waits for the admin host, mounts once, renders base/custom products in order and updates the old help text', async () => {
    const first = SHOP_PRODUCTS[0];
    state.overrides = {
      [first.id]: override({
        package_id: first.id,
        title: 'שם מנהל',
        category: SHOP_PRODUCT_CATEGORIES.ENTRANCE,
        image_url: 'https://cdn.example/old.jpg'
      }),
      'product-custom-late': override({
        package_id: 'product-custom-late',
        is_custom: true,
        title: 'אחרון',
        category: SHOP_PRODUCT_CATEGORIES.CHUPPAH,
        sort_order: 20
      }),
      'product-custom-early': override({
        package_id: 'product-custom-early',
        is_custom: true,
        title: null,
        category: null,
        sort_order: 10
      }),
      'custom-package-ignore': override({
        package_id: 'custom-package-ignore',
        is_custom: true,
        title: 'לא מוצר',
        sort_order: 1
      })
    };

    const dispose = installProductGalleryAdmin();
    expect(state.fetch).not.toHaveBeenCalled();
    const { host, p } = addAdminHost();
    await tick();
    await tick();

    const manager = host.querySelector<HTMLElement>('[data-four-image-admin="true"]')!;
    expect(manager).toBeTruthy();
    expect(state.fetch).toHaveBeenCalledTimes(1);
    expect(manager).toHaveTextContent('גלריית תמונות למוצרים');
    expect(manager).toHaveTextContent('שם מנהל');
    expect(manager).toHaveTextContent('מוצר ללא שם');
    expect(manager).not.toHaveTextContent('לא מוצר');
    expect(manager.textContent!.indexOf('מוצר ללא שם')).toBeLessThan(manager.textContent!.indexOf('אחרון'));
    expect(p).toHaveTextContent('לניהול מלא של 4 התמונות');
    expect(manager.querySelectorAll('[data-gallery-slot]')).toHaveLength((SHOP_PRODUCTS.length + 2) * 4);

    const editedCard = Array.from(manager.querySelectorAll<HTMLElement>('article')).find((card) => card.querySelector('h4')?.textContent === 'שם מנהל')!;
    const firstSlot = editedCard.querySelector<HTMLElement>('[data-gallery-slot="1"]')!;
    expect(firstSlot.querySelector('img')).toHaveAttribute('src', 'https://cdn.example/old.jpg');
    expect(firstSlot.querySelector('button[aria-label^="הסרת תמונה 1"]')).toBeTruthy();
    expect(firstSlot.querySelector('input[type="file"]')?.parentElement).toHaveTextContent('החלפת תמונה 1');

    document.getElementById('root')!.append(document.createElement('span'));
    await tick();
    expect(host.querySelectorAll('[data-four-image-admin="true"]')).toHaveLength(1);
    expect(state.fetch).toHaveBeenCalledTimes(1);

    dispose();
    expect(document.querySelector('[data-four-image-admin="true"]')).toBeNull();
  });

  it('uploads a slot, persists it, creates local override state and removes it again', async () => {
    const first = SHOP_PRODUCTS[0];
    const { host } = addAdminHost('different copy');
    const dispose = installProductGalleryAdmin();
    await tick();

    const input = host.querySelector<HTMLInputElement>(`[aria-label="העלאת תמונה 2 של ${first.title}"]`)!;
    const slot = input.closest<HTMLElement>('[data-gallery-slot="2"]')!;
    fireEvent.change(input, {
      target: { files: [new File(['img'], 'photo.jpg', { type: 'image/jpeg' })] }
    });
    await tick();
    await tick();

    expect(state.upload).toHaveBeenCalledTimes(1);
    expect(state.saveImage).toHaveBeenCalledWith(first.id, 'https://cdn.example/new.jpg', 2);
    expect(slot.querySelector('img')).toHaveAttribute('src', 'https://cdn.example/new.jpg');
    expect(slot).toHaveTextContent('נשמר');
    expect(input.parentElement).toHaveTextContent('החלפת תמונה 2');

    const remove = slot.querySelector<HTMLButtonElement>('button[aria-label^="הסרת תמונה 2"]')!;
    expect(remove).toBeTruthy();
    remove.click();
    await tick();
    expect(state.saveImage).toHaveBeenLastCalledWith(first.id, null, 2);
    expect(slot.querySelector('img')).toBeNull();
    expect(slot).toHaveTextContent('אין תמונה');

    const calls = state.saveImage.mock.calls.length;
    fireEvent.change(input, { target: { files: [] } });
    await tick();
    expect(state.saveImage).toHaveBeenCalledTimes(calls);
    dispose();
  });

  it('shows recoverable upload/remove errors and does not mount after disposal during a pending fetch', async () => {
    const first = SHOP_PRODUCTS[0];
    state.overrides = {
      [first.id]: override({ package_id: first.id, image_url: 'https://cdn.example/old.jpg' })
    };
    const { host } = addAdminHost();
    state.upload.mockRejectedValueOnce(new Error('upload'));
    const dispose = installProductGalleryAdmin();
    await tick();

    const input = host.querySelector<HTMLInputElement>(`[aria-label="העלאת תמונה 3 של ${first.title}"]`)!;
    fireEvent.change(input, { target: { files: [new File(['x'], 'bad.jpg', { type: 'image/jpeg' })] } });
    await tick();
    expect(input.closest('[data-gallery-slot="3"]')).toHaveTextContent('שגיאה');
    expect(input.disabled).toBe(false);

    state.saveImage.mockRejectedValueOnce(new Error('remove'));
    const firstSlot = host.querySelector<HTMLElement>('[data-four-image-admin="true"] article [data-gallery-slot="1"]')!;
    const remove = firstSlot.querySelector<HTMLButtonElement>('button[aria-label^="הסרת תמונה 1"]')!;
    expect(remove).toBeTruthy();
    remove.click();
    await tick();
    expect(firstSlot).toHaveTextContent('שגיאה');
    expect(remove.disabled).toBe(false);
    dispose();

    document.body.innerHTML = '<div id="root"><div id="admin-products"></div></div>';
    let resolveFetch!: (value: Record<string, PackageOverride>) => void;
    state.fetch.mockReset().mockImplementationOnce(() => new Promise((resolve) => { resolveFetch = resolve; }));
    const pendingDispose = installProductGalleryAdmin();
    await tick();
    pendingDispose();
    resolveFetch({});
    await tick();
    expect(document.querySelector('[data-four-image-admin="true"]')).toBeNull();
  });
});
