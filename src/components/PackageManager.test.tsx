import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { I18nProvider } from '../i18n/i18n';
import type { PackageOverride } from '../lib/packages';

const p = vi.hoisted(() => ({
  overrides: {} as Record<string, PackageOverride>,
  configured: true,
  saveOverride: vi.fn(async (_o: PackageOverride) => {}),
  removeOverride: vi.fn(async (_id: string) => {}),
  upload: vi.fn(async (_f: File) => 'https://cdn.example/x.png')
}));

vi.mock('../lib/supabase', () => ({
  get isSupabaseConfigured() {
    return p.configured;
  },
  supabase: {}
}));
vi.mock('../packages/PackagesProvider', () => ({
  usePackages: () => ({ overrides: p.overrides, saveOverride: p.saveOverride, removeOverride: p.removeOverride, refresh: vi.fn(), loading: false })
}));
vi.mock('../lib/packages', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/packages')>();
  return { ...actual, uploadPackageImage: p.upload };
});

import { PackageManager } from './PackageManager';
import { PACKAGES } from '../App';

const CLASSIC_S = 'חבילת עיצוב חתונה - Classic S';
const ov = (o: Partial<PackageOverride> & { package_id: string }): PackageOverride => ({
  price: null, title: null, subtitle: null, description: null, benefits: null,
  image_url: null, category: null, svg_type: null, pricing_tiers: null,
  hidden: false, is_custom: false, sort_order: null, ...o
});

const renderPM = () => render(<I18nProvider><PackageManager /></I18nProvider>);
const rowFor = (title: string) => screen.getByLabelText(`כותרת — ${title}`).closest('.rounded-xl') as HTMLElement;

beforeEach(() => {
  p.overrides = {};
  p.configured = true;
  p.saveOverride.mockClear();
  p.removeOverride.mockClear();
  p.upload.mockClear();
});

