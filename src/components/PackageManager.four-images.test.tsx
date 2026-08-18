import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { I18nProvider } from '../i18n/i18n';
import type { PackageOverride } from '../lib/packages';

const p = vi.hoisted(() => ({
  overrides: {} as Record<string, PackageOverride>,
  saveOverride: vi.fn(async (_o: PackageOverride, _options?: unknown) => {}),
  saveImage: vi.fn(async (_id: string, _url: string | null, _slot?: 1 | 2 | 3 | 4) => {}),
  removeOverride: vi.fn(async (_id: string) => {}),
  upload: vi.fn(async (_f: File) => 'https://cdn.example/uploaded.jpg')
}));

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {}
}));
vi.mock('../packages/PackagesProvider', () => ({
  usePackages: () => ({
    overrides: p.overrides,
    saveOverride: p.saveOverride,
    saveImage: p.saveImage,
    removeOverride: p.removeOverride,
    refresh: vi.fn(),
    loading: false
  })
}));
vi.mock('../lib/packages', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/packages')>();
  return { ...actual, uploadPackageImage: p.upload };
});

import { PackageManager } from './PackageManager';

const CLASSIC_S = 'חבילת עיצוב חתונה - Classic S';
const ov = (input: Partial<PackageOverride> & { package_id: string }): PackageOverride => ({
  package_id: input.package_id,
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
  ...input
});

const renderPM = () => render(<I18nProvider><PackageManager /></I18nProvider>);
const rowFor = (title: string) => screen.getByLabelText(`כותרת — ${title}`).closest('.rounded-xl') as HTMLElement;

beforeEach(() => {
  p.overrides = {};
  p.saveOverride.mockClear();
  p.saveImage.mockClear();
  p.removeOverride.mockClear();
  p.upload.mockReset().mockResolvedValue('https://cdn.example/uploaded.jpg');
});

describe('PackageManager four images', () => {
  it('renders four independent image upload slots for every existing package', () => {
    renderPM();
    const row = rowFor(CLASSIC_S);
    expect(within(row).getByLabelText('העלאת תמונה 1')).toBeInTheDocument();
    expect(within(row).getByLabelText('העלאת תמונה 2')).toBeInTheDocument();
    expect(within(row).getByLabelText('העלאת תמונה 3')).toBeInTheDocument();
    expect(within(row).getByLabelText('העלאת תמונה 4')).toBeInTheDocument();
  });

  it.each([
    [2, 'https://cdn.example/two.jpg'],
    [3, 'https://cdn.example/three.jpg'],
    [4, 'https://cdn.example/four.jpg']
  ] as const)('uploads and persists image slot %s separately', async (slot, url) => {
    p.upload.mockResolvedValueOnce(url);
    renderPM();
    const row = rowFor(CLASSIC_S);
    const input = within(row).getByLabelText(`העלאת תמונה ${slot}`) as HTMLInputElement;

    fireEvent.change(input, {
      target: { files: [new File(['img'], `slot-${slot}.jpg`, { type: 'image/jpeg' })] }
    });
    await waitFor(() => expect(p.upload).toHaveBeenCalledTimes(1));
    expect(p.saveImage).not.toHaveBeenCalled();
    expect(row.querySelector(`img[src="${url}"]`)).toBeTruthy();

    fireEvent.click(within(row).getByRole('button', { name: `✅ שמור ${slot}` }));
    await waitFor(() => expect(p.saveImage).toHaveBeenCalledWith('classic-s', url, slot));
    expect(p.saveOverride).not.toHaveBeenCalled();
  });

  it('loads all four saved images and removes slot 4 without touching the other slots', async () => {
    p.overrides = {
      'classic-s': ov({
        package_id: 'classic-s',
        image_url: 'https://cdn.example/one.jpg',
        image_url_2: 'https://cdn.example/two.jpg',
        image_url_3: 'https://cdn.example/three.jpg',
        image_url_4: 'https://cdn.example/four.jpg'
      })
    };
    renderPM();
    const row = rowFor(CLASSIC_S);
    expect(row.querySelectorAll('img')).toHaveLength(4);

    fireEvent.click(within(row).getByRole('button', { name: 'הסרת תמונה 4' }));
    expect(row.querySelectorAll('img')).toHaveLength(3);
    expect(p.saveImage).not.toHaveBeenCalled();

    fireEvent.click(within(row).getByRole('button', { name: '✅ שמור 4' }));
    await waitFor(() => expect(p.saveImage).toHaveBeenCalledWith('classic-s', null, 4));
    expect(row.querySelector('img[src="https://cdn.example/one.jpg"]')).toBeTruthy();
    expect(row.querySelector('img[src="https://cdn.example/two.jpg"]')).toBeTruthy();
    expect(row.querySelector('img[src="https://cdn.example/three.jpg"]')).toBeTruthy();
  });

  it('offers four slots while creating a package and includes all uploaded URLs in the creation upsert', async () => {
    p.upload
      .mockResolvedValueOnce('https://cdn.example/new-1.jpg')
      .mockResolvedValueOnce('https://cdn.example/new-2.jpg')
      .mockResolvedValueOnce('https://cdn.example/new-3.jpg')
      .mockResolvedValueOnce('https://cdn.example/new-4.jpg');
    renderPM();
    fireEvent.click(screen.getByRole('button', { name: 'הוספת חבילה חדשה' }));

    fireEvent.change(screen.getByLabelText('קטגוריה — חבילה חדשה'), { target: { value: 'חתונה' } });
    fireEvent.change(screen.getByLabelText('כותרת — חבילה חדשה'), { target: { value: 'חבילת ארבע תמונות' } });
    fireEvent.change(screen.getByLabelText('מחיר (₪) — חבילה חדשה'), { target: { value: '4000' } });

    for (const slot of [1, 2, 3, 4] as const) {
      const inputs = screen.getAllByLabelText(`העלאת תמונה ${slot}`) as HTMLInputElement[];
      const newPackageInput = inputs[0];
      fireEvent.change(newPackageInput, {
        target: { files: [new File([String(slot)], `new-${slot}.jpg`, { type: 'image/jpeg' })] }
      });
      await waitFor(() => expect(p.upload).toHaveBeenCalledTimes(slot));
    }

    fireEvent.click(screen.getByRole('button', { name: 'יצירת חבילה' }));
    await waitFor(() => expect(p.saveOverride).toHaveBeenCalledTimes(1));
    expect(p.saveOverride.mock.calls[0][0]).toMatchObject({
      title: 'חבילת ארבע תמונות',
      image_url: 'https://cdn.example/new-1.jpg',
      image_url_2: 'https://cdn.example/new-2.jpg',
      image_url_3: 'https://cdn.example/new-3.jpg',
      image_url_4: 'https://cdn.example/new-4.jpg'
    });
    expect(p.saveOverride.mock.calls[0][1]).toEqual({ includeImage: true });
  });
});
