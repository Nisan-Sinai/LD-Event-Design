import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { I18nProvider } from './i18n/i18n';

const env = vi.hoisted(() => ({
  configured: false,
  user: null as { id: string; email?: string } | null,
  submit: vi.fn(async () => ({ id: 'order-1' })),
  signOut: vi.fn()
}));

vi.mock('./lib/supabase', () => ({
  get isSupabaseConfigured() {
    return env.configured;
  },
  supabase: {}
}));
vi.mock('./lib/submitOrder', () => ({ submitOrder: env.submit }));
vi.mock('./auth/AuthProvider', () => ({
  useAuth: () => ({ user: env.user, signOut: env.signOut })
}));
vi.mock('./components/AuthModal', () => ({
  AuthModal: ({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) => open ? (
    <div role="dialog" aria-label="mock-auth">
      <button onClick={onClose}>mock-close-auth</button>
      <button onClick={onSuccess}>mock-success-auth</button>
    </div>
  ) : null
}));
vi.mock('./components/AccessibilityWidget', () => ({
  AccessibilityWidget: ({ onOpenStatement }: { onOpenStatement: () => void }) => (
    <button type="button" onClick={onOpenStatement}>mock-accessibility-statement</button>
  )
}));
vi.mock('./components/WhatsAppButton', () => ({ WhatsAppButton: () => <div data-testid="whatsapp" /> }));

import App from './App';

beforeAll(() => {
  window.print = vi.fn();
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    strokeStyle: '',
    lineWidth: 0,
    lineCap: '',
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    clearRect: vi.fn()
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,xx');
});

const renderApp = () => render(<I18nProvider><MemoryRouter><App /></MemoryRouter></I18nProvider>);

function fillStep1() {
  fireEvent.change(screen.getByLabelText(/שם בעל האירוע/), { target: { value: 'ישראל ישראלי' } });
  fireEvent.change(screen.getByLabelText(/שם בעלת האירוע/), { target: { value: 'דנה ישראלי' } });
  fireEvent.change(screen.getByLabelText(/טלפון בעל האירוע/), { target: { value: '0501111111' } });
  fireEvent.change(screen.getByLabelText(/טלפון בעלת האירוע/), { target: { value: '0502222222' } });
  fireEvent.change(screen.getByLabelText(/אימייל/), { target: { value: 'a@b.com' } });
  fireEvent.change(screen.getByLabelText(/תאריך האירוע/), { target: { value: '2026-09-01' } });
  fireEvent.change(screen.getByLabelText(/מיקום האירוע/), { target: { value: 'אולם' } });
}

function reachStep3() {
  renderApp();
  fillStep1();
  fireEvent.click(screen.getByRole('button', { name: /המשך לבחירת חבילת עיצוב/ }));
  fireEvent.click(screen.getByText('חבילת עיצוב חתונה - Classic S'));
  fireEvent.click(screen.getByRole('button', { name: /המשך לתוספות וחתימה/ }));
}

function signWithMouse() {
  document.querySelectorAll('canvas').forEach((canvas) => {
    fireEvent.mouseDown(canvas, { clientX: 5, clientY: 5 });
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
    fireEvent.mouseUp(canvas);
  });
}

async function submitValidOrder() {
  fireEvent.click(screen.getByText(/הובלה, הרכבה ופירוק מלא/));
  fireEvent.click(screen.getByRole('checkbox'));
  signWithMouse();
  fireEvent.click(screen.getByRole('button', { name: /אישור והדפסת ההזמנה/ }));
}

beforeEach(() => {
  env.configured = false;
  env.user = null;
  env.submit.mockReset().mockResolvedValue({ id: 'order-1' });
  env.signOut.mockClear();
  vi.mocked(window.print).mockClear();
  vi.mocked(window.scrollTo).mockClear();
});

describe('App exhaustive UI branches', () => {
  it('opens every legal document and closes by inner-safe click, Escape, X, bottom button and backdrop', () => {
    renderApp();
    const legalNav = screen.getByRole('navigation', { name: 'תנאי שימוש' });

    fireEvent.click(within(legalNav).getByRole('button', { name: 'מדיניות פרטיות' }));
    let dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('מדיניות פרטיות');
    fireEvent.click(dialog.querySelector('div')!);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(within(legalNav).getByRole('button', { name: 'תנאי שימוש' }));
    dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getAllByRole('button', { name: 'סגירה' })[0]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'mock-accessibility-statement' }));
    dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('הצהרת נגישות');
    const closeButtons = within(dialog).getAllByRole('button', { name: 'סגירה' });
    fireEvent.click(closeButtons[closeButtons.length - 1]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(within(legalNav).getByRole('button', { name: 'מדיניות פרטיות' }));
    dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens legal terms/privacy from step 3 and updates both signature dates', () => {
    reachStep3();
    const checkbox = screen.getByRole('checkbox');
    const termsContainer = checkbox.closest('div')!;
    fireEvent.click(within(termsContainer).getByRole('button', { name: 'תנאי שימוש' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('תנאי שימוש');
    fireEvent.click(screen.getByRole('dialog'));

    fireEvent.click(within(termsContainer).getByRole('button', { name: 'מדיניות פרטיות' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('מדיניות פרטיות');
    fireEvent.click(screen.getByRole('dialog'));

    const dates = screen.getAllByDisplayValue('') as HTMLInputElement[];
    const dateInputs = dates.filter((input) => input.type === 'date');
    const groomDate = dateInputs[dateInputs.length - 2];
    const brideDate = dateInputs[dateInputs.length - 1];
    fireEvent.change(groomDate, { target: { value: '2026-08-18' } });
    fireEvent.change(brideDate, { target: { value: '2026-08-19' } });
    expect(groomDate).toHaveValue('2026-08-18');
    expect(brideDate).toHaveValue('2026-08-19');
  });

  it('covers touch signature coordinates with non-zero canvas geometry and clears the bride signature', () => {
    reachStep3();
    const canvases = Array.from(document.querySelectorAll('canvas'));
    canvases.forEach((canvas) => {
      vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
        x: 10, y: 20, left: 10, top: 20, right: 710, bottom: 212,
        width: 700, height: 192, toJSON: () => ({})
      });
      fireEvent.touchStart(canvas, { touches: [{ clientX: 110, clientY: 60 }] });
      fireEvent.touchMove(canvas, { touches: [{ clientX: 210, clientY: 100 }] });
      fireEvent.touchEnd(canvas, { changedTouches: [{ clientX: 210, clientY: 100 }] });
    });
    const clears = screen.getAllByRole('button', { name: 'נקה' });
    expect(clears).toHaveLength(2);
    fireEvent.click(clears[1]);
    expect(screen.getByText('חתימת בעלת האירוע כאן')).toBeInTheDocument();
  });

  it('shows submit failure and always leaves the submit button enabled again', async () => {
    env.configured = true;
    env.user = { id: 'u1', email: 'a@b.com' };
    env.submit.mockRejectedValueOnce(new Error('database failed'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    reachStep3();
    await submitValidOrder();
    await waitFor(() => expect(env.submit).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /אישור והדפסת ההזמנה/ })).toBeEnabled();
    expect(window.print).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('covers guest success print-again and both AuthModal close/success callbacks', async () => {
    env.configured = true;
    env.user = null;
    reachStep3();
    await submitValidOrder();
    await waitFor(() => expect(screen.getByText(/ההזמנה נשלחה בהצלחה/)).toBeInTheDocument());

    vi.mocked(window.print).mockClear();
    fireEvent.click(screen.getByRole('button', { name: /הדפס/ }));
    expect(window.print).toHaveBeenCalledTimes(1);

    const createAccount = screen.getByRole('button', { name: /צרו חשבון/ });
    fireEvent.click(createAccount);
    expect(screen.getByRole('dialog', { name: 'mock-auth' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'mock-close-auth' }));
    expect(screen.queryByRole('dialog', { name: 'mock-auth' })).not.toBeInTheDocument();

    fireEvent.click(createAccount);
    fireEvent.click(screen.getByRole('button', { name: 'mock-success-auth' }));
    expect(screen.queryByRole('dialog', { name: 'mock-auth' })).not.toBeInTheDocument();
  });

  it('covers logged-in header logout and the English language branch', () => {
    env.user = { id: 'u1', email: 'a@b.com' };
    renderApp();
    fireEvent.click(screen.getByTitle('התנתקות'));
    expect(env.signOut).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.lang).toBe('en');
  });
});