describe('PackageManager', () => {
  it('renders nothing when Supabase is not configured', () => {
    p.configured = false;
    renderPM();
    expect(screen.queryByText('ניהול קטלוג חבילות')).not.toBeInTheDocument();
  });

  it('renders one editable row per base package', () => {
    renderPM();
    expect(screen.getAllByRole('button', { name: 'שמירה' })).toHaveLength(PACKAGES.length);
  });

  it('edits a price and saves an override', async () => {
    renderPM();
    const row = rowFor(CLASSIC_S);
    fireEvent.change(within(row).getByLabelText(`מחיר (₪) — ${CLASSIC_S}`), { target: { value: '1999' } });
    fireEvent.click(within(row).getByRole('button', { name: 'שמירה' }));
    await waitFor(() => expect(p.saveOverride).toHaveBeenCalled());
    expect(p.saveOverride.mock.calls[0][0]).toMatchObject({ package_id: 'classic-s', price: 1999, is_custom: false });
  });

  it('hides a package', async () => {
    renderPM();
    fireEvent.click(within(rowFor(CLASSIC_S)).getByRole('button', { name: 'הסתרה מהאתר' }));
    await waitFor(() => expect(p.saveOverride).toHaveBeenCalled());
    expect(p.saveOverride.mock.calls[0][0]).toMatchObject({ package_id: 'classic-s', hidden: true });
  });

  it('shows a reset action for an overridden package and clears it', async () => {
    p.overrides = { 'classic-s': ov({ package_id: 'classic-s', price: 1000 }) };
    renderPM();
    fireEvent.click(within(rowFor(CLASSIC_S)).getByRole('button', { name: 'איפוס לברירת מחדל' }));
    await waitFor(() => expect(p.removeOverride).toHaveBeenCalledWith('classic-s'));
  });

  it('creates a new custom package (all fields)', async () => {
    renderPM();
    fireEvent.click(screen.getByRole('button', { name: 'הוספת חבילה חדשה' }));
    fireEvent.change(screen.getByLabelText('קטגוריה — חבילה חדשה'), { target: { value: 'חתונה' } });
    fireEvent.change(screen.getByLabelText('כותרת — חבילה חדשה'), { target: { value: 'חבילה מיוחדת' } });
    fireEvent.change(screen.getByLabelText('מחיר (₪) — חבילה חדשה'), { target: { value: '1234' } });
    fireEvent.change(screen.getByLabelText('תת-כותרת — חבילה חדשה'), { target: { value: 'תת מיוחדת' } });
    fireEvent.change(screen.getByLabelText('הטבה / כיתוב — חבילה חדשה'), { target: { value: 'הטבה מיוחדת' } });
    fireEvent.change(screen.getByLabelText('תיאור — חבילה חדשה'), { target: { value: 'תיאור מיוחד' } });
    fireEvent.click(screen.getByRole('button', { name: 'יצירת חבילה' }));
    await waitFor(() => expect(p.saveOverride).toHaveBeenCalled());
    expect(p.saveOverride.mock.calls[0][0]).toMatchObject({
      is_custom: true, category: 'חתונה', title: 'חבילה מיוחדת', price: 1234,
      subtitle: 'תת מיוחדת', benefits: 'הטבה מיוחדת', description: 'תיאור מיוחד'
    });
  });

  it('cancels the add-package form', () => {
    renderPM();
    fireEvent.click(screen.getByRole('button', { name: 'הוספת חבילה חדשה' }));
    expect(screen.getByLabelText('כותרת — חבילה חדשה')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'ביטול' }));
    expect(screen.queryByLabelText('כותרת — חבילה חדשה')).not.toBeInTheDocument();
  });

  it('blocks creating a package without category/title/price', () => {
    renderPM();
    fireEvent.click(screen.getByRole('button', { name: 'הוספת חבילה חדשה' }));
    fireEvent.click(screen.getByRole('button', { name: 'יצירת חבילה' }));
    expect(p.saveOverride).not.toHaveBeenCalled();
  });

  it('uploads an image and saves it immediately', async () => {
    renderPM();
    const row = rowFor(CLASSIC_S);
    const fileInput = row.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(['x'], 'p.png', { type: 'image/png' })] } });
    await waitFor(() => expect(p.upload).toHaveBeenCalled());
    await waitFor(() => expect(p.saveOverride).toHaveBeenCalled());
    expect(p.saveOverride.mock.calls[0][0]).toMatchObject({
      package_id: 'classic-s',
      image_url: 'https://cdn.example/x.png'
    });
  });

  it('deletes a custom package', async () => {
    p.overrides = { 'custom-1': ov({ package_id: 'custom-1', is_custom: true, title: 'מותאם', category: 'חתונה', price: 500 }) };
    renderPM();
    fireEvent.click(within(rowFor('מותאם')).getByRole('button', { name: 'מחיקת חבילה' }));
    await waitFor(() => expect(p.removeOverride).toHaveBeenCalledWith('custom-1'));
  });

  it('edits the text fields (title / subtitle / description / benefits) and saves them', async () => {
    renderPM();
    const row = rowFor(CLASSIC_S);
    fireEvent.change(within(row).getByLabelText(`כותרת — ${CLASSIC_S}`), { target: { value: 'כותרת חדשה' } });
    fireEvent.change(within(row).getByLabelText(`תת-כותרת — ${CLASSIC_S}`), { target: { value: 'תת חדשה' } });
    fireEvent.change(within(row).getByLabelText(`תיאור — ${CLASSIC_S}`), { target: { value: 'תיאור חדש' } });
    fireEvent.change(within(row).getByLabelText(`הטבה / כיתוב — ${CLASSIC_S}`), { target: { value: 'הטבה חדשה' } });
    fireEvent.click(within(row).getByRole('button', { name: 'שמירה' }));
    await waitFor(() => expect(p.saveOverride).toHaveBeenCalled());
    expect(p.saveOverride.mock.calls[0][0]).toMatchObject({
      title: 'כותרת חדשה', subtitle: 'תת חדשה', description: 'תיאור חדש', benefits: 'הטבה חדשה'
    });
  });

  it('shows an error message when saving fails', async () => {
    p.saveOverride.mockRejectedValueOnce(new Error('rls'));
    renderPM();
    const row = rowFor(CLASSIC_S);
    fireEvent.change(within(row).getByLabelText(`מחיר (₪) — ${CLASSIC_S}`), { target: { value: '999' } });
    fireEvent.click(within(row).getByRole('button', { name: 'שמירה' }));
    await waitFor(() => expect(within(row).getByText(/השמירה נכשלה/)).toBeInTheDocument());
  });

  it('shows the package on the site again (un-hide)', async () => {
    p.overrides = { 'classic-s': ov({ package_id: 'classic-s', hidden: true }) };
    renderPM();
    fireEvent.click(within(rowFor(CLASSIC_S)).getByRole('button', { name: 'הצגה באתר' }));
    await waitFor(() => expect(p.saveOverride).toHaveBeenCalled());
    expect(p.saveOverride.mock.calls[0][0]).toMatchObject({ hidden: false });
  });

  it('removes an attached image and saves the removal immediately', async () => {
    p.overrides = { 'classic-s': ov({ package_id: 'classic-s', image_url: 'https://cdn.example/old.png' }) };
    renderPM();
    const row = rowFor(CLASSIC_S);
    expect(row.querySelector('img')).toBeTruthy();
    fireEvent.click(within(row).getByRole('button', { name: 'הסרת תמונה' }));
    expect(row.querySelector('img')).toBeFalsy();
    await waitFor(() => expect(p.saveOverride).toHaveBeenCalled());
    expect(p.saveOverride.mock.calls[0][0]).toMatchObject({ package_id: 'classic-s', image_url: null });
  });

  it('ignores an image change with no file selected', () => {
    renderPM();
    const row = rowFor(CLASSIC_S);
    const fileInput = row.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [] } });
    expect(p.upload).not.toHaveBeenCalled();
  });

  it('shows an error when an image upload fails', async () => {
    p.upload.mockRejectedValueOnce(new Error('storage'));
    renderPM();
    const row = rowFor(CLASSIC_S);
    const fileInput = row.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(['x'], 'p.png', { type: 'image/png' })] } });
    await waitFor(() => expect(within(row).getByText(/השמירה נכשלה/)).toBeInTheDocument());
  });
});
