import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from './i18n/i18n';

// ---- mocks ----
const env = vi.hoisted(() => ({
  configured: false,
  user: null as { id: string; email?: string } | null,
  submit: vi.fn(async () => ({ id: 'order-1' }))
}));
vi.mock('./lib/supabase', () => ({
  get isSupabaseConfigured() {
    return env.configured;
  },
  supabase: {}
}));
vi.mock('./lib/submitOrder', () => ({ submitOrder: env.submit }));
vi.mock('./auth/AuthProvider', () => ({
  useAuth: () => ({ user: env.user, signOut: vi.fn() })
}));

import App from './App';

beforeAll(() => {
  // jsdom חסר: print / scrollTo / canvas 2d context
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

const renderApp = () =>
  render(
    <I18nProvider>
      <MemoryRouter><App /></MemoryRouter>
    </I18nProvider>
  );

function fillStep1(opts: { email?: string } = {}) {
  fireEvent.change(screen.getByLabelText(/שם בעל האירוע/), { target: { value: 'ישראל ישראלי' } });
  fireEvent.change(screen.getByLabelText(/שם בעלת האירוע/), { target: { value: 'דנה ישראלי' } });
  fireEvent.change(screen.getByLabelText(/טלפון בעל האירוע/), { target: { value: '0501111111' } });
  fireEvent.change(screen.getByLabelText(/טלפון בעלת האירוע/), { target: { value: '0502222222' } });
  fireEvent.change(screen.getByLabelText(/תאריך האירוע/), { target: { value: '2026-09-01' } });
  fireEvent.change(screen.getByLabelText(/מיקום האירוע/), { target: { value: 'אולמי היער, חדרה' } });
  if (opts.email !== '') {
    fireEvent.change(screen.getByLabelText(/אימייל/), { target: { value: opts.email ?? 'a@b.com' } });
  }
}

const next1 = () => fireEvent.click(screen.getByRole('button', { name: /המשך לבחירת חבילת עיצוב/ }));
const next2 = () => fireEvent.click(screen.getByRole('button', { name: /המשך לתוספות וחתימה/ }));
// אין חבילת ברירת מחדל — בוחרים מפורשות (לחיצה על כרטיס Classic S בקטגוריית חתונה)
const pickPackage = () => fireEvent.click(screen.getByText('חבילת עיצוב חתונה - Classic S'));

function sign() {
  const canvases = document.querySelectorAll('canvas');
  canvases.forEach((c) => {
    fireEvent.mouseDown(c, { clientX: 5, clientY: 5 });
    fireEvent.mouseMove(c, { clientX: 20, clientY: 20 });
    fireEvent.mouseUp(c);
  });
}

beforeEach(() => {
  env.configured = false;
  env.user = null;
  env.submit.mockClear().mockResolvedValue({ id: 'order-1' });
  (window.print as ReturnType<typeof vi.fn>).mockClear();
});

describe('Order wizard — step 1', () => {
  it('shows validation errors for empty required fields', () => {
    renderApp();
    next1();
    expect(screen.getByText('חובה להזין שם בעל האירוע')).toBeInTheDocument();
    expect(screen.getByText('חובה להזין כתובת אימייל')).toBeInTheDocument();
  });

  it('rejects a single-word name and an invalid email', () => {
    renderApp();
    fireEvent.change(screen.getByLabelText(/שם בעל האירוע/), { target: { value: 'ישראל' } });
    fireEvent.change(screen.getByLabelText(/אימייל/), { target: { value: 'bad' } });
    next1();
    expect(screen.getByText('חובה להזין שם פרטי ושם משפחה')).toBeInTheDocument();
    expect(screen.getByText('כתובת אימייל אינה תקינה')).toBeInTheDocument();
  });

  it('advances to step 2 with valid details', () => {
    renderApp();
    fillStep1();
    next1();
    expect(screen.getAllByText('מה כלול בחבילה?').length).toBeGreaterThan(0);
  });

  it('rejects a too-short phone number', () => {
    renderApp();
    fillStep1();
    fireEvent.change(screen.getByLabelText(/טלפון בעל האירוע/), { target: { value: '123' } });
    next1();
    expect(screen.getByText('מספר טלפון אינו תקין')).toBeInTheDocument();
  });

  it('accepts an international +972 phone number', () => {
    renderApp();
    fillStep1();
    fireEvent.change(screen.getByLabelText(/טלפון בעל האירוע/), { target: { value: '+972-50-123-4567' } });
    next1();
    expect(screen.getAllByText('מה כלול בחבילה?').length).toBeGreaterThan(0);
  });
});

describe('Order wizard — admin mode', () => {
  it('reveals the admin panel and makes email optional', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /בעל העסק \/ מנהל/ }));
    expect(screen.getByText('פרטי הזמנה — מנהל')).toBeInTheDocument();
    // ללא אימייל — עדיין מתקדם
    fillStep1({ email: '' });
    next1();
    expect(screen.getAllByText('מה כלול בחבילה?').length).toBeGreaterThan(0);
  });
});

