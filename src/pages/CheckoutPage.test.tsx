import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { CART_DESIGN_STORAGE_KEY, CART_STORAGE_KEY, CartProvider, type CartItem } from '../cart/CartProvider';
import { BRANDING_OVERRIDE_ID } from '../lib/branding';
import type { OverrideMap } from '../lib/packages';
import { submitCartOrder } from '../lib/submitCartOrder';
import { renderWithProviders } from '../test/render';
import { CheckoutPage } from './CheckoutPage';

const coupon = vi.hoisted(() => ({ validate: vi.fn() }));
vi.mock('../lib/coupons', () => ({ validateCouponCode: coupon.validate }));
vi.mock('../lib/submitCartOrder', () => ({ submitCartOrder: vi.fn() }));

const packageState = vi.hoisted(() => ({ overrides: {} as OverrideMap }));

vi.mock('../packages/PackagesProvider', () => ({
  usePackages: () => ({
    overrides: packageState.overrides,
    loading: false,
    refresh: vi.fn(),
    saveOverride: vi.fn(),
    saveImage: vi.fn(),
    removeOverride: vi.fn()
  })
}));

const item: CartItem = {
  id: 'classic-s',
  title: 'חבילת Classic S',
  subtitle: 'עיצוב חופה ושולחנות',
  category: 'חתונה',
  price: 2900,
  quantity: 1,
  svgType: 'chuppah-s'
};

const STORED_COUPON = 'server-approved-code';

function renderCheckout(items: CartItem[] = [item]) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.localStorage.setItem(CART_DESIGN_STORAGE_KEY, JSON.stringify({
    customColors: 'פרחים לבנים, אקססוריז זהב ובלונים ורודים',
    customRequest: 'קיר צילום',
    couponCode: STORED_COUPON,
    couponApplied: true
  }));
  return renderWithProviders(<CartProvider><CheckoutPage /></CartProvider>, { route: '/checkout' });
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/סוג האירוע/), { target: { value: 'henna' } });
  fireEvent.change(screen.getByLabelText(/שם המזמין\/ה \*/), { target: { value: 'ישראל ישראלי' } });
  fireEvent.change(screen.getByLabelText(/^מספר טלפון/), { target: { value: '0501234567' } });
  fireEvent.change(screen.getByLabelText(/^אימייל/), { target: { value: 'israel@example.com' } });
  fireEvent.change(screen.getByLabelText(/תאריך האירוע/), { target: { value: '2026-10-10' } });
  fireEvent.change(screen.getByLabelText(/מיקום האירוע/), { target: { value: 'אולם לדוגמה' } });
  fireEvent.change(screen.getByLabelText('הקלדת שם מלא לחתימה'), { target: { value: 'ישראל ישראלי' } });
  fireEvent.click(screen.getByLabelText(/אני מאשר\/ת/));
}

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.removeItem('ld-lang');
  packageState.overrides = {};
  coupon.validate.mockReset().mockResolvedValue(true);
  vi.mocked(submitCartOrder).mockReset();
});

