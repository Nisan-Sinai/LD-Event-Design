import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { CART_DESIGN_STORAGE_KEY, CART_STORAGE_KEY, CartProvider, type CartItem } from '../cart/CartProvider';
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

  it('shows quote totals without a fixed delivery charge when the minimum is reached', () => {
    renderCart([item]);
    expect(screen.getByText(item.title)).toBeInTheDocument();
    expect(screen.getByText(/לא משלמים כרגע/)).toBeInTheDocument();
    expect(screen.getAllByText('₪2,900').length).toBeGreaterThan(0);
    expect(screen.queryByText('₪3,400')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'המשך להשלמת בחירת ההזמנה' })).toHaveAttribute('href', '/checkout');
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

  it('blocks quote submission below the minimum and shows the minimum only in the cart', () => {
    renderCart([{ ...item, price: 1000 }]);
    expect(screen.getByText('מינימום להזמנה הינו 2,900 ש״ח')).toBeInTheDocument();
    expect(screen.getByText(/חסרים להשלמת מינימום ההזמנה/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'המשך להשלמת בחירת ההזמנה' })).toBeDisabled();
  });

  it('accepts only the gift coupon, persists it and can clear it', () => {
    renderCart([item]);
    const input = screen.getByLabelText('קוד קופון');

    fireEvent.change(input, { target: { value: 'לא תקין' } });
    fireEvent.click(screen.getByRole('button', { name: 'הפעלת קופון' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/אינו תקין/);

    fireEvent.change(input, { target: { value: 'מתנה' } });
    fireEvent.click(screen.getByRole('button', { name: 'הפעלת קופון' }));
    expect(screen.getByRole('status')).toHaveTextContent(/מתנה מפתיעה/);
    expect(JSON.parse(window.localStorage.getItem(CART_DESIGN_STORAGE_KEY) ?? '{}')).toMatchObject({ couponApplied: true, couponCode: 'מתנה' });

    fireEvent.click(screen.getByRole('button', { name: 'ביטול' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('renders English quote cart content', () => {
    window.localStorage.setItem('ld-lang', 'en');
    renderCart([item]);
    expect(screen.getByText('Your design cart')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue to complete your selection' })).toBeInTheDocument();
  });
});
