import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

const state = vi.hoisted(() => ({
  items: [] as Array<{ id: string; title: string; category: string; price: number; quantity: number; image?: string }>,
  subtotal: 0,
  preferences: { couponCode: '', couponApplied: false, customColors: '', customRequest: '' },
  updateQuantity: vi.fn(),
  removeItem: vi.fn(),
  applyCoupon: vi.fn(async (_code: string) => false),
  clearCoupon: vi.fn()
}));

vi.mock('../cart/CartProvider', () => ({
  MINIMUM_ORDER: 2500,
  useCart: () => state
}));

import { CartDrawer } from './CartDrawer';

function renderDrawer(open = true, onClose = vi.fn()) {
  return {
    onClose,
    ...render(<MemoryRouter><CartDrawer open={open} onClose={onClose} /></MemoryRouter>)
  };
}

beforeEach(() => {
  state.items = [];
  state.subtotal = 0;
  state.preferences = { couponCode: '', couponApplied: false, customColors: '', customRequest: '' };
  state.updateQuantity.mockReset();
  state.removeItem.mockReset();
  state.applyCoupon.mockReset().mockResolvedValue(false);
  state.clearCoupon.mockReset();
  document.body.style.overflow = '';
});

describe('CartDrawer', () => {
  it('renders a closed empty drawer without locking the page', () => {
    renderDrawer(false);
    expect(screen.getByRole('dialog', { name: 'סל הצעת מחיר', hidden: true }).parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('הסל מחכה לעיצוב שלכם')).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });

  it('locks scrolling when open, focuses the panel, closes from Escape/backdrop/header/empty action and restores overflow', async () => {
    document.body.style.overflow = 'auto';
    const onClose = vi.fn();
    const { unmount } = renderDrawer(true, onClose);
    const dialog = screen.getByRole('dialog', { name: 'סל הצעת מחיר' });
    expect(document.body.style.overflow).toBe('hidden');
    await waitFor(() => expect(document.activeElement).toBe(dialog));

    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'סגירת סל הקניות' }));
    fireEvent.click(screen.getByRole('button', { name: 'סגירה' }));
    fireEvent.click(screen.getByRole('button', { name: 'חזרה לבחירה' }));
    expect(onClose).toHaveBeenCalledTimes(4);

    unmount();
    expect(document.body.style.overflow).toBe('auto');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(4);
  });

  it('renders cart lines, image/no-image variants, design preferences, quantity/remove controls and minimum-order blocking', () => {
    state.items = [
      { id: 'a', title: 'פרחים', category: 'מרכזי שולחן', price: 600, quantity: 2, image: 'https://example.com/a.jpg' },
      { id: 'b', title: 'נרות', category: 'אקססוריז', price: 100, quantity: 1 }
    ];
    state.subtotal = 1300;
    state.preferences = { couponCode: '', couponApplied: false, customColors: 'לבן וזהב', customRequest: 'בלי ורוד' };
    const { onClose } = renderDrawer();

    expect(document.querySelector('img[src="https://example.com/a.jpg"]')).toBeTruthy();
    expect(document.querySelectorAll('article img')).toHaveLength(1);
    expect(screen.getByText('לבן וזהב')).toBeInTheDocument();
    expect(screen.getByText('בלי ורוד')).toBeInTheDocument();
    expect(screen.getByText(/חסרים/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'יש להגיע למינימום כדי להמשיך' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'הפחתת כמות פרחים' }));
    fireEvent.click(screen.getByRole('button', { name: 'הגדלת כמות פרחים' }));
    fireEvent.click(screen.getByRole('button', { name: 'הסרת פרחים' }));
    expect(state.updateQuantity).toHaveBeenNthCalledWith(1, 'a', 1);
    expect(state.updateQuantity).toHaveBeenNthCalledWith(2, 'a', 3);
    expect(state.removeItem).toHaveBeenCalledWith('a');

    fireEvent.click(screen.getByRole('link', { name: 'עדכון צבעים ובקשות' }));
    fireEvent.click(screen.getByRole('link', { name: 'לצפייה בסל המלא' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('shows fallback preference text and allows checkout after reaching the minimum', () => {
    state.items = [{ id: 'a', title: 'חבילה', category: 'אירוע', price: 2500, quantity: 1 }];
    state.subtotal = 2500;
    state.preferences = { couponCode: '', couponApplied: false, customColors: '', customRequest: '' };
    const { onClose } = renderDrawer();

    expect(screen.getByText('טרם נכתבו')).toBeInTheDocument();
    expect(screen.queryByText('בקשה אישית:')).not.toBeInTheDocument();
    expect(screen.queryByText(/חסרים/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'המשך להשלמת בחירת ההזמנה' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('rejects an invalid coupon, clears the error while editing, and resyncs the input when preferences change', async () => {
    state.items = [{ id: 'a', title: 'חבילה', category: 'אירוע', price: 2500, quantity: 1 }];
    state.subtotal = 2500;
    const { rerender } = render(<MemoryRouter><CartDrawer open onClose={vi.fn()} /></MemoryRouter>);
    const input = screen.getByLabelText('יש לכם קוד קופון?');
    fireEvent.change(input, { target: { value: 'BAD' } });
    fireEvent.click(screen.getByRole('button', { name: 'הפעלה' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('הקוד אינו תקין.'));
    expect(state.applyCoupon).toHaveBeenCalledWith('BAD');

    fireEvent.change(input, { target: { value: 'NEW' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    state.preferences = { ...state.preferences, couponCode: 'SERVER' };
    rerender(<MemoryRouter><CartDrawer open onClose={vi.fn()} /></MemoryRouter>);
    expect(screen.getByLabelText('יש לכם קוד קופון?')).toHaveValue('SERVER');
  });

  it('accepts a coupon, displays applied status, and clears it', async () => {
    state.items = [{ id: 'a', title: 'חבילה', category: 'אירוע', price: 2500, quantity: 1 }];
    state.subtotal = 2500;
    state.preferences = { couponCode: 'GOOD', couponApplied: true, customColors: '', customRequest: '' };
    state.applyCoupon.mockResolvedValue(true);
    renderDrawer();

    const section = screen.getByLabelText('יש לכם קוד קופון?').closest('section')!;
    expect(within(section).getByRole('status')).toHaveTextContent('קופון התקבל');
    fireEvent.click(within(section).getByRole('button', { name: 'ביטול' }));
    expect(state.clearCoupon).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('יש לכם קוד קופון?')).toHaveValue('');

    fireEvent.change(screen.getByLabelText('יש לכם קוד קופון?'), { target: { value: 'GOOD' } });
    fireEvent.click(within(section).getByRole('button', { name: 'הפעלה' }));
    await waitFor(() => expect(state.applyCoupon).toHaveBeenCalledWith('GOOD'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('prevents a duplicate coupon submit while a request is already busy', async () => {
    state.items = [{ id: 'a', title: 'חבילה', category: 'אירוע', price: 2500, quantity: 1 }];
    state.subtotal = 2500;
    let resolve!: (value: boolean) => void;
    state.applyCoupon.mockImplementation(() => new Promise<boolean>((done) => { resolve = done; }));
    renderDrawer();
    const button = screen.getByRole('button', { name: 'הפעלה' });
    fireEvent.click(button);
    await waitFor(() => expect(screen.getByRole('button', { name: 'בודק…' })).toBeDisabled());
    fireEvent.click(screen.getByRole('button', { name: 'בודק…' }));
    expect(state.applyCoupon).toHaveBeenCalledTimes(1);
    resolve(true);
    await waitFor(() => expect(screen.getByRole('button', { name: 'הפעלה' })).toBeEnabled());
  });
});
