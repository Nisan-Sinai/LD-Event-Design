import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { I18nProvider } from '../i18n/i18n';
import type { PackageOverride } from '../lib/packages';

const state = vi.hoisted(() => ({
  overrides: {} as Record<string, PackageOverride>,
  saveOverride: vi.fn(async (_o: PackageOverride, _options?: unknown) => {}),
  saveImage: vi.fn(async (_id: string, _url: string | null, _slot?: 1 | 2 | 3 | 4) => {}),
  removeOverride: vi.fn(async (_id: string) => {}),
  upload: vi.fn(async (_f: File) => 'https://cdn.example/coverage.png')
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

const TITLE = 'חבילת עיצוב חתונה - Classic S';

beforeEach(() => {
  state.overrides = {};
  state.saveOverride.mockReset().mockResolvedValue(undefined);
  state.saveImage.mockReset().mockResolvedValue(undefined);
  state.removeOverride.mockReset().mockResolvedValue(undefined);
  state.upload.mockReset().mockResolvedValue('https://cdn.example/coverage.png');
});

describe('PackageManager persistence coverage', () => {
  it('shows a recoverable error when explicit image persistence fails', async () => {
    state.saveImage.mockRejectedValueOnce(new Error('image persistence failed'));
    render(<I18nProvider><PackageManager /></I18nProvider>);
    const row = screen.getByLabelText(`כותרת — ${TITLE}`).closest('.rounded-xl') as HTMLElement;
    const input = within(row).getByLabelText('העלאת תמונה 1') as HTMLInputElement;

    fireEvent.change(input, {
      target: { files: [new File(['image'], 'coverage.png', { type: 'image/png' })] }
    });
    await waitFor(() => expect(state.upload).toHaveBeenCalledTimes(1));

    fireEvent.click(within(row).getByRole('button', { name: '✅ שמור 1' }));
    await waitFor(() => expect(state.saveImage).toHaveBeenCalledWith('classic-s', 'https://cdn.example/coverage.png'));
    await waitFor(() => expect(within(row).getByText(/השמירה נכשלה/)).toBeInTheDocument());
    expect(input).toBeEnabled();
  });
});
