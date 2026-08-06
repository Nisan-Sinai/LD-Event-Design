import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { SHOP_PRODUCTS, SHOP_PRODUCT_CATEGORIES } from '../catalog/shopProducts';
import { I18nProvider } from '../i18n/i18n';
import type { PackageOverride } from '../lib/packages';

const state = vi.hoisted(() => ({
  configured: true,
  overrides: {} as Record<string, PackageOverride>,
  saveOverride: vi.fn(async (_override: PackageOverride) => {}),
  removeOverride: vi.fn(async (_id: string) => {}),
  upload: vi.fn(async (_file: File) => 'https://cdn.example/product.webp')
}));

vi.mock('../lib/supabase', () => ({
  get isSupabaseConfigured() {
    return state.configured;
  },
  supabase: {}
}));

vi.mock('../packages/PackagesProvider', () => ({
  usePackages: () => ({
    overrides: state.overrides,
    saveOverride: state.saveOverride,
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

function override(input: Partial<PackageOverride> & { package_id: string }): PackageOverride {
  return {
    package_id: input.package_id,
    price: null,
    title: null,
    subtitle: null,
    description: null,
    benefits: null,
    image_url: null,
    category: null,
    svg_type: null,
    pricing_tiers: null,
    hidden: false,
    is_custom: false,
    sort_order: null,
    ...input
  };
}

const renderManager = () => render(<I18nProvider><ProductManager /></I18nProvider>);
const firstProduct = SHOP_PRODUCTS[0];

function productCard(title = firstProduct.title) {
  return screen.getByDisplayValue(title).closest('article') as HTMLElement;
}

beforeEach(() => {
  state.configured = true;
  state.overrides = {};
  state.saveOverride.mockReset().mockResolvedValue(undefined);
  state.removeOverride.mockReset().mockResolvedValue(undefined);
  state.upload.mockReset().mockResolvedValue('https://cdn.example/product.webp');
});

describe('ProductManager', () => {
  it('renders nothing when Supabase is not configured', () => {
    state.configured = false;
    renderManager();
    expect(screen.queryByText('מוצרים קטנים בחנות')).not.toBeInTheDocument();
  });

  it('renders every small product with editable fields', () => {
    renderManager();
    expect(screen.getByText('מוצרים קטנים בחנות')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'שמירה' })).toHaveLength(SHOP_PRODUCTS.length);
    expect(screen.getByDisplayValue(firstProduct.title)).toBeInTheDocument();
    expect(screen.getByDisplayValue(String(firstProduct.price))).toBeInTheDocument();
  });

  it('changes product text, category and price and saves the override', async () => {
    renderManager();
    const card = productCard();
    const inputs = within(card).getAllByRole('textbox');
    const select = within(card).getByRole('combobox');
    const price = within(card).getByRole('spinbutton');

    fireEvent.change(select, { target: { value: SHOP_PRODUCT_CATEGORIES.ENTRANCE } });
    fireEvent.change(inputs[0], { target: { value: 'מוצר חדש' } });
    fireEvent.change(inputs[1], { target: { value: 'תיאור חדש' } });
    fireEvent.change(price, { target: { value: '777' } });
    fireEvent.click(within(card).getByRole('button', { name: 'שמירה' }));

    await waitFor(() => expect(state.saveOverride).toHaveBeenCalled());
    expect(state.saveOverride.mock.calls[0][0]).toMatchObject({
      package_id: firstProduct.id,
      title: 'מוצר חדש',
      subtitle: 'תיאור חדש',
      category: SHOP_PRODUCT_CATEGORIES.ENTRANCE,
      price: 777,
      is_custom: false
    });
  });

  it('uploads and saves a product image', async () => {
    renderManager();
    const card = productCard();
    const fileInput = card.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(['image'], 'product.png', { type: 'image/png' })] } });

    await waitFor(() => expect(state.upload).toHaveBeenCalled());
    await waitFor(() => expect(card.querySelector('img')).toHaveAttribute('src', 'https://cdn.example/product.webp'));
    fireEvent.click(within(card).getByRole('button', { name: 'שמירה' }));
    await waitFor(() => expect(state.saveOverride).toHaveBeenCalled());
    expect(state.saveOverride.mock.calls[0][0]).toMatchObject({ image_url: 'https://cdn.example/product.webp' });
  });

  it('removes an existing image before saving', () => {
    state.overrides = {
      [firstProduct.id]: override({ package_id: firstProduct.id, image_url: 'https://cdn.example/old.webp' })
    };
    renderManager();
    const card = productCard();
    expect(card.querySelector('img')).toBeInTheDocument();
    fireEvent.click(within(card).getByRole('button', { name: 'הסרת תמונה' }));
    expect(card.querySelector('img')).not.toBeInTheDocument();
  });

  it('hides and shows a product in the public shop', async () => {
    renderManager();
    fireEvent.click(within(productCard()).getByRole('button', { name: 'הסתרה מהחנות' }));
    await waitFor(() => expect(state.saveOverride).toHaveBeenCalled());
    expect(state.saveOverride.mock.calls[0][0]).toMatchObject({ hidden: true });

    state.saveOverride.mockClear();
    state.overrides = {
      [firstProduct.id]: override({ package_id: firstProduct.id, hidden: true })
    };
    const secondRender = renderManager();
    const cards = screen.getAllByDisplayValue(firstProduct.title);
    const hiddenCard = cards[cards.length - 1].closest('article') as HTMLElement;
    fireEvent.click(within(hiddenCard).getByRole('button', { name: 'הצגה בחנות' }));
    await waitFor(() => expect(state.saveOverride).toHaveBeenCalled());
    expect(state.saveOverride.mock.calls[0][0]).toMatchObject({ hidden: false });
    secondRender.unmount();
  });

  it('restores a changed base product to its default values', async () => {
    state.overrides = {
      [firstProduct.id]: override({ package_id: firstProduct.id, price: 999 })
    };
    renderManager();
    fireEvent.click(within(productCard()).getByRole('button', { name: 'שחזור ברירת מחדל' }));
    await waitFor(() => expect(state.removeOverride).toHaveBeenCalledWith(firstProduct.id));
  });

  it('creates a new product with an uploaded image', async () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('12345678-1234-4123-8123-123456789012');
    renderManager();
    fireEvent.click(screen.getByRole('button', { name: 'הוספת מוצר' }));

    const form = screen.getByText('מוצר חדש').closest('.rounded-2xl') as HTMLElement;
    fireEvent.change(within(form).getByRole('combobox'), { target: { value: SHOP_PRODUCT_CATEGORIES.CENTERPIECES } });
    const textboxes = within(form).getAllByRole('textbox');
    fireEvent.change(textboxes[0], { target: { value: 'מוצר בהתאמה אישית' } });
    fireEvent.change(textboxes[1], { target: { value: 'תיאור מוצר' } });
    fireEvent.change(within(form).getByRole('spinbutton'), { target: { value: '450' } });
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(['image'], 'custom.webp', { type: 'image/webp' })] } });
    await waitFor(() => expect(state.upload).toHaveBeenCalled());

    fireEvent.click(within(form).getByRole('button', { name: 'יצירת מוצר' }));
    await waitFor(() => expect(state.saveOverride).toHaveBeenCalled());
    expect(state.saveOverride.mock.calls[0][0]).toMatchObject({
      package_id: 'product-custom-12345678',
      title: 'מוצר בהתאמה אישית',
      subtitle: 'תיאור מוצר',
      price: 450,
      image_url: 'https://cdn.example/product.webp',
      is_custom: true
    });
  });

  it('validates required fields and supports cancelling a new product', () => {
    renderManager();
    fireEvent.click(screen.getByRole('button', { name: 'הוספת מוצר' }));
    fireEvent.click(screen.getByRole('button', { name: 'יצירת מוצר' }));
    expect(screen.getByRole('alert')).toHaveTextContent('יש למלא קטגוריה, שם ומחיר.');
    expect(state.saveOverride).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'ביטול' }));
    expect(screen.queryByRole('button', { name: 'יצירת מוצר' })).not.toBeInTheDocument();
  });

  it('deletes a custom product', async () => {
    state.overrides = {
      'product-custom-one': override({
        package_id: 'product-custom-one',
        title: 'מוצר מותאם',
        price: 500,
        category: SHOP_PRODUCT_CATEGORIES.CHUPPAH,
        is_custom: true
      })
    };
    renderManager();
    fireEvent.click(within(productCard('מוצר מותאם')).getByRole('button', { name: 'מחיקת מוצר' }));
    await waitFor(() => expect(state.removeOverride).toHaveBeenCalledWith('product-custom-one'));
  });

  it('shows recoverable errors for failed saves and image uploads', async () => {
    state.saveOverride.mockRejectedValueOnce(new Error('rls'));
    renderManager();
    const card = productCard();
    fireEvent.click(within(card).getByRole('button', { name: 'שמירה' }));
    await waitFor(() => expect(within(card).getByRole('alert')).toHaveTextContent('השמירה נכשלה'));

    state.upload.mockRejectedValueOnce(new Error('storage'));
    const fileInput = card.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(['image'], 'bad.png', { type: 'image/png' })] } });
    await waitFor(() => expect(within(card).getByRole('alert')).toHaveTextContent('השמירה נכשלה'));
  });
});
