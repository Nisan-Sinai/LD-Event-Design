import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { CART_STORAGE_KEY, CartProvider, type CartItem } from '../cart/CartProvider';
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
  return renderWithProviders(<CartProvider><CheckoutPage /></CartProvider>, { route: '/checkout' });
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/שם המזמין/), { target: { value: 'ישראל ישראלי' } });
  fireEvent.change(screen.getByLabelText(/^טלפון/), { target: { value: '0501234567' } });
  fireEvent.change(screen.getByLabelText(/^אימייל/), { target: { value: 'israel@example.com' } });
  fireEvent.change(screen.getByLabelText(/תאריך האירוע/), { target: { value: '2026-10-10' } });
  fireEvent.change(screen.getByLabelText(/מקום האירוע/), { target: { value: 'אולם לדוגמה' } });
  fireEvent.click(screen.getByRole('checkbox'));
}

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.removeItem('ld-lang');
  vi.mocked(submitCartOrder).mockReset();
});

describe('CheckoutPage', () => {
  it('blocks checkout when the cart is empty or below minimum', () => {
    const empty = renderCheckout([]);
    expect(screen.getByText(/העגלה ריקה/)).toBeInTheDocument();
    empty.unmount();

    renderCheckout([{ ...item, price: 1000 }]);
    expect(screen.getByText(/העגלה ריקה/)).toBeInTheDocument();
  });

  it('shows a guest checkout without registration', () => {
    renderCheckout();
    expect(screen.getByRole('heading', { name: 'השלמת הזמנה' })).toBeInTheDocument();
    expect(screen.getByText(/אין צורך בהרשמה או בפתיחת חשבון/)).toBeInTheDocument();
    expect(screen.getByText('₪3,400')).toBeInTheDocument();
  });

  it('validates required fields, phone and email', () => {
    renderCheckout();
    fireEvent.click(screen.getByRole('button', { name: 'שליחת ההזמנה' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/שדות החובה/);

    fillValidForm();
    fireEvent.change(screen.getByLabelText(/^טלפון/), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: 'שליחת ההזמנה' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/טלפון תקין/);

    fireEvent.change(screen.getByLabelText(/^טלפון/), { target: { value: '0501234567' } });
    fireEvent.change(screen.getByLabelText(/^אימייל/), { target: { value: 'bad-email' } });
    fireEvent.click(screen.getByRole('button', { name: 'שליחת ההזמנה' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/אימייל תקינה/);
  });

  it('submits the order, clears the cart and shows success', async () => {
    vi.mocked(submitCartOrder).mockResolvedValue({ id: 'order-123' });
    renderCheckout();
    fillValidForm();
    fireEvent.change(screen.getByLabelText(/שם נוסף/), { target: { value: 'שרה' } });
    fireEvent.change(screen.getByLabelText(/הערות/), { target: { value: 'ללא פרחים אדומים' } });

    fireEvent.click(screen.getByRole('button', { name: 'שליחת ההזמנה' }));
    expect(screen.getByRole('button', { name: /ההזמנה נשלחת/ })).toBeDisabled();

    await waitFor(() => expect(screen.getByText('ההזמנה התקבלה בהצלחה')).toBeInTheDocument());
    expect(screen.getByText(/order-123/)).toBeInTheDocument();
    expect(submitCartOrder).toHaveBeenCalledWith(expect.objectContaining({ subtotal: 2900, totalPrice: 3400 }));
  });

  it('shows a recoverable error when submission fails', async () => {
    vi.mocked(submitCartOrder).mockRejectedValue(new Error('network'));
    renderCheckout();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'שליחת ההזמנה' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/לא הצלחנו לשלוח/));
    expect(screen.getByRole('button', { name: 'שליחת ההזמנה' })).not.toBeDisabled();
  });

  it('renders the English checkout', () => {
    window.localStorage.setItem('ld-lang', 'en');
    renderCheckout();
    expect(screen.getByRole('heading', { name: 'Complete your order' })).toBeInTheDocument();
    expect(screen.getByText(/No registration/)).toBeInTheDocument();
  });
});
