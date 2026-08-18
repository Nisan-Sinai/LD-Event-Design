import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../i18n/i18n';
import type { PackageOverride } from '../lib/packages';

const state = vi.hoisted(() => ({
  overrides: {} as Record<string, PackageOverride>,
  saveOverride: vi.fn(async (_o: PackageOverride, _options?: unknown) => {}),
  saveImage: vi.fn(async (_id: string, _url: string | null, _slot?: 1 | 2 | 3 | 4) => {}),
  removeOverride: vi.fn(async (_id: string) => {}),
  upload: vi.fn(async (_f: File) => 'https://cdn.example/uploaded.png')
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

import { PackageManager } from './PackageManager';
import { PACKAGES } from '../App';

const first = PACKAGES[0];
const ov = (input: Partial<PackageOverride> & { package_id: string }): PackageOverride => ({
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
});

const renderPM = () => render(<I18nProvider><PackageManager /></I18nProvider>);
const rowFor = (title = first.title) => screen.getByLabelText(`כותרת — ${title}`).closest('.rounded-xl') as HTMLElement;

beforeEach(() => {
  state.overrides = {};
  state.saveOverride.mockReset().mockResolvedValue(undefined);
  state.saveImage.mockReset().mockResolvedValue(undefined);
  state.removeOverride.mockReset().mockResolvedValue(undefined);
  state.upload.mockReset().mockResolvedValue('https://cdn.example/uploaded.png');
});

describe('PackageManager exhaustive branches', () => {
  it('hydrates all four images and all nullable text/category fields of a custom package', () => {
    state.overrides = {
      'custom-fallback': ov({
        package_id: 'custom-fallback',
        is_custom: true,
        sort_order: null,
        title: null,
        subtitle: null,
        description: null,
        benefits: null,
        category: null,
        price: null,
        image_url: 'https://cdn.example/1.png',
        image_url_2: 'https://cdn.example/2.png',
        image_url_3: 'https://cdn.example/3.png',
        image_url_4: 'https://cdn.example/4.png'
      })
    };
    renderPM();
    const row = rowFor('');
    expect(row.querySelectorAll('img')).toHaveLength(4);
    expect(within(row).getByRole('spinbutton')).toHaveValue(0);
    expect(within(row).getByText('חבילה חדשה')).toBeInTheDocument();
  });

  it('persists slot 1 through the two-argument provider path and shows a recoverable save-image error', async () => {
    state.saveImage.mockRejectedValueOnce(new Error('image write failed'));
    renderPM();
    const row = rowFor();
    const input = row.querySelectorAll<HTMLInputElement>('input[type="file"]')[0];
    fireEvent.change(input, { target: { files: [new File(['x'], 'one.png', { type: 'image/png' })] } });
    await waitFor(() => expect(state.upload).toHaveBeenCalled());
    fireEvent.click(within(row).getByRole('button', { name: '✅ שמור 1' }));
    await waitFor(() => expect(state.saveImage).toHaveBeenCalledWith(first.id, 'https://cdn.example/uploaded.png'));
    await waitFor(() => expect(within(row).getByText(/השמירה נכשלה/)).toBeInTheDocument());
    expect(input).toBeEnabled();
  });

  it.each([2, 3, 4] as const)('persists a blank image slot %s as null', async (slot) => {
    const imageKey = `image_url_${slot}` as 'image_url_2' | 'image_url_3' | 'image_url_4';
    state.overrides = {
      [first.id]: ov({ package_id: first.id, [imageKey]: `https://cdn.example/${slot}.png` })
    };
    renderPM();
    const row = rowFor();
    fireEvent.click(within(row).getByRole('button', { name: `הסרת תמונה ${slot}` }));
    fireEvent.click(within(row).getByRole('button', { name: `✅ שמור ${slot}` }));
    await waitFor(() => expect(state.saveImage).toHaveBeenCalledWith(first.id, null, slot));
  });

  it('routes a new-package image upload failure to the new-package validation area', async () => {
    state.upload.mockRejectedValueOnce(new Error('upload failed'));
    renderPM();
    fireEvent.click(screen.getByRole('button', { name: 'הוספת חבילה חדשה' }));
    const input = screen.getAllByLabelText('העלאת תמונה 1')[0] as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'bad.png', { type: 'image/png' })] } });
    await waitFor(() => expect(screen.getByText(/קטגוריה, כותרת ומחיר/)).toBeInTheDocument());
  });

  it('normalizes empty optional fields and a negative custom-package price on creation', async () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('aaaaaaaa-1234-4123-8123-123456789012');
    vi.spyOn(Date, 'now').mockReturnValue(1234);
    renderPM();
    fireEvent.click(screen.getByRole('button', { name: 'הוספת חבילה חדשה' }));
    fireEvent.change(screen.getByLabelText('קטגוריה — חבילה חדשה'), { target: { value: 'חתונה' } });
    fireEvent.change(screen.getByLabelText('כותרת — חבילה חדשה'), { target: { value: '  חדשה  ' } });
    fireEvent.change(screen.getByLabelText('מחיר (₪) — חבילה חדשה'), { target: { value: '-99' } });
    fireEvent.click(screen.getByRole('button', { name: 'יצירת חבילה' }));
    await waitFor(() => expect(state.saveOverride).toHaveBeenCalled());
    expect(state.saveOverride.mock.calls[0][0]).toMatchObject({
      package_id: 'custom-aaaaaaaa',
      title: 'חדשה',
      price: 0,
      subtitle: null,
      description: null,
      benefits: null,
      image_url: null,
      image_url_2: null,
      image_url_3: null,
      image_url_4: null,
      sort_order: 1234
    });
  });

  it('shows a creation error when the custom-package save rejects', async () => {
    state.saveOverride.mockRejectedValueOnce(new Error('RLS'));
    renderPM();
    fireEvent.click(screen.getByRole('button', { name: 'הוספת חבילה חדשה' }));
    fireEvent.change(screen.getByLabelText('קטגוריה — חבילה חדשה'), { target: { value: 'חתונה' } });
    fireEvent.change(screen.getByLabelText('כותרת — חבילה חדשה'), { target: { value: 'חדשה' } });
    fireEvent.change(screen.getByLabelText('מחיר (₪) — חבילה חדשה'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'יצירת חבילה' }));
    await waitFor(() => expect(screen.getByText(/קטגוריה, כותרת ומחיר/)).toBeInTheDocument());
  });

  it('leaves a pristine base-package save button disabled and shows the pricing-tier note when relevant', () => {
    renderPM();
    expect(within(rowFor()).getByRole('button', { name: 'שמירה' })).toBeDisabled();
    const tiered = PACKAGES.find((pkg) => pkg.pricingTiers);
    if (tiered) {
      expect(within(rowFor(tiered.title)).getByText(/מדרגות מחיר/)).toBeInTheDocument();
    }
  });

  it('handles an image change without a selected file for a new package', async () => {
    renderPM();
    fireEvent.click(screen.getByRole('button', { name: 'הוספת חבילה חדשה' }));
    const input = screen.getAllByLabelText('העלאת תמונה 4')[0] as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });
    await act(async () => Promise.resolve());
    expect(state.upload).not.toHaveBeenCalled();
  });
});
