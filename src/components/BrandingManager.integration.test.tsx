import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PackageOverride } from '../lib/packages';
import { renderWithProviders } from '../test/render';

const state = vi.hoisted(() => ({
  rows: new Map<string, Record<string, unknown>>(),
  uploadedPath: '',
  upsert: vi.fn(),
  remove: vi.fn(),
  upload: vi.fn()
}));

vi.mock('../lib/supabase', () => {
  const from = vi.fn(() => ({
    select: vi.fn(async () => ({
      data: Array.from(state.rows.values()).map((row) => ({ ...row })),
      error: null
    })),
    upsert: state.upsert,
    delete: vi.fn(() => ({
      eq: state.remove
    }))
  }));

  const storageFrom = vi.fn(() => ({
    upload: state.upload,
    getPublicUrl: (path: string) => ({
      data: { publicUrl: `https://storage.example/package-images/${path}` }
    })
  }));

  return {
    isSupabaseConfigured: true,
    supabase: {
      from,
      storage: { from: storageFrom }
    }
  };
});

import { BRANDING_OVERRIDE_ID } from '../lib/branding';
import { PackagesProvider } from '../packages/PackagesProvider';
import { BrandingManager } from './BrandingManager';

const completeRow = (row: Record<string, unknown>): PackageOverride => ({
  package_id: String(row.package_id),
  price: (row.price as number | null | undefined) ?? null,
  title: (row.title as string | null | undefined) ?? null,
  subtitle: (row.subtitle as string | null | undefined) ?? null,
  description: (row.description as string | null | undefined) ?? null,
  benefits: (row.benefits as string | null | undefined) ?? null,
  image_url: (row.image_url as string | null | undefined) ?? null,
  image_url_2: (row.image_url_2 as string | null | undefined) ?? null,
  image_url_3: (row.image_url_3 as string | null | undefined) ?? null,
  image_url_4: (row.image_url_4 as string | null | undefined) ?? null,
  category: (row.category as string | null | undefined) ?? null,
  svg_type: (row.svg_type as string | null | undefined) ?? null,
  pricing_tiers: (row.pricing_tiers as Record<number, number> | null | undefined) ?? null,
  hidden: Boolean(row.hidden),
  is_custom: Boolean(row.is_custom),
  sort_order: (row.sort_order as number | null | undefined) ?? null
});

beforeEach(() => {
  state.rows.clear();
  state.uploadedPath = '';
  state.upsert.mockReset().mockImplementation(async (payload: Record<string, unknown>) => {
    const id = String(payload.package_id);
    state.rows.set(id, completeRow({ ...(state.rows.get(id) ?? {}), ...payload }));
    return { error: null };
  });
  state.remove.mockReset().mockImplementation(async (_column: string, packageId: string) => {
    state.rows.delete(packageId);
    return { error: null };
  });
  state.upload.mockReset().mockImplementation(async (path: string) => {
    state.uploadedPath = path;
    return { error: null };
  });
  window.localStorage.removeItem('ld-lang');
});

describe('BrandingManager integration', () => {
  it('uploads, persists, refreshes, previews and removes the logo through the real provider and package persistence layer', async () => {
    renderWithProviders(
      <PackagesProvider>
        <BrandingManager />
      </PackagesProvider>
    );

    await waitFor(() => expect(screen.getByText('תצוגה מקדימה של הלוגו')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'הסרת הלוגו' })).not.toBeInTheDocument();

    const file = new File(['logo-bytes'], 'brand.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('העלאת לוגו'), { target: { files: [file] } });

    await waitFor(() => expect(state.upload).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(state.rows.get(BRANDING_OVERRIDE_ID)?.image_url).toMatch(/^https:\/\/storage\.example\/package-images\//));

    const preview = await screen.findByRole('img', { name: 'תצוגה מקדימה של הלוגו' });
    expect(preview).toHaveAttribute('src', state.rows.get(BRANDING_OVERRIDE_ID)?.image_url);
    expect(screen.getByRole('button', { name: 'הסרת הלוגו' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'הסרת הלוגו' }));

    await waitFor(() => expect(state.rows.has(BRANDING_OVERRIDE_ID)).toBe(false));
    await waitFor(() => expect(screen.queryByRole('img', { name: 'תצוגה מקדימה של הלוגו' })).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'הסרת הלוגו' })).not.toBeInTheDocument();
    expect(screen.getByText('תצוגה מקדימה של הלוגו')).toBeInTheDocument();
  });
});