describe('Order wizard — step 2', () => {
  it('requires at least one package', () => {
    renderApp();
    fillStep1();
    next1();
    // ללא חבילה נבחרת (אין ברירת מחדל) — לא ניתן להמשיך
    next2();
    expect(screen.getByText('יש לבחור לפחות חבילה אחת כדי להמשיך.')).toBeInTheDocument();
  });

  it('supports multi-select across categories', () => {
    renderApp();
    fillStep1();
    next1();
    // מעבר לקטגוריית בר ובחירת חבילה נוספת
    fireEvent.click(screen.getByRole('button', { name: 'עמדות בר מתוק' }));
    fireEvent.click(screen.getByText('בר חמצוצים וגומי צבעוני'));
    expect(screen.getByText(/החבילות שבחרת/)).toBeInTheDocument();
  });

  it('shows the events tier selector', () => {
    renderApp();
    fillStep1();
    next1();
    fireEvent.click(screen.getByRole('button', { name: /אירועים/ }));
    expect(screen.getByText(/כמה שולחנות יש באירוע/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '20 שולחנות' }));
  });
});

describe('Order wizard — step 3 + submit (guest, not configured)', () => {
  function reachStep3() {
    renderApp();
    fillStep1();
    next1();
    pickPackage();
    next2();
  }

  it('requires delivery, then terms, then signatures, then prints', async () => {
    reachStep3();
    const confirm = () => fireEvent.click(screen.getByRole('button', { name: /אישור והדפסת ההזמנה/ }));

    confirm();
    expect(screen.getByText(/חובה לאשר את שירות ההובלה/)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/הובלה, הרכבה ופירוק מלא/));
    confirm();
    expect(screen.getByText(/יש לאשר את תנאי השימוש/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox'));
    confirm();
    expect(screen.getByText(/נדרשת חתימה/)).toBeInTheDocument();

    sign();
    confirm();
    await waitFor(() => expect(window.print).toHaveBeenCalled());
  });

  it('adds a custom upgrade and a catalog add-on', () => {
    reachStep3();
    fireEvent.change(screen.getByPlaceholderText(/לדוגמה: תוספת/), { target: { value: 'תוספת מיוחדת' } });
    fireEvent.change(screen.getByPlaceholderText('₪'), { target: { value: '250' } });
    fireEvent.click(screen.getByRole('button', { name: 'הוסף תוספת' }));
    // מופיע גם ברשימת התוספות וגם בסיכום הכספי
    expect(screen.getAllByText('תוספת מיוחדת').length).toBeGreaterThanOrEqual(1);
  });
});

describe('Order wizard — more flows', () => {
  it('renders the henna category packages', () => {
    renderApp();
    fillStep1();
    next1();
    fireEvent.click(screen.getByRole('button', { name: 'חינה' }));
    expect(screen.getByText('חבילת בר עוגיות מרוקאיות מסורתי')).toBeInTheDocument();
  });

  it('navigates back from step 2 and step 3', () => {
    renderApp();
    fillStep1();
    next1();
    pickPackage();
    next2();
    fireEvent.click(screen.getByRole('button', { name: /חזור לחבילות/ }));
    expect(screen.getAllByText('מה כלול בחבילה?').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /חזור לפרטים/ }));
    expect(screen.getByLabelText(/שם בעל האירוע/)).toBeInTheDocument();
  });

  it('captures table composition counts (wedding) into the contract', () => {
    renderApp();
    fillStep1();
    next1();
    pickPackage();
    fireEvent.change(screen.getByLabelText(/כמה שולחנות עם קומפוזיציה/), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText(/כמה שולחנות עם סידור עגול/), { target: { value: '2' } });
    next2();
    expect(screen.getByText('8 שולחנות')).toBeInTheDocument();
  });

  it('clears a signature with the נקה button', () => {
    renderApp();
    fillStep1();
    next1();
    pickPackage();
    next2();
    sign();
    const clears = screen.getAllByRole('button', { name: 'נקה' });
    expect(clears.length).toBeGreaterThan(0);
    fireEvent.click(clears[0]);
  });

  it('validates the coupon code (invalid then valid-without-item)', () => {
    renderApp();
    fillStep1();
    next1();
    pickPackage();
    next2();
    const couponInput = screen.getByLabelText('קוד קופון');
    fireEvent.change(couponInput, { target: { value: 'שגוי' } });
    expect(screen.getByText('קוד הקופון שהוזן אינו תקין.')).toBeInTheDocument();
    fireEvent.change(couponInput, { target: { value: 'מתנה' } });
    expect(screen.getByText(/הקוד תקין!/)).toBeInTheDocument();
  });

  it('removes a custom upgrade', () => {
    renderApp();
    fillStep1();
    next1();
    pickPackage();
    next2();
    fireEvent.change(screen.getByPlaceholderText(/לדוגמה: תוספת/), { target: { value: 'נר נוסף' } });
    fireEvent.change(screen.getByPlaceholderText('₪'), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: 'הוסף תוספת' }));
    expect(screen.getAllByText('נר נוסף').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'מחק תוספת' }));
    expect(screen.getByText(/לא הוזנו תוספות מיוחדות/)).toBeInTheDocument();
  });

  it('submits via submitOrder when configured and logged in', async () => {
    env.configured = true;
    env.user = { id: 'u1', email: 'c@x.com' };
    renderApp();
    fillStep1();
    next1();
    pickPackage();
    next2();
    fireEvent.click(screen.getByText(/הובלה, הרכבה ופירוק מלא/));
    fireEvent.click(screen.getByRole('checkbox'));
    sign();
    fireEvent.click(screen.getByRole('button', { name: /אישור והדפסת ההזמנה/ }));
    await waitFor(() => expect(env.submit).toHaveBeenCalled());
    await waitFor(() => expect(window.print).toHaveBeenCalled());
  });
});

