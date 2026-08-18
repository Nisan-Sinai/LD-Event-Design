import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { I18nProvider } from '../i18n/i18n';
import { BRANDING_OVERRIDE_ID } from '../lib/branding';
import type { OverrideMap } from '../lib/packages';

const state = vi.hoisted(() => ({
  overrides: {} as OverrideMap
}));

vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({ user: null, role: 'guest', roleLoading: false, signOut: vi.fn() })
}));

vi.mock('../cart/CartProvider', () => ({
  useCart: () => ({ itemCount: 0, subtotal: 0 })
}));

vi.mock('../packages/PackagesProvider', () => ({
  usePackages: () => ({ overrides: state.overrides })
}));

vi.mock('./AccessibilityWidget', () => ({ AccessibilityWidget: () => null }));
vi.mock('./CartDrawer', () => ({ CartDrawer: () => null }));
vi.mock('./WhatsAppButton', () => ({ WhatsAppButton: () => null }));

import { SiteLayout } from './SiteLayout';

beforeEach(() => {
  state.overrides = {
    [BRANDING_OVERRIDE_ID]: {
      package_id: BRANDING_OVERRIDE_ID,
      price: null,
      title: 'LD Event Design logo',
      subtitle: null,
      description: null,
      benefits: null,
      image_url: 'https://cdn.example/full-brand-logo.png',
      image_url_2: null,
      image_url_3: null,
      image_url_4: null,
      category: null,
      svg_type: null,
      pricing_tiers: null,
      hidden: true,
      is_custom: false,
      sort_order: null
    }
  };
  window.localStorage.clear();
});

describe('SiteLayout custom branding', () => {
  it('keeps the brand text visible and gives the uploaded logo a prominent responsive size', () => {
    render(
      <I18nProvider>
        <MemoryRouter>
          <SiteLayout><div>CONTENT</div></SiteLayout>
        </MemoryRouter>
      </I18nProvider>
    );

    const header = within(screen.getByRole('banner'));
    const headerLogo = header.getByRole('img', { name: 'לוגו LD Event Design' });
    expect(headerLogo).toHaveClass('h-full', 'w-full', 'object-contain');
    expect(headerLogo.parentElement).toHaveClass('h-24', 'w-36', 'sm:h-28', 'sm:w-44');
    expect(header.getByRole('heading', { name: 'LD Event Design' })).toBeVisible();
    expect(header.getByText(/MAKING ALL DREAMS COME TRUE/i)).toBeVisible();

    const footer = within(screen.getByRole('contentinfo'));
    const footerLogo = footer.getByRole('img', { name: 'לוגו LD Event Design' });
    expect(footerLogo.parentElement).toHaveClass('h-24', 'w-36');
    expect(footer.getByText('LD Event Design')).toBeVisible();
  });
});
