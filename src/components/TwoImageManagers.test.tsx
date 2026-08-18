import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { I18nProvider } from '../i18n/i18n';
import { SHOP_PRODUCTS } from '../catalog/shopProducts';
import { PACKAGES } from '../App';
import type { PackageOverride } from '../lib/packages';

const state = vi.hoisted(() => ({
  overrides: {} as Record<string, PackageOverride>,
  saveOverride: vi.fn(async (_o: PackageOverride, _options?: unknown) => {}),
  saveImage: vi.fn(async (_id: string, _url: string | null, _slot?: 1 | 2 | 3 | 4) => {}),
  removeOverride: vi.fn(async (_id: string) => {}),
  upload: vi.fn(async (_file: File) => 'https://cdn.example/second.webp')
}));

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {}
}));

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
import { PackageManager } from './PackageManager';

beforeEach(() => {
  state.overrides = {};
  state.saveOverride.mockClear();
  state.saveImage.mockClear();
  state.removeOverride.mockClear();
  state.upload.mockClear().mockResolvedValue('https://cdn.example/second.webp');
});

describe('inline image admin controls', () => {
  it('keeps four product images inside the card and saves image 4 only after confirmation', async () => {
    render(<I18nProvider><ProductManager /></I18nProvider>);
    const card = screen.getByDisplayValue(SHOP_PRODUCTS[0].title).closest('article') as HTMLElement;
    const inputs = card.querySelectorAll<HTMLInputElement>('input[type="file"]');

    expect(inputs).toHaveLength(4);
    expect(card).toHaveTextContent('תמונת מוצר 1');
    expect(card).toHaveTextContent('תמונת מוצר 2');
    expect(card).toHaveTextContent('תמונת מוצר 3');
    expect(card).toHaveTextContent('תמונת מוצר 4');

    fireEvent.change(inputs[3], {
      target: { files: [new File(['image'], 'fourth.png', { type: 'image/png' })] }
    });

    await waitFor(() => expect(state.upload).toHaveBeenCalled());
    expect(state.saveImage).not.toHaveBeenCalled();
    fireEvent.click(within(card).getByRole('button', { name: '✅ שמור 4' }));

    await waitFor(() => expect(state.saveImage).toHaveBeenCalledWith(
      SHOP_PRODUCTS[0].id,
      'https://cdn.example/second.webp',
      4
    ));
  });

  it('keeps both package images inside the row and saves image 2 only after confirmation', async () => {
    render(<I18nProvider><PackageManager /></I18nProvider>);
    const row = screen.getByLabelText(`כותרת — ${PACKAGES[0].title}`).closest('.rounded-xl') as HTMLElement;
    const inputs = row.querySelectorAll<HTMLInputElement>('input[type="file"]');

    expect(inputs).toHaveLength(2);
    expect(row).toHaveTextContent('תמונה 1');
    expect(row).toHaveTextContent('תמונה 2');

    fireEvent.change(inputs[1], {
      target: { files: [new File(['image'], 'second.png', { type: 'image/png' })] }
    });

    await waitFor(() => expect(state.upload).toHaveBeenCalled());
    expect(state.saveImage).not.toHaveBeenCalled();
    fireEvent.click(within(row).getByRole('button', { name: '✅ שמור 2' }));

    await waitFor(() => expect(state.saveImage).toHaveBeenCalledWith(
      PACKAGES[0].id,
      'https://cdn.example/second.webp',
      2
    ));
  });
});