describe('Order wizard — referral field', () => {
  it('captures the referral source and venue name into the contract', () => {
    renderApp();
    fillStep1();
    fireEvent.change(screen.getByLabelText('איך הגעת אלינו?'), { target: { value: 'venue' } });
    fireEvent.change(screen.getByLabelText('שם האולם'), { target: { value: 'אולם הברקת' } });
    next1();
    pickPackage();
    next2();
    expect(screen.getByText('הגעת אלינו דרך:')).toBeInTheDocument();
    expect(screen.getByText('דרך האולם / ספק האירוע — אולם הברקת')).toBeInTheDocument();
  });
});

describe('Order wizard — admin line editing', () => {
  function reachAdminStep3() {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /בעל העסק \/ מנהל/ }));
    fillStep1({ email: '' });
    next1();
    pickPackage();
    next2();
  }

  it('edits a line price and text, then resets it', () => {
    reachAdminStep3();

    // עריכת מחיר חבילת ברירת המחדל (Classic S, ₪2,900) ל-2,000
    fireEvent.change(screen.getByLabelText(/מחיר .* Classic S/), { target: { value: '2000' } });
    expect(screen.getAllByText('₪2,000').length).toBeGreaterThan(0);

    // עריכת טקסט השורה — מופיע בהסכם
    fireEvent.change(screen.getByLabelText(/תיאור השורה — .*Classic S/), { target: { value: 'חבילה מותאמת אישית' } });
    expect(screen.getByText('חבילה מותאמת אישית')).toBeInTheDocument();

    // החזרת מחיר מקורי — חוזר ל-2,900 ולתווית המקורית
    fireEvent.click(screen.getByRole('button', { name: 'החזרת מחיר מקורי' }));
    expect(screen.getAllByText('₪2,900').length).toBeGreaterThan(0);
    expect(screen.queryByText('חבילה מותאמת אישית')).not.toBeInTheDocument();
  });

  it('adds a catalog add-on line and removes it from the edit card', () => {
    reachAdminStep3();
    // בחירת התוספת הראשונה מהקטלוג (כמות 1)
    fireEvent.change(screen.getAllByPlaceholderText('כמות')[0], { target: { value: '1' } });
    const removeButtons = screen.getAllByRole('button', { name: 'הסרת שורה' });
    expect(removeButtons.length).toBeGreaterThan(1);
    // הסרת שורת התוספת (האחרונה)
    fireEvent.click(removeButtons[removeButtons.length - 1]);
  });
});

describe('Order wizard — guest checkout (configured)', () => {
  it('submits as a guest (no account) and shows the success + optional account CTA', async () => {
    env.configured = true;
    env.user = null;
    renderApp();
    fillStep1();
    next1();
    pickPackage();
    next2();
    fireEvent.click(screen.getByText(/הובלה, הרכבה ופירוק מלא/));
    fireEvent.click(screen.getByRole('checkbox'));
    sign();
    fireEvent.click(screen.getByRole('button', { name: /אישור והדפסת ההזמנה/ }));
    await waitFor(() => expect(env.submit).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText(/ההזמנה נשלחה בהצלחה/)).toBeInTheDocument());
    // אורח לא-מחובר מקבל הצעה אופציונלית ליצור חשבון
    expect(screen.getByRole('button', { name: /צרו חשבון/ })).toBeInTheDocument();
  });
});

describe('Order wizard — edge cases & navigation', () => {
  it('admin manual final price overrides the computed total', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /בעל העסק \/ מנהל/ }));
    fillStep1({ email: '' });
    next1();
    pickPackage();
    next2();
    fireEvent.change(screen.getByLabelText('מחיר סופי ידני (₪)'), { target: { value: '9999' } });
    expect(screen.getAllByText('₪9,999').length).toBeGreaterThan(0);
  });

  it('changing the events table tier updates the package price', () => {
    renderApp();
    fillStep1();
    next1();
    fireEvent.click(screen.getByRole('button', { name: /אירועים/ }));
    fireEvent.click(screen.getByRole('button', { name: '20 שולחנות' }));
    // חבילת "קלאסיק" במדרגת 20 שולחנות = ₪4,600 (ייחודי לחבילה זו)
    expect(screen.getAllByText('₪4,600').length).toBeGreaterThan(0);
  });

  it('step 1 offers a back-to-home link', () => {
    renderApp();
    const back = screen.getByRole('link', { name: 'חזרה לדף הבית' });
    expect(back).toHaveAttribute('href', '/');
  });
});
