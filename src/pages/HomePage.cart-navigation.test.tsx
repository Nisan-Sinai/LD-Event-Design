import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CART_DESIGN_STORAGE_KEY, CART_STORAGE_KEY, CartProvider } from '../cart/CartProvider';
import { renderWithProviders } from '../test/render';

vi.mock('../packages/PackagesProvider', () => ({
  usePackages: () => ({
    overrides: {},
    loading: false,
    refresh: vi.fn(),
    saveOverride: vi.fn(),
    removeOverride: vi.fn()
  })
}));

import { HomePage } from './HomePage';

const renderHome = () => renderWithProviders(<CartProvider><HomePage /></CartProvider>);

beforeEach(() => {
  window.localStorage.removeItem('ld-lang');
  window.localStorage.removeItem(CART_STORAGE_KEY);
  window.localStorage.removeItem(CART_DESIGN_STORAGE_KEY);
  window.sessionStorage.clear();
});

describe('HomePage cart navigation', () => {
  it('sends both cart actions to the dedicated cart page', () => {
    renderHome();

    const reviewCart = screen.getByRole('link', { name: /לסיכום בעגלה/ });
    expect(reviewCart).toHaveAttribute('href', '/cart');
    expect(reviewCart.tagName).toBe('A');

    fireEvent.click(screen.getAllByRole('button', { name: /הוספה לסל:/ })[0]);

    const viewCart = screen.getByRole('link', { name: /לצפייה בעגלה/ });
    expect(viewCart).toHaveAttribute('href', '/cart');
    expect(viewCart.tagName).toBe('A');
  });
});
