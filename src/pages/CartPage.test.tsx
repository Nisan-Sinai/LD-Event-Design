import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { CART_STORAGE_KEY, CartProvider, type CartItem } from '../cart/CartProvider';
import { renderWithProviders } from '../test/render';
import { CartPage } from './CartPage';

const item: CartItem = {
  id: 'classic-s',
  title: 'חבילת Classic S',
  subtitle: 'עיצוב חופה ושולחנות',
  category: 'חתונה',
  price: 2900,
  quantity: 1,
  svgType: 'chuppah-s'
};

function renderCart(items: CartItem[] = []) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  return renderWithProviders(<CartProvider><CartPage /></CartProvider>);
}

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.removeItem('ld-lang');
});

describe('CartPage', () => {
  it('shows an empty state', () => {
    renderCart();
    expect(screen.getByText('העגלה עדיין ריקה')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'חזרה לחנות' })).toHaveAttribute('href', '/#packages');
  });

  it('shows totals and allows checkout when minimum is reached', () => {
    renderCart([item]);
    expect(screen.getByText(item.title)).toBeInTheDocument();
    expect(screen.getByText('אין צורך בהרשמה. ממלאים פרטים ומסיימים.')).toBeInTheDocument();
    expect(screen.getAllByText('₪2,900').length).toBeGreaterThan(0);
    expect(screen.getByText('₪3,400')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'המשך לפרטים ותשלום' })).toHaveAttribute('href', '/checkout');
  });

  it('updates quantities with plus and minus buttons', () => {
    renderCart([item]);
    fireEvent.click(screen.getByRole('button', { name: `הגדלת כמות ${item.title}` }));
    expect(screen.getAllByText('₪5,800').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: `הפחתת כמות ${item.title}` }));
    expect(screen.getAllByText('₪2,900').length).toBeGreaterThan(0);
  });

  it('removes an item and clears all items', () => {
    const second = { ...item, id: 'bar', title: 'בר מתוק', price: 2500, svgType: 'bar' };
    renderCart([item, second]);

    fireEvent.click(screen.getAllByRole('button', { name: 'הסרה' })[0]);
    expect(screen.queryByText(item.title)).not.toBeInTheDocument();
    expect(screen.getByText(second.title)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'ריקון העגלה' }));
    expect(screen.getByText('העגלה עדיין ריקה')).toBeInTheDocument();
  });

  it('blocks checkout below the minimum order', () => {
    renderCart([{ ...item, price: 1000 }]);
    expect(screen.getByText(/חסרים להשלמת מינימום ההזמנה/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'המשך לפרטים ותשלום' })).toBeDisabled();
  });

  it('renders English cart content', () => {
    window.localStorage.setItem('ld-lang', 'en');
    renderCart([item]);
    expect(screen.getByText('Your shopping cart')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue to checkout' })).toBeInTheDocument();
  });
});