describe('CheckoutPage', () => {
  it('blocks submission when the cart is empty or below minimum', () => {
    const empty = renderCheckout([]);
    expect(screen.getByText(/העגלה ריקה/)).toBeInTheDocument();
    empty.unmount();

    renderCheckout([{ ...item, price: 1000 }]);
    expect(screen.getByText(/טרם הגעתם למינימום/)).toBeInTheDocument();
  });

  it('shows the exact no-payment message and an unsigned order total', () => {
    renderCheckout();
    expect(screen.getByRole('heading', { name: 'שליחת בחירת ההזמנה' })).toBeInTheDocument();
    expect(screen.getAllByText(/לא משלמים כרגע/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('₪2,900').length).toBeGreaterThan(0);
    expect(screen.queryByText('₪3,400')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'שליחת ההזמנה (ללא תשלום כרגע)' })).toBeInTheDocument();
  });

  it('shows free-text colors, custom request and a server-revalidated coupon without shade cards', async () => {
    renderCheckout();
    expect(screen.getByText('פרחים לבנים, אקססוריז זהב ובלונים ורודים')).toBeInTheDocument();
    expect(screen.getByText('קיר צילום')).toBeInTheDocument();
    await waitFor(() => expect(coupon.validate).toHaveBeenCalledWith(STORED_COUPON));
    await waitFor(() => expect(screen.getByText(STORED_COUPON)).toBeInTheDocument());
    expect(screen.queryByText('גוון לפרחים')).not.toBeInTheDocument();
  });

  it('adds optional delivery and setup for exactly ₪500', () => {
    renderCheckout();
    fireEvent.click(screen.getByLabelText(/הוספת שירות הובלה והרכבה/));
    expect(screen.getAllByText('₪3,400').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByLabelText(/הוספת שירות הובלה והרכבה/));
    expect(screen.queryByText('₪3,400')).not.toBeInTheDocument();
  });

  it('requires two phones and two signatures for weddings and engagements', () => {
    renderCheckout();
    fillValidForm();
    fireEvent.change(screen.getByLabelText(/סוג האירוע/), { target: { value: 'wedding' } });

    expect(screen.getByLabelText(/מספר טלפון נוסף/)).toBeInTheDocument();
    expect(screen.getAllByLabelText('הקלדת שם מלא לחתימה')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'שליחת ההזמנה (ללא תשלום כרגע)' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/שני המזמינים/);
  });

  it('requires the primary signature after all contact fields are complete', () => {
    renderCheckout();
    fireEvent.change(screen.getByLabelText(/סוג האירוע/), { target: { value: 'henna' } });
    fireEvent.change(screen.getByLabelText(/שם המזמין\/ה \*/), { target: { value: 'ישראל ישראלי' } });
    fireEvent.change(screen.getByLabelText(/^מספר טלפון/), { target: { value: '0501234567' } });
    fireEvent.change(screen.getByLabelText(/^אימייל/), { target: { value: 'israel@example.com' } });
    fireEvent.change(screen.getByLabelText(/תאריך האירוע/), { target: { value: '2026-10-10' } });
    fireEvent.change(screen.getByLabelText(/מיקום האירוע/), { target: { value: 'אולם לדוגמה' } });
    fireEvent.click(screen.getByLabelText(/אני מאשר\/ת/));

    fireEvent.click(screen.getByRole('button', { name: 'שליחת ההזמנה (ללא תשלום כרגע)' }));

    expect(screen.getByRole('alert')).toHaveTextContent(/נדרשת חתימה/);
  });

  it('submits both hosts, both signatures, quantities and the uploaded logo for a wedding', async () => {
    vi.mocked(submitCartOrder).mockResolvedValue({ id: 'wedding-order' });
    packageState.overrides = {
      [BRANDING_OVERRIDE_ID]: {
        package_id: BRANDING_OVERRIDE_ID,
        price: null,
        title: 'LD Event Design logo',
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
    renderCheckout([{ ...item, quantity: 2 }]);
    fillValidForm();
    fireEvent.change(screen.getByLabelText(/סוג האירוע/), { target: { value: 'wedding' } });
    fireEvent.change(screen.getByLabelText(/שם המזמין\/ה הנוסף\/ת/), { target: { value: 'ישראלה ישראלי' } });
    fireEvent.change(screen.getByLabelText(/מספר טלפון נוסף/), { target: { value: '0527654321' } });
    const signatures = screen.getAllByLabelText('הקלדת שם מלא לחתימה');
    fireEvent.change(signatures[1], { target: { value: 'ישראלה ישראלי' } });

    expect(screen.getByText(/חבילת Classic S × 2/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'לוגו LD Event Design' })).toHaveAttribute('src', 'https://cdn.example/logo.png');
    fireEvent.click(screen.getByRole('button', { name: 'שליחת ההזמנה (ללא תשלום כרגע)' }));

    await waitFor(() => expect(submitCartOrder).toHaveBeenCalledWith(expect.objectContaining({
      brandLogoUrl: 'https://cdn.example/logo.png',
      signatures: expect.objectContaining({
        secondary: expect.objectContaining({ typedName: 'ישראלה ישראלי' })
      }),
      items: [expect.objectContaining({ quantity: 2 })]
    })));
  });

  it('contains policy text and validates phone and email', () => {
    renderCheckout();
    fireEvent.click(screen.getByText('מדיניות ביטולים, שינויים ואחריות'));
    expect(screen.getByText(/מלחמה או מגפה/)).toBeInTheDocument();
    expect(screen.getByText(/30 ימי עסקים/)).toBeInTheDocument();

    fillValidForm();
    fireEvent.change(screen.getByLabelText(/^מספר טלפון/), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: 'שליחת ההזמנה (ללא תשלום כרגע)' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/טלפון תקין/);

    fireEvent.change(screen.getByLabelText(/^מספר טלפון/), { target: { value: '0501234567' } });
    fireEvent.change(screen.getByLabelText(/^אימייל/), { target: { value: 'bad-email' } });
    fireEvent.click(screen.getByRole('button', { name: 'שליחת ההזמנה (ללא תשלום כרגע)' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/אימייל תקינה/);
  });

  it('submits signatures and optional delivery, clears the cart and shows success', async () => {
    vi.mocked(submitCartOrder).mockResolvedValue({ id: 'order-123' });
    renderCheckout();
    await waitFor(() => expect(coupon.validate).toHaveBeenCalledWith(STORED_COUPON));
    await waitFor(() => expect(screen.getByText(STORED_COUPON)).toBeInTheDocument());
    fillValidForm();
    fireEvent.change(screen.getByLabelText(/הערות/), { target: { value: 'ללא פרחים אדומים' } });
    fireEvent.click(screen.getByLabelText(/הוספת שירות הובלה והרכבה/));

    fireEvent.click(screen.getByRole('button', { name: 'שליחת ההזמנה (ללא תשלום כרגע)' }));
    expect(screen.getByRole('button', { name: /ההזמנה נשלחת/ })).toBeDisabled();

    await waitFor(() => expect(screen.getByText('בחירת ההזמנה התקבלה')).toBeInTheDocument());
    expect(screen.getByText(/order-123/)).toBeInTheDocument();
    expect(submitCartOrder).toHaveBeenCalledWith(expect.objectContaining({
      subtotal: 2900,
      includeDelivery: true,
      deliveryPrice: 500,
      totalPrice: 3400,
      signatures: expect.objectContaining({
        primary: expect.objectContaining({ typedName: 'ישראל ישראלי' }),
        secondary: null
      }),
      preferences: expect.objectContaining({ couponCode: STORED_COUPON, couponApplied: true })
    }));
  });

  it('shows a recoverable error and renders the English flow', async () => {
    vi.mocked(submitCartOrder).mockRejectedValue(new Error('network'));
    const view = renderCheckout();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'שליחת ההזמנה (ללא תשלום כרגע)' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/לא הצלחנו לשלוח/));

    view.unmount();
    window.localStorage.clear();
    window.localStorage.setItem('ld-lang', 'en');
    renderCheckout();
    expect(screen.getByRole('heading', { name: 'Submit your order selection' })).toBeInTheDocument();
  });
});
