import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { CART_DESIGN_STORAGE_KEY, CART_STORAGE_KEY, CartProvider, type CartItem } from '../cart/CartProvider';
import { submitCartOrder } from '../lib/submitCartOrder';
import { renderWithProviders } from '../test/render';
import { CheckoutPage } from './CheckoutPage';

vi.mock('../lib/submitCartOrder', () => ({ submitCartOrder: vi.fn() }));

const item: CartItem = {
  id: 'classic-s',
  title: 'חבילת Classic S',
  subtitle: 'עיצוב חופה ושולחנות',
  category: 'חתונה',
  price: 2900,
  quantity: 1,
  svgType: 'chuppah-s'
};

function renderCheckout(items: CartItem[] = [item]) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.localStorage.setItem(CART_DESIGN_STORAGE_KEY, JSON.stringify({
    palette: 'לבן וזהב',
    customColors: 'שמנת וזהב מט',
    customRequest: 'קיר צילום',
    couponCode: 'מתנה',
    couponApplied: true
  }));
  return renderWithProviders(<CartProvider><CheckoutPage /></CartProvider>, { route: '/checkout' });
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/שם מלא/), { target: { value: 'ישראל ישראלי' } });
  fireEvent.change(screen.getByLabelText(/^טלפון/), { target: { value: '0501234567' } });
  fireEvent.change(screen.getByLabelText(/^אימייל/), { target: { value: 'israel@example.com' } });
  fireEvent.change(screen.getByLabelText(/תאריך האירוע/), { target: { value: '2026-10-10' } });
  fireEvent.change(screen.getByLabelText(/מיקום האירוע/), { target: { value: 'אולם לדוגמה' } });
  fireEvent.click(screen.getByRole('checkbox'));
}

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.removeItem('ld-lang');
  vi.mocked(submitCartOrder).mockReset();
});

describe('CheckoutPage', () => {
  it('blocks quote submission when the cart is empty or below minimum', () => {
    const empty = renderCheckout([]);
    expect(screen.getByText(/העגלה ריקה/)).toBeInTheDocument();
    empty.unmount();

    renderCheckout([{ ...item, price: 1000 }]);
    expect(screen.getByText(/טרם הגעתם למינימום/)).toBeInTheDocument();
  });

  it('shows a quote-only checkout with no payment', () => {
    renderCheckout();
    expect(screen.getByRole('heading', { name: 'שליחת בקשה להצעת מחיר' })).toBeInTheDocument();
    expect(screen.getAllByText(/ללא שום תשלום או התחייבות/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('₪2,900').length).toBeGreaterThan(0);
    expect(screen.queryByText('₪3,400')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'שליחת הצעת מחיר בלבד (ללא תשלום)' })).toBeInTheDocument();
  });

  it('shows the selected design preferences and coupon', () => {
    renderCheckout();
    expect(screen.getByText('לבן וזהב')).toBeInTheDocument();
    expect(screen.getByText('שמנת וזהב מט')).toBeInTheDocument();
    expect(screen.getByText('קיר צילום')).toBeInTheDocument();
    expect(screen.getByText('מתנה')).toBeInTheDocument();
  });

  it('contains the official cancellation and changes policy', () => {
    renderCheckout();
    fireEvent.click(screen.getByText('מדיניות ביטולים, שינויים ואחריות'));
    expect(screen.getByText(/מלחמה או מגפה/)).toBeInTheDocument();
    expect(screen.getByText(/30 ימי עסקים/)).toBeInTheDocument();
    expect(screen.getByText(/האחריות על הציוד בזמן האירוע/)).toBeInTheDocument();
  });

  it('validates required fields, phone and email', () => {
    renderCheckout();
    fireEvent.click(screen.getByRole('button', { name: 'שליחת הצעת מחיר בלבד (ללא תשלום)' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/שדות החובה/);

    fillValidForm();
    fireEvent.change(screen.getByLabelText(/^טלפון/), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: 'שליחת הצעת מחיר בלבד (ללא תשלום)' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/טלפון תקין/);

    fireEvent.change(screen.getByLabelText(/^טלפון/), { target: { value: '0501234567' } });
    fireEvent.change(screen.getByLabelText(/^אימייל/), { target: { value: 'bad-email' } });
    fireEvent.click(screen.getByRole('button', { name: 'שליחת הצעת מחיר בלבד (ללא תשלום)' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/אימייל תקינה/);
  });

  it('submits the quote request, clears the cart and shows success', async () => {
    vi.mocked(submitCartOrder).mockResolvedValue({ id: 'quote-123' });
    renderCheckout();
    fillValidForm();
    fireEvent.change(screen.getByLabelText(/שם נוסף/), { target: { value: 'שרה' } });
    fireEvent.change(screen.getByLabelText(/הערות/), { target: { value: 'ללא פרחים אדומים' } });

    fireEvent.click(screen.getByRole('button', { name: 'שליחת הצעת מחיר בלבד (ללא תשלום)' }));
    expect(screen.getByRole('button', { name: /הבקשה נשלחת/ })).toBeDisabled();

    await waitFor(() => expect(screen.getByText('בקשת הצעת המחיר התקבלה')).toBeInTheDocument());
    expect(screen.getByText(/quote-123/)).toBeInTheDocument();
    expect(submitCartOrder).toHaveBeenCalledWith(expect.objectContaining({
      subtotal: 2900,
      deliveryPrice: 0,
      totalPrice: 2900,
      preferences: expect.objectContaining({ couponCode: 'מתנה', couponApplied: true })
    }));
  });

  it('shows a recoverable error when submission fails', async () => {
    vi.mocked(submitCartOrder).mockRejectedValue(new Error('network'));
    renderCheckout();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'שליחת הצעת מחיר בלבד (ללא תשלום)' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/לא הצלחנו לשלוח/));
    expect(screen.getByRole('button', { name: 'שליחת הצעת מחיר בלבד (ללא תשלום)' })).not.toBeDisabled();
  });

  it('renders the English quote checkout', () => {
    window.localStorage.setItem('ld-lang', 'en');
    renderCheckout();
    expect(screen.getByRole('heading', { name: 'Request a personal quote' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send quote request only (no payment)' })).toBeInTheDocument();
  });
});
