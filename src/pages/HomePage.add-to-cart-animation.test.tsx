import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CartProvider } from '../cart/CartProvider';
import { SHOP_PRODUCTS } from '../catalog/shopProducts';
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

describe('HomePage add to cart animation', () => {
  it('shows a fresh ripple when the visible add button is pressed', () => {
    renderWithProviders(<CartProvider><HomePage /></CartProvider>);
    const product = SHOP_PRODUCTS[0];
    const article = screen.getAllByText(product.title)
      .map((node) => node.closest('article'))
      .find((node): node is HTMLElement => node instanceof HTMLElement)!;
    const addButton = within(article).getByRole('button', { name: `הוספה לסל: ${product.title}` });

    expect(addButton.querySelector('[data-cart-add-animation]')).not.toBeInTheDocument();
    fireEvent.click(addButton);
    const firstRipple = addButton.querySelector('[data-cart-add-animation]');
    expect(firstRipple).toBeInTheDocument();
    expect(addButton).toHaveTextContent('הוספה לסל');

    fireEvent.click(addButton);
    expect(addButton.querySelector('[data-cart-add-animation]')).toBeInTheDocument();
    expect(addButton.querySelector('[data-cart-add-animation]')).not.toBe(firstRipple);
  });
});
