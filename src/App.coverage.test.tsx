import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { I18nProvider } from './i18n/i18n';

const env = vi.hoisted(() => ({
  configured: false,
  user: null as { id: string; email?: string } | null,
  submit: vi.fn(async () => ({ id: 'order-coverage' })),
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
  AuthModal: ({
    open,
    onClose,
    onSuccess
  }: {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
  }) =>
    open ? (
      <div role="dialog" aria-label="coverage auth modal">
        <button type="button" onClick={onClose}>coverage auth close</button>
        <button type="button" onClick={onSuccess}>coverage auth success</button>
      </div>
    ) : null
}));

vi.mock('./components/AccessibilityWidget', () => ({
  AccessibilityWidget: ({ onOpenStatement }: { onOpenStatement: () => void }) => (
    <button type="button" onClick={onOpenStatement}>coverage accessibility statement</button>
  )
}));

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
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,coverage');
});

const renderApp = () =>
  render(
    <I18nProvider>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </I18nProvider>
  );

function fillStep1() {
  fireEvent.change(screen.getByLabelText(/שם בעל האירוע/), { target: { value: 'ישראל ישראלי' } });
  fireEvent.change(screen.getByLabelText(/שם בעלת האירוע/), { target: { value: 'דנה ישראלי' } });
  fireEvent.change(screen.getByLabelText(/טלפון בעל האירוע/), { target: { value: '0501111111' } });
  fireEvent.change(screen.getByLabelText(/טלפון בעלת האירוע/), { target: { value: '0502222222' } });
  fireEvent.change(screen.getByLabelText(/תאריך האירוע/), { target: { value: '2026-09-01' } });
  fireEvent.change(screen.getByLabelText(/מיקום האירוע/), { target: { value: 'אולמי היער, חדרה' } });
  fireEvent.change(screen.getByLabelText(/אימייל/), { target: { value: 'coverage@example.com' } });
}

const next1 = () => fireEvent.click(screen.getByRole('button', { name: /המשך לבחירת חבילת עיצוב/ }));
const next2 = () => fireEvent.click(screen.getByRole('button', { name: /המשך לתוספות וחתימה/ }));
const pickPackage = () => fireEvent.click(screen.getByText('חבילת עיצוב חתונה - Classic S'));

function reachStep3() {
  renderApp();
  fillStep1();
  next1();
  pickPackage();
  next2();
}

function signWithMouse() {
  document.querySelectorAll('canvas').forEach((canvas) => {
    fireEvent.mouseDown(canvas, { clientX: 5, clientY: 5 });
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
    fireEvent.mouseUp(canvas);
  });
}

function completeRequiredStep3() {
  fireEvent.click(screen.getByText(/הובלה, הרכבה ופירוק מלא/));
  fireEvent.click(screen.getByRole('checkbox'));
  signWithMouse();
}

beforeEach(() => {
  env.configured = false;
  env.user = null;
  env.submit.mockReset().mockResolvedValue({ id: 'order-coverage' });
  env.signOut.mockReset();
  (window.print as ReturnType<typeof vi.fn>).mockClear();
  window.localStorage.clear();
});

