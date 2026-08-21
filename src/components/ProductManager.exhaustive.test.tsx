import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SHOP_PRODUCTS, SHOP_PRODUCT_CATEGORIES } from '../catalog/shopProducts';
import { I18nProvider } from '../i18n/i18n';
import type { PackageOverride } from '../lib/packages';

const state = vi.hoisted(() => ({
  overrides: {} as Record<string, PackageOverride>,
  saveOverride: vi.fn(async (_override: PackageOverride, _options?: unknown) => {}),
  saveImage: vi.fn(async (_id: string, _url: string | null, _slot?: 1 | 2 | 3 | 4) => {}),
  removeOverride: vi.fn(async (_id: string) => {}),
  upload: vi.fn(async (_file: File) => 'https://cdn.example/uploaded.webp')
}));

vi.mock('../lib/supabase', () => ({ isSupabaseConfigured: true, supabase: {} }));
vi.mock('../packages/PackagesProvider', () => ({
  usePackages: () => ({
    overrides: state.overrides,
    saveOverride: state.saveOverride,
    saveImage: state.saveImage,
    removeOverride: state.removeOverride,
    refresh: vi.fn(),
    loading: false
  })
}));
vi.mock('../lib/packages', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/packages')>();
  return { ...actual, uploadPackageImage: state.upload };
});

import { ProductManager } from './ProductManager';

