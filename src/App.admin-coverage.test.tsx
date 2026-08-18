import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { I18nProvider } from './i18n/i18n';

const env = vi.hoisted(() => ({
  submit: vi.fn(async () => ({ id: 'admin-coverage-order' })),
  signOut: vi.fn()
}));

vi.mock('./lib/supabase', () => ({ isSupabaseConfigured: true, supabase: {} }));
vi.mock('./lib/submitOrder', () => ({ submitOrder: env.submit }));
vi.mock('./auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'admin-coverage-user', email: 'admin@example.com' }, signOut: env.signOut })
}));
vi.mock('./components/AuthModal', () => ({ AuthModal: () => null }));
vi.mock('./components/AccessibilityWidget', () => ({ AccessibilityWidget: () => null }));

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
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,admin-coverage');
});

const renderApp = () => render(
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
  fireEvent.change(screen.getByLabelText(/אימייל/), { target: { value: 'admin@example.com' } });
}

function reachAdminStep3() {
  renderApp();
  fireEvent.click(screen.getByRole('button', { name: /בעל העסק \/ מנהל/ }));
  fillStep1();
  fireEvent.click(screen.getByRole('button', { name: /המשך לבחירת חבילת עיצוב/ }));
  fireEvent.click(screen.getByText('חבילת עיצוב חתונה - Classic S'));
  fireEvent.click(screen.getByRole('button', { name: /המשך לתוספות וחתימה/ }));
}

function completeRequiredStep3() {
  fireEvent.click(screen.getByText(/הובלה, הרכבה ופירוק מלא/));
  fireEvent.click(screen.getByRole('checkbox'));
  document.querySelectorAll('canvas').forEach((canvas) => {
    fireEvent.mouseDown(canvas, { clientX: 5, clientY: 5 });
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
    fireEvent.mouseUp(canvas);
  });
}

beforeEach(() => {
  env.submit.mockReset().mockResolvedValue({ id: 'admin-coverage-order' });
  env.signOut.mockReset();
  (window.print as ReturnType<typeof vi.fn>).mockClear();
  window.localStorage.clear();
});

describe('App admin coverage', () => {
  it('submits admin-only order metadata through the persisted order payload', async () => {
    reachAdminStep3();
    fireEvent.change(screen.getByLabelText('מקור ההזמנה'), { target: { value: 'whatsapp' } });
    fireEvent.change(screen.getByLabelText('מי קיבל את ההזמנה'), { target: { value: 'employee' } });
    fireEvent.change(screen.getByLabelText('סטטוס הזמנה'), { target: { value: 'approved' } });
    fireEvent.change(screen.getByLabelText('הערות פנימיות (לא ללקוח)'), { target: { value: '  הערת כיסוי  ' } });
    completeRequiredStep3();

    fireEvent.click(screen.getByRole('button', { name: /אישור והדפסת ההזמנה/ }));
    await screen.findByText(/ההזמנה נשלחה בהצלחה/);

    expect(env.submit).toHaveBeenCalledTimes(1);
    expect(env.submit.mock.calls[0][0]).toMatchObject({
      status: 'approved',
      orderSource: 'whatsapp',
      receivedBy: 'employee',
      internalNotes: 'הערת כיסוי'
    });
  });

  it('removes the package from the admin editable-line action', () => {
    reachAdminStep3();
    fireEvent.click(screen.getByRole('button', { name: 'הסרת שורה' }));
    expect(screen.getByText('בחרו חבילה או תוספת כדי לערוך את שורות ההזמנה.')).toBeInTheDocument();
  });
});
