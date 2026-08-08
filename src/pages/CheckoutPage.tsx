import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { CheckCircle2, ChevronLeft, ChevronRight, FileText, ShoppingBag, Sparkles } from 'lucide-react';
import { MINIMUM_ORDER, useCart } from '../cart/CartProvider';
import { QuoteNotice } from '../components/QuoteNotice';
import { useI18n } from '../i18n/i18n';
import { submitCartOrder } from '../lib/submitCartOrder';

const POLICY = [
  'במקרה של ביטול עקב כוח עליון — מלחמה או מגפה — הסכום ששולם יועבר לזיכוי לתאריך חלופי על בסיס זמינות. אם לא יימצא תאריך מוסכם, לא יוחזרו 50% מסכום העסקה הכולל.',
  'במקרה של כל ביטול אחר, לא יוחזר ללקוח כל תשלום והלקוח יחויב במלוא תשלום העסקה.',
  'אם לא יימצא תאריך חלופי, הלקוח/ה יוכל/תוכל להגיע לקחת את הציוד שהוזמן לאירוע בתשלום מלא של העסקה, ללא הובלה והרכבה ובכפוף להשארת פיקדון עד להחזרת הציוד.',
  'ניתן לעדכן תוספות קלות בכמויות ההזמנה עד 30 ימי עסקים לפני מועד האירוע.',
  'האחריות על הציוד בזמן האירוע חלה על הלקוח/ה.',
  'יתרת התשלום תועבר בהעברה בנקאית כאישור, כשבוע לפני מועד האירוע.'
];

const COPY = {
  he: {
    title: 'שליחת בקשה להצעת מחיר',
    subtitle: 'ממלאים את פרטי האירוע ושולחים. אין חיוב, סליקה או התחייבות בשלב הזה.',
    fullName: 'שם מלא',
    additionalName: 'שם נוסף / בעלי השמחה',
    phone: 'טלפון',
    email: 'אימייל',
    date: 'תאריך האירוע',
    location: 'מיקום האירוע',
    notes: 'הערות ובקשות נוספות',
    terms: 'אני מאשר/ת כי קראתי את תנאי ההתקשרות ומדיניות הביטולים והשינויים',
    submit: 'שליחת הצעת מחיר בלבד (ללא תשלום)',
    sending: 'הבקשה נשלחת…',
    summary: 'סיכום הבקשה',
    subtotal: 'אומדן נוכחי',
    total: 'סה״כ אומדן',
    editCart: 'חזרה לעריכת הסל',
    successTitle: 'בקשת הצעת המחיר התקבלה',
    successBody: 'הפרטים נשמרו ונשלח אליכם סיכום במייל. ניצור איתכם קשר לשיחת התאמה אישית.',
    orderNumber: 'מספר פנייה',
    home: 'חזרה לעמוד הבית',
    required: 'נא למלא את כל שדות החובה ולאשר את התנאים.',
    phoneError: 'נא להזין מספר טלפון תקין.',
    emailError: 'נא להזין כתובת אימייל תקינה.',
    genericError: 'לא הצלחנו לשלוח את הבקשה. נסו שוב או פנו אלינו בוואטסאפ.',
    empty: 'העגלה ריקה או שטרם הגעתם למינימום ההזמנה. יש לעדכן את הסל לפני השליחה.',
    policyTitle: 'מדיניות ביטולים, שינויים ואחריות',
    flowerColor: 'גוון לפרחים',
    balloonColor: 'גוון לבלונים',
    tableclothColor: 'גוון למפות וטקסטיל',
    notSelected: 'טרם נבחר',
    request: 'בקשה אישית',
    coupon: 'קופון'
  },
  en: {
    title: 'Request a personal quote',
    subtitle: 'Enter your event details and submit. No charge, payment or commitment is made at this stage.',
    fullName: 'Full name',
    additionalName: 'Additional name / event hosts',
    phone: 'Phone',
    email: 'Email',
    date: 'Event date',
    location: 'Event venue',
    notes: 'Additional notes and requests',
    terms: 'I confirm that I have read the engagement, cancellation and change policy',
    submit: 'Send quote request only (no payment)',
    sending: 'Submitting…',
    summary: 'Request summary',
    subtotal: 'Current estimate',
    total: 'Estimated total',
    editCart: 'Edit cart',
    successTitle: 'Your quote request was received',
    successBody: 'The details were saved and a summary will be emailed to you. We will contact you for a personal consultation.',
    orderNumber: 'Request number',
    home: 'Back to homepage',
    required: 'Please complete all required fields and approve the terms.',
    phoneError: 'Please enter a valid phone number.',
    emailError: 'Please enter a valid email address.',
    genericError: 'We could not submit the request. Please try again or contact us on WhatsApp.',
    empty: 'The cart is empty or below the minimum. Please update it before submitting.',
    policyTitle: 'Cancellation, changes and responsibility policy',
    flowerColor: 'Flower shade',
    balloonColor: 'Balloon shade',
    tableclothColor: 'Table linen shade',
    notSelected: 'Not selected',
    request: 'Custom request',
    coupon: 'Coupon'
  }
} as const;