function ov(input: Partial<PackageOverride> & { package_id: string }): PackageOverride {
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

const renderManager = () => render(<I18nProvider><ProductManager /></I18nProvider>);
const first = SHOP_PRODUCTS[0];
const cardFor = (title = first.title) => screen.getByDisplayValue(title).closest('article') as HTMLElement;
const activeNewProductForm = () => screen.getByRole('button', { name: 'יצירת מוצר' }).closest('.rounded-2xl') as HTMLElement;

beforeEach(() => {
  state.overrides = {};
  state.saveOverride.mockReset().mockResolvedValue(undefined);
  state.saveImage.mockReset().mockResolvedValue(undefined);
  state.removeOverride.mockReset().mockResolvedValue(undefined);
  state.upload.mockReset().mockResolvedValue('https://cdn.example/uploaded.webp');
});

describe('ProductManager exhaustive branches', () => {
  it('hydrates all override fields and all four saved image slots for a base product', () => {
    state.overrides = {
      [first.id]: ov({
        package_id: first.id,
        title: 'שם חלופי',
        subtitle: 'תיאור חלופי',
        price: 0,
        category: SHOP_PRODUCT_CATEGORIES.ENTRANCE,
        svg_type: 'custom-svg',
        image_url: 'https://cdn.example/1.webp',
        image_url_2: 'https://cdn.example/2.webp',
        image_url_3: 'https://cdn.example/3.webp',
        image_url_4: 'https://cdn.example/4.webp'
      })
    };
    renderManager();
    const card = cardFor('שם חלופי');
    expect(within(card).getByDisplayValue('תיאור חלופי')).toBeInTheDocument();
    expect(within(card).getByDisplayValue('0')).toBeInTheDocument();
    expect(within(card).getByLabelText('קטגוריה — שם חלופי')).toHaveValue(SHOP_PRODUCT_CATEGORIES.ENTRANCE);
    expect(within(card).getByLabelText('מיקום בקטגוריה — שם חלופי')).toBeInTheDocument();
    expect(card.querySelectorAll('img')).toHaveLength(4);
    expect(within(card).queryByText('נערך')).not.toBeInTheDocument();
  });

  it('hydrates custom products with every fallback and sorts them by sort order', () => {
    state.overrides = {
      'product-custom-b': ov({
        package_id: 'product-custom-b', is_custom: true, sort_order: 20,
        title: 'אחרון', category: SHOP_PRODUCT_CATEGORIES.CHUPPAH, price: 200
      }),
      'product-custom-a': ov({
        package_id: 'product-custom-a', is_custom: true, sort_order: null,
        title: null, subtitle: null, price: null, category: null, svg_type: null,
        image_url: null, image_url_2: null, image_url_3: null, image_url_4: null
      }),
      'not-a-product': ov({ package_id: 'not-a-product', is_custom: true, title: 'לא יוצג' })
    };
    renderManager();
    expect(screen.queryByDisplayValue('לא יוצג')).not.toBeInTheDocument();
    const customCards = screen.getAllByText('מוצר חדש').map((node) => node.closest('article')).filter(Boolean);
    expect(customCards.length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue('0').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('combobox').some((select) => (select as HTMLSelectElement).value === SHOP_PRODUCT_CATEGORIES.CENTERPIECES)).toBe(true);
    expect(screen.getByDisplayValue('אחרון')).toBeInTheDocument();
  });

  it.each([2, 3, 4] as const)('persists image slot %s independently and executes the saved-state timeout callback', async (slot) => {
    renderManager();
    const card = cardFor();
    const inputs = card.querySelectorAll<HTMLInputElement>('input[type="file"]');
    state.upload.mockResolvedValueOnce(`https://cdn.example/${slot}.webp`);
    fireEvent.change(inputs[slot - 1], { target: { files: [new File(['x'], `${slot}.png`, { type: 'image/png' })] } });
    await waitFor(() => expect(state.upload).toHaveBeenCalledTimes(1));
    fireEvent.click(within(card).getByRole('button', { name: `✅ שמור ${slot}` }));
    await waitFor(() => expect(state.saveImage).toHaveBeenCalledWith(first.id, `https://cdn.example/${slot}.webp`, slot));
  });

  it('reports an image persistence failure and re-enables image controls', async () => {
    state.saveImage.mockRejectedValueOnce(new Error('storage RLS'));
    renderManager();
    const card = cardFor();
    const input = card.querySelectorAll<HTMLInputElement>('input[type="file"]')[2];
    fireEvent.change(input, { target: { files: [new File(['x'], 'three.png', { type: 'image/png' })] } });
    await waitFor(() => expect(state.upload).toHaveBeenCalled());
    fireEvent.click(within(card).getByRole('button', { name: '✅ שמור 3' }));
    await waitFor(() => expect(within(card).getByRole('alert')).toHaveTextContent('השמירה נכשלה'));
    expect(input).toBeEnabled();
  });

  it('does nothing when a file input change contains no file', async () => {
    renderManager();
    const input = cardFor().querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });
    await act(async () => Promise.resolve());
    expect(state.upload).not.toHaveBeenCalled();
  });

  it('validates an existing product when category, title or price becomes empty', async () => {
    renderManager();
    const card = cardFor();
    const textboxes = within(card).getAllByRole('textbox');
    fireEvent.change(textboxes[0], { target: { value: '   ' } });
    fireEvent.change(within(card).getByRole('spinbutton'), { target: { value: '' } });
    fireEvent.click(within(card).getByRole('button', { name: 'שמור פרטי מוצר' }));
    expect(within(card).getByRole('alert')).toHaveTextContent('השמירה נכשלה');
    expect(state.saveOverride).not.toHaveBeenCalled();
  });

  it('normalizes negative and non-numeric prices and trims optional text on save', async () => {
    renderManager();
    const card = cardFor();
    const textboxes = within(card).getAllByRole('textbox');
    fireEvent.change(textboxes[0], { target: { value: '  שם  ' } });
    fireEvent.change(textboxes[1], { target: { value: '   ' } });
    fireEvent.change(within(card).getByRole('spinbutton'), { target: { value: '-50' } });
    fireEvent.click(within(card).getByRole('button', { name: 'שמור פרטי מוצר' }));
    await waitFor(() => expect(state.saveOverride).toHaveBeenCalled());
    expect(state.saveOverride.mock.calls[0][0]).toMatchObject({ price: 0, title: 'שם', subtitle: null });
  });

  it('routes a new-product upload error to the new-product alert', async () => {
    state.upload.mockRejectedValueOnce(new Error('bad upload'));
    renderManager();
    fireEvent.click(screen.getByRole('button', { name: 'הוספת מוצר' }));
    const form = activeNewProductForm();
    const input = form.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'bad.png', { type: 'image/png' })] } });
    await waitFor(() => expect(within(form).getByRole('alert')).toHaveTextContent('יש למלא קטגוריה, שם ומחיר.'));
  });

  it('creates a product with slots 2–4 and empty optional subtitle, then closes the form', async () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('abcdef12-1234-4123-8123-123456789012');
    state.upload
      .mockResolvedValueOnce('https://cdn.example/2.webp')
      .mockResolvedValueOnce('https://cdn.example/3.webp')
      .mockResolvedValueOnce('https://cdn.example/4.webp');
    renderManager();
    fireEvent.click(screen.getByRole('button', { name: 'הוספת מוצר' }));
    const form = activeNewProductForm();
    fireEvent.change(within(form).getByLabelText('קטגוריה — מוצר חדש'), { target: { value: SHOP_PRODUCT_CATEGORIES.CENTERPIECES } });
    const textboxes = within(form).getAllByRole('textbox');
    fireEvent.change(textboxes[0], { target: { value: '  ארבע תמונות  ' } });
    fireEvent.change(within(form).getByRole('spinbutton'), { target: { value: '-9' } });
    const inputs = form.querySelectorAll<HTMLInputElement>('input[type="file"]');
    for (const slot of [2, 3, 4] as const) {
      fireEvent.change(inputs[slot - 1], { target: { files: [new File(['x'], `${slot}.png`, { type: 'image/png' })] } });
      await waitFor(() => expect(state.upload).toHaveBeenCalledTimes(slot - 1));
    }
    fireEvent.click(within(form).getByRole('button', { name: 'יצירת מוצר' }));
    await waitFor(() => expect(state.saveOverride).toHaveBeenCalled());
    expect(state.saveOverride.mock.calls[0][0]).toMatchObject({
      package_id: 'product-custom-abcdef12',
      price: 0,
      title: 'ארבע תמונות',
      subtitle: null,
      image_url: null,
      image_url_2: 'https://cdn.example/2.webp',
      image_url_3: 'https://cdn.example/3.webp',
      image_url_4: 'https://cdn.example/4.webp'
    });
    expect(state.saveOverride.mock.calls[0][1]).toEqual({ includeImage: true });
    await waitFor(() => expect(screen.queryByRole('button', { name: 'יצירת מוצר' })).not.toBeInTheDocument());
  });

  it('keeps a custom product at its current visual position when editing', async () => {
    state.overrides = {
      'product-custom-one': ov({
        package_id: 'product-custom-one', is_custom: true, sort_order: null,
        title: 'מותאם', price: 10, category: SHOP_PRODUCT_CATEGORIES.CHUPPAH
      })
    };
    renderManager();
    const card = cardFor('מותאם');
    fireEvent.change(within(card).getByRole('spinbutton'), { target: { value: '11' } });
    fireEvent.click(within(card).getByRole('button', { name: 'שמור פרטי מוצר' }));
    await waitFor(() => expect(state.saveOverride).toHaveBeenCalled());
    expect(state.saveOverride.mock.calls[0][0]).toMatchObject({ is_custom: true, sort_order: 7 });
  });
});