describe('App additional coverage', () => {
  it('opens legal documents from the footer and supports inner click, Escape, overlay and close button', () => {
    renderApp();

    fireEvent.click(screen.getByRole('button', { name: 'מדיניות פרטיות' }));
    const privacyDialog = screen.getByRole('dialog');
    fireEvent.click(screen.getByRole('heading', { name: 'מדיניות פרטיות' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'תנאי שימוש' }));
    fireEvent.click(screen.getByRole('dialog'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'הצהרת נגישות' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'סגירה' })[0]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    expect(privacyDialog).not.toBeInTheDocument();
  });

  it('opens the accessibility statement through the widget callback and closes with the primary close action', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'coverage accessibility statement' }));
    expect(screen.getByRole('heading', { name: 'הצהרת נגישות' })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'סגירה' })[1]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('switches languages both ways and calls signOut for a logged-in user', () => {
    env.user = { id: 'coverage-user', email: 'coverage@example.com' };
    renderApp();

    fireEvent.click(screen.getByTitle('התנתקות'));
    expect(env.signOut).toHaveBeenCalledTimes(1);

    const english = screen.getByRole('button', { name: 'EN' });
    fireEvent.click(english);
    expect(english).toHaveAttribute('aria-pressed', 'true');

    const hebrew = screen.getByRole('button', { name: 'עברית' });
    fireEvent.click(hebrew);
    expect(hebrew).toHaveAttribute('aria-pressed', 'true');
  });

  it('validates the bride full name and bride phone branches', () => {
    renderApp();
    fillStep1();
    fireEvent.change(screen.getByLabelText(/שם בעלת האירוע/), { target: { value: 'דנה' } });
    fireEvent.change(screen.getByLabelText(/טלפון בעלת האירוע/), { target: { value: '123' } });
    next1();

    expect(screen.getByText('חובה להזין שם פרטי ושם משפחה')).toBeInTheDocument();
    expect(screen.getByText('מספר טלפון אינו תקין')).toBeInTheDocument();
  });

  it('removes a selected package from the selected package summary', () => {
    renderApp();
    fillStep1();
    next1();
    pickPackage();

    expect(screen.getByText(/החבילות שבחרת/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /הסר חבילה:.*Classic S/ }));
    expect(screen.queryByText(/החבילות שבחרת/)).not.toBeInTheDocument();
  });

  it('covers bride signature clear and touch coordinates', () => {
    reachStep3();
    const canvases = document.querySelectorAll('canvas');
    const groom = canvases[0];
    const bride = canvases[1];

    fireEvent.mouseDown(groom, { clientX: 4, clientY: 4 });
    fireEvent.mouseMove(groom, { clientX: 18, clientY: 18 });
    fireEvent.mouseUp(groom);

    fireEvent.touchStart(bride, { touches: [{ clientX: 6, clientY: 6 }] });
    fireEvent.touchMove(bride, { touches: [{ clientX: 22, clientY: 22 }] });
    fireEvent.touchEnd(bride, { changedTouches: [{ clientX: 22, clientY: 22 }] });

    const clearButtons = screen.getAllByRole('button', { name: 'נקה' });
    expect(clearButtons).toHaveLength(2);
    fireEvent.click(clearButtons[1]);
    expect(screen.getAllByRole('button', { name: 'נקה' })).toHaveLength(1);
  });

  it('updates both signature dates on step 3', () => {
    reachStep3();
    const dateInputs = Array.from(document.querySelectorAll('input[type="date"]')) as HTMLInputElement[];
    expect(dateInputs.length).toBeGreaterThanOrEqual(3);
    const groomDate = dateInputs[dateInputs.length - 2];
    const brideDate = dateInputs[dateInputs.length - 1];

    fireEvent.change(groomDate, { target: { value: '2026-08-18' } });
    fireEvent.change(brideDate, { target: { value: '2026-08-19' } });

    expect(groomDate).toHaveValue('2026-08-18');
    expect(brideDate).toHaveValue('2026-08-19');
  });

  it('shows a recoverable submit error when Supabase order persistence rejects', async () => {
    env.configured = true;
    env.user = { id: 'coverage-user', email: 'coverage@example.com' };
    env.submit.mockRejectedValueOnce(new Error('coverage failure'));
    reachStep3();
    completeRequiredStep3();

    fireEvent.click(screen.getByRole('button', { name: /אישור והדפסת ההזמנה/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'שמירת ההזמנה נכשלה. בדקו את החיבור לאינטרנט ונסו שוב.'
    );
    expect(window.print).not.toHaveBeenCalled();
  });

  it('covers guest success print, auth CTA, AuthModal close and AuthModal success callbacks', async () => {
    env.configured = true;
    env.user = null;
    reachStep3();
    completeRequiredStep3();

    fireEvent.click(screen.getByRole('button', { name: /אישור והדפסת ההזמנה/ }));
    await screen.findByText(/ההזמנה נשלחה בהצלחה/);

    const printsBefore = (window.print as ReturnType<typeof vi.fn>).mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'הדפסת ההזמנה' }));
    expect(window.print).toHaveBeenCalledTimes(printsBefore + 1);

    const createAccount = screen.getByRole('button', { name: /צרו חשבון/ });
    fireEvent.click(createAccount);
    expect(screen.getByRole('dialog', { name: 'coverage auth modal' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'coverage auth close' }));
    expect(screen.queryByRole('dialog', { name: 'coverage auth modal' })).not.toBeInTheDocument();

    fireEvent.click(createAccount);
    fireEvent.click(screen.getByRole('button', { name: 'coverage auth success' }));
    expect(screen.queryByRole('dialog', { name: 'coverage auth modal' })).not.toBeInTheDocument();
  });

  it('covers admin source, receiver, status, internal notes and manual discount changes', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /בעל העסק \/ מנהל/ }));

    fireEvent.change(screen.getByLabelText('מקור ההזמנה'), { target: { value: 'whatsapp' } });
    fireEvent.change(screen.getByLabelText('מי קיבל את ההזמנה'), { target: { value: 'employee' } });
    fireEvent.change(screen.getByLabelText('סטטוס הזמנה'), { target: { value: 'approved' } });
    fireEvent.change(screen.getByLabelText('הערות פנימיות (לא ללקוח)'), { target: { value: 'coverage note' } });

    fillStep1();
    next1();
    pickPackage();
    next2();
    fireEvent.change(screen.getByLabelText('הנחת מנהל (₪)'), { target: { value: '100' } });

    expect(screen.getByLabelText('הנחת מנהל (₪)')).toHaveValue(100);
  });

  it('opens legal terms and privacy from the inline step-3 controls', () => {
    reachStep3();

    const termsButtons = screen.getAllByRole('button', { name: 'תנאי שימוש' });
    fireEvent.click(termsButtons[0]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'סגירה' })[0]);

    const privacyButtons = screen.getAllByRole('button', { name: 'מדיניות פרטיות' });
    fireEvent.click(privacyButtons[0]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'סגירה' })[0]);
  });

  it('selects a coupon gift after adding an eligible catalog add-on', () => {
    reachStep3();
    const quantityInputs = screen.getAllByPlaceholderText('כמות');
    fireEvent.change(quantityInputs[0], { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('קוד קופון'), { target: { value: 'מתנה' } });

    const selects = Array.from(document.querySelectorAll('select'));
    const giftSelect = selects.find((select) =>
      Array.from(select.options).some((option) => option.value === 'entrance-sign')
    );
    expect(giftSelect).toBeDefined();
    fireEvent.change(giftSelect!, { target: { value: 'entrance-sign' } });
    expect(giftSelect).toHaveValue('entrance-sign');
  });
});