interface CheckoutForm {
  fullName: string;
  additionalName: string;
  phone: string;
  email: string;
  eventDate: string;
  eventLocation: string;
  notes: string;
}

const EMPTY_FORM: CheckoutForm = {
  fullName: '',
  additionalName: '',
  phone: '',
  email: '',
  eventDate: '',
  eventLocation: '',
  notes: ''
};

function money(value: number) {
  return `₪${value.toLocaleString('he-IL')}`;
}

export function CheckoutPage() {
  const { lang } = useI18n();
  const copy = COPY[lang];
  const Arrow = lang === 'he' ? ChevronLeft : ChevronRight;
  const { items, subtotal, preferences, clearCart } = useCart();
  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState('');

  const itemSummary = useMemo(
    () => items.map((item) => `${item.title}${item.quantity > 1 ? ` × ${item.quantity}` : ''}`).join(', '),
    [items]
  );

  const setField = (field: keyof CheckoutForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const validate = () => {
    if (!form.fullName.trim() || !form.phone.trim() || !form.email.trim() || !form.eventDate || !form.eventLocation.trim() || !termsAccepted) {
      return copy.required;
    }
    const normalizedPhone = form.phone.replace(/[\s()-]/g, '');
    if (!/^\+?\d{9,15}$/.test(normalizedPhone)) return copy.phoneError;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return copy.emailError;
    return '';
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const result = await submitCartOrder({
        customer: form,
        items: items.map((item) => ({ id: item.id, title: item.title, price: item.price, quantity: item.quantity })),
        preferences,
        subtotal,
        deliveryPrice: 0,
        totalPrice: subtotal
      });
      setOrderId(result.id);
      clearCart();
    } catch {
      setError(copy.genericError);
    } finally {
      setSubmitting(false);
    }
  };

  if (orderId) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-24 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-[#B8860B]" aria-hidden="true" />
        <h2 className="font-display mt-6 text-4xl font-black text-[#2C2C2C]">{copy.successTitle}</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#6C625A]">{copy.successBody}</p>
        <p className="mt-5 rounded-2xl bg-[#FAF6F0] px-4 py-3 font-mono text-xs text-[#5E5752]">
          {copy.orderNumber}: {orderId}
        </p>
        <Link to="/" className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#B8860B] to-[#D4AF37] px-7 py-3.5 text-sm font-extrabold text-white shadow-lg">
          {copy.home}
          <Arrow className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    );
  }

  if (items.length === 0 || subtotal < MINIMUM_ORDER) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-24 text-center">
        <ShoppingBag className="mx-auto h-14 w-14 text-[#B8860B]" aria-hidden="true" />
        <h2 className="font-display mt-5 text-2xl font-black text-[#2C2C2C]">{copy.empty}</h2>
        <Link to="/cart" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#2C2C2C] px-7 py-3.5 text-sm font-bold text-white">
          {copy.editCart}
          <Arrow className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    );
  }

  const inputClass = 'mt-2 w-full rounded-2xl border border-[#E8C5B8] bg-[#FDFBF7] px-4 py-3 font-normal outline-none transition focus:border-[#B8860B] focus:ring-4 focus:ring-[#E8C5B8]/30';

  return (
    <section className="bg-[#FAF6F0] py-10 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-[#B8860B]"><FileText className="h-4 w-4" aria-hidden="true" /> Quote request</p>
          <h2 className="font-display mt-3 text-4xl font-black text-[#2C2C2C] sm:text-5xl">{copy.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6C625A]">{copy.subtitle}</p>
        </div>

        <QuoteNotice />

        <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_380px]">
          <form onSubmit={handleSubmit} noValidate className="rounded-[2rem] border border-[#E8C5B8]/70 bg-white p-5 shadow-sm sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-extrabold text-[#2C2C2C]">
                {copy.fullName} *
                <input value={form.fullName} onChange={(event) => setField('fullName', event.target.value)} autoComplete="name" className={inputClass} />
              </label>
              <label className="text-sm font-extrabold text-[#2C2C2C]">
                {copy.additionalName}
                <input value={form.additionalName} onChange={(event) => setField('additionalName', event.target.value)} className={inputClass} />
              </label>
              <label className="text-sm font-extrabold text-[#2C2C2C]">
                {copy.phone} *
                <input value={form.phone} onChange={(event) => setField('phone', event.target.value)} type="tel" inputMode="tel" autoComplete="tel" className={inputClass} />
              </label>
              <label className="text-sm font-extrabold text-[#2C2C2C]">
                {copy.email} *
                <input value={form.email} onChange={(event) => setField('email', event.target.value)} type="email" autoComplete="email" className={inputClass} />
              </label>
              <label className="text-sm font-extrabold text-[#2C2C2C]">
                {copy.date} *
                <input value={form.eventDate} onChange={(event) => setField('eventDate', event.target.value)} type="date" className={inputClass} />
              </label>
              <label className="text-sm font-extrabold text-[#2C2C2C]">
                {copy.location} *
                <input value={form.eventLocation} onChange={(event) => setField('eventLocation', event.target.value)} className={inputClass} />
              </label>
            </div>

            <label className="mt-5 block text-sm font-extrabold text-[#2C2C2C]">
              {copy.notes}
              <textarea value={form.notes} onChange={(event) => setField('notes', event.target.value)} rows={4} className={`${inputClass} resize-y`} />
            </label>

            <details className="mt-6 rounded-[1.5rem] border border-[#E8C5B8]/70 bg-[#FAF6F0] p-5">
              <summary className="cursor-pointer font-display text-lg font-black text-[#2C2C2C]">{copy.policyTitle}</summary>
              <ol className="mt-4 space-y-3 text-xs leading-relaxed text-[#5E5752]">
                {POLICY.map((paragraph, index) => <li key={paragraph}><strong className="text-[#B8860B]">{index + 1}.</strong> {paragraph}</li>)}
              </ol>
            </details>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-[1.5rem] border border-[#E8C5B8]/70 bg-white p-4 text-sm text-[#4D4743] shadow-sm">
              <input type="checkbox" checked={termsAccepted} onChange={(event) => { setTermsAccepted(event.target.checked); setError(''); }} className="mt-0.5 h-5 w-5 accent-[#B8860B]" />
              <span>{copy.terms} *</span>
            </label>

            {error && <p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}

            <button type="submit" disabled={submitting} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#C69A71] px-5 py-4 text-sm font-extrabold text-white shadow-[0_18px_40px_rgba(184,134,11,0.25)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">
              {submitting ? copy.sending : copy.submit}
              {!submitting && <Arrow className="h-4 w-4" aria-hidden="true" />}
            </button>

            <div className="mt-4"><QuoteNotice compact /></div>
          </form>

          <aside className="h-fit rounded-[2rem] border border-[#E8C5B8]/70 bg-white p-6 shadow-[0_24px_65px_rgba(44,44,44,0.1)] lg:sticky lg:top-24">
            <h3 className="font-display text-2xl font-black text-[#2C2C2C]">{copy.summary}</h3>
            <p className="mt-3 text-xs leading-relaxed text-[#6C625A]">{itemSummary}</p>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="rounded-2xl bg-[#FAF6F0] p-4"><dt className="font-extrabold text-[#2C2C2C]">{copy.flowerColor}</dt><dd className="mt-1 text-[#6C625A]">{preferences.flowerColor || copy.notSelected}</dd></div>
              <div className="rounded-2xl bg-[#FAF6F0] p-4"><dt className="font-extrabold text-[#2C2C2C]">{copy.balloonColor}</dt><dd className="mt-1 text-[#6C625A]">{preferences.balloonColor || copy.notSelected}</dd></div>
              <div className="rounded-2xl bg-[#FAF6F0] p-4"><dt className="font-extrabold text-[#2C2C2C]">{copy.tableclothColor}</dt><dd className="mt-1 text-[#6C625A]">{preferences.tableclothColor || copy.notSelected}</dd></div>
              {preferences.customRequest && <div className="rounded-2xl bg-[#FAF6F0] p-4"><dt className="font-extrabold text-[#2C2C2C]">{copy.request}</dt><dd className="mt-1 whitespace-pre-wrap text-[#6C625A]">{preferences.customRequest}</dd></div>}
              {preferences.couponApplied && <div className="rounded-2xl bg-emerald-50 p-4"><dt className="font-extrabold text-emerald-800">{copy.coupon}</dt><dd className="mt-1 flex items-center gap-1.5 text-emerald-800"><Sparkles className="h-4 w-4" aria-hidden="true" />{preferences.couponCode}</dd></div>}
              <div className="flex items-center justify-between gap-3 border-t border-[#E8C5B8]/60 pt-5"><dt className="font-extrabold text-[#2C2C2C]">{copy.total}</dt><dd className="font-display text-2xl font-black text-[#B8860B]">{money(subtotal)}</dd></div>
            </dl>
            <Link to="/cart" className="mt-5 flex items-center justify-center text-xs font-bold text-[#B8860B] hover:underline">{copy.editCart}</Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
