import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BRANDING_OVERRIDE_ID } from '../lib/branding';
import type { OverrideMap } from '../lib/packages';
import { renderWithProviders } from '../test/render';
import { BrandingManager } from './BrandingManager';

const state = vi.hoisted(() => ({
  overrides: {} as OverrideMap,
  saveOverride: vi.fn(),
  removeOverride: vi.fn(),
  uploadPackageImage: vi.fn()
}));

vi.mock('../packages/PackagesProvider', () => ({
  usePackages: () => ({
    overrides: state.overrides,
    loading: false,
    refresh: vi.fn(),
    saveOverride: state.saveOverride,
    removeOverride: state.removeOverride
  })
}));

vi.mock('../lib/packages', () => ({
  uploadPackageImage: state.uploadPackageImage
}));

beforeEach(() => {
  state.overrides = {};
  state.saveOverride.mockReset().mockResolvedValue(undefined);
  state.removeOverride.mockReset().mockResolvedValue(undefined);
  state.uploadPackageImage.mockReset();
  window.localStorage.removeItem('ld-lang');
});

describe('BrandingManager', () => {
  it('uploads and stores a logo as the hidden branding override', async () => {
    state.uploadPackageImage.mockResolvedValue('https://cdn.example/brand-logo.png');
    renderWithProviders(<BrandingManager />);

    const input = screen.getByLabelText('העלאת לוגו');
    fireEvent.change(input, { target: { files: [] } });
    expect(state.uploadPackageImage).not.toHaveBeenCalled();

    const file = new File(['logo'], 'brand.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(state.uploadPackageImage).toHaveBeenCalledWith(file));
    await waitFor(() => expect(state.saveOverride).toHaveBeenCalledWith(expect.objectContaining({
      package_id: BRANDING_OVERRIDE_ID,
      image_url: 'https://cdn.example/brand-logo.png',
      hidden: true,
      is_custom: false
    })));
    expect(screen.getByRole('status')).toHaveTextContent('הלוגו נשמר');
  });

  it('previews and removes an existing logo', async () => {
    state.overrides = {
      [BRANDING_OVERRIDE_ID]: {
        package_id: BRANDING_OVERRIDE_ID,
        price: null,
        title: 'LD Event Design logo',
        subtitle: null,
        description: null,
        benefits: null,
        image_url: 'https://cdn.example/current-logo.png',
        category: null,
        svg_type: null,
        pricing_tiers: null,
        hidden: true,
        is_custom: false,
        sort_order: null
      }
    };
    renderWithProviders(<BrandingManager />);

    expect(screen.getByRole('img', { name: 'תצוגה מקדימה של הלוגו' })).toHaveAttribute('src', 'https://cdn.example/current-logo.png');
    fireEvent.click(screen.getByRole('button', { name: 'הסרת הלוגו' }));

    await waitFor(() => expect(state.removeOverride).toHaveBeenCalledWith(BRANDING_OVERRIDE_ID));
    expect(screen.getByRole('status')).toHaveTextContent('הלוגו נשמר');
  });

  it('shows a recoverable error for failed uploads and failed removals', async () => {
    state.uploadPackageImage.mockRejectedValue(new Error('upload denied'));
    const first = renderWithProviders(<BrandingManager />);
    fireEvent.change(screen.getByLabelText('העלאת לוגו'), {
      target: { files: [new File(['logo'], 'brand.png', { type: 'image/png' })] }
    });
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('לא הצלחנו לשמור את הלוגו'));
    first.unmount();

    state.overrides = {
      [BRANDING_OVERRIDE_ID]: {
        package_id: BRANDING_OVERRIDE_ID,
        price: null,
        title: 'Logo',
        subtitle: null,
        description: null,
        benefits: null,
        image_url: 'https://cdn.example/logo.png',
        category: null,
        svg_type: null,
        pricing_tiers: null,
        hidden: true,
        is_custom: false,
        sort_order: null
      }
    };
    state.removeOverride.mockRejectedValue(new Error('delete denied'));
    renderWithProviders(<BrandingManager />);
    fireEvent.click(screen.getByRole('button', { name: 'הסרת הלוגו' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('לא הצלחנו לשמור את הלוגו'));
  });
});
