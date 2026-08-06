import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { CheckCircle2, ChevronLeft, ChevronRight, LockKeyhole, ShoppingBag } from 'lucide-react';
import { MINIMUM_ORDER, useCart } from '../cart/CartProvider';
import { useI18n } from '../i18n/i18n';
import { DELIVERY_FEE } from '../lib/pricing';
import { submitCartOrder } from '../lib/submitCartOrder';

const COPY = {
  he: {
    title: 'השלמת הזמנה',
    subtitle: 'ממלאים פרטים, שולחים — וזהו. אין צורך בהרשמה או בפתיחת חשבון.',
    fullName: 'שם המזמין/ה',
    additionalName: 'שם נוסף / בעלי השמחה',
    phone: 'טלפון',
    email: 'אימייל',
    date: 'תאריך האירוע',
    location: 'מקום האירוע',
    notes: 'הערות ובקשות מיוחדות',
    terms: 'אני מאשר/ת את תנאי ההזמנה ומדיניות הביטולים',
    submit: 'שליחת ההזמנה',
    sending: 'ההזמנה נשלחת…',
    summary: 'סיכום ההזמנה',
    subtotal: 'סכום ביניים',
    delivery: 'הובלה, הקמה ופירוק',
    total: 'סה״כ',
    editCart: 'חזרה לעריכת הסל',
    successTitle: 'ההזמנה התקבלה בהצלחה',
    successBody: 'פרטי ההזמנה נשמרו וניצור איתך קשר להמשך תיאום.',
    orderNumber: 'מספר הזמנה',
    home: 'חזרה לעמוד הבית',
    required: 'נא למלא את כל שדות החובה ולאשר את התנאים.',
    phoneError: 'נא להזין מספר טלפון תקין.',
    emailError: 'נא להזין כתובת אימייל תקינה.',
    genericError: 'לא הצלחנו לשלוח את ההזמנה. נסו שוב או פנו אלינו בוואטסאפ.',
    empty: 'העגלה ריקה. יש להוסיף חבילה לפני השלמת ההזמנה.',
    secure: 'הזמנה מאובטחת ללא הרשמה'
  },
  en: {
    title: 'Complete your order',
    subtitle: 'Enter your details and submit. No registration or account creation is required.',
    fullName: 'Customer name',
    additionalName: 'Additional name / event hosts',
    phone: 'Phone',
    email: 'Email',
    date: 'Event date',
    location: 'Event venue',
    notes: 'Notes and special requests',
    terms: 'I approve the order terms and cancellation policy',
    submit: 'Submit order',
    sending: 'Submitting…',
    summary: 'Order summary',
    subtotal: 'Subtotal',
    delivery: 'Delivery, setup and collection',
    total: 'Total',
    editCart: 'Edit cart',
    successTitle: 'Your order was received',
    successBody: 'The order details were saved and we will contact you to coordinate the next steps.',
    orderNumber: 'Order number',
    home: 'Back to homepage',
    required: 'Please complete all required fields and approve the terms.',
    phoneError: 'Please enter a valid phone number.',
    emailError: 'Please enter a valid email address.',
    genericError: 'We could not submit the order. Please try again or contact us on WhatsApp.',
    empty: 'Your cart is empty. Add a package before checking out.',
    secure: 'Secure guest checkout'
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
  return `₪${value.toLocaleString()}`;
}

export function CheckoutPage() {
  const { lang } = useI18n();
  const copy = COPY[lang];
  const Arrow = lang === 'he' ? ChevronLeft : ChevronRight;
  const { items, subtotal, clearCart } = useCart();
  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState('');
  const total = subtotal + DELIVERY_FEE;

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
        subtotal,
        deliveryPrice: DELIVERY_FEE,
        totalPrice: total
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
      <section className="mx-auto max-w-2xl px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" aria-hidden="true" />
        <h2 className="font-display mt-6 text-3xl font-extrabold text-gray-900">{copy.successTitle}</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-gray-600">{copy.successBody}</p>
        <p className="mt-5 rounded-2xl bg-[#FAF7F2] px-4 py-3 font-mono text-xs text-gray-700">
          {copy.orderNumber}: {orderId}
        </p>
        <Link to="/" className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-[#8C6D3F] px-6 py-3 text-sm font-bold text-white hover:bg-[#6d5430]">
          {copy.home}
          <Arrow className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    );
  }

  if (items.length === 0 || subtotal < MINIMUM_ORDER) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-20 text-center">
        <ShoppingBag className="mx-auto h-14 w-14 text-[#B29259]" aria-hidden="true" />
        <h2 className="font-display mt-5 text-2xl font-extrabold text-gray-900">{copy.empty}</h2>
        <Link to="/cart" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#8C6D3F] px-6 py-3 text-sm font-bold text-white">
          {copy.editCart}
          <Arrow className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    );
  }

  return (
    <section className="bg-[#FAF7F2] py-10 sm:py-14">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#EAE3D2] bg-white px-3 py-1.5 text-xs font-bold text-[#8C6D3F]">
            <LockKeyhole className="h-4 w-4" aria-hidden="true" />
            {copy.secure}
          </div>
          <h2 className="font-display mt-4 text-3xl font-extrabold text-gray-900 sm:text-4xl">{copy.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">{copy.subtitle}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <form onSubmit={handleSubmit} noValidate className="rounded-3xl border border-[#EAE3D2] bg-white p-5 sm:p-7">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-bold text-gray-800">
                {copy.fullName} *
                <input value={form.fullName} onChange={(event) => setField('fullName', event.target.value)} autoComplete="name" className="mt-2 w-full rounded-xl border border-[#D8CDBB] px-3 py-2.5 font-normal outline-none focus:border-[#B29259] focus:ring-2 focus:ring-[#B29259]/20" />
              </label>
              <label className="text-sm font-bold text-gray-800">
                {copy.additionalName}
                <input value={form.additionalName} onChange={(event) => setField('additionalName', event.target.value)} className="mt-2 w-full rounded-xl border border-[#D8CDBB] px-3 py-2.5 font-normal outline-none focus:border-[#B29259] focus:ring-2 focus:ring-[#B29259]/20" />
              </label>
              <label className="text-sm font-bold text-gray-800">
                {copy.phone} *
                <input value={form.phone} onChange={(event) => setField('phone', event.target.value)} type="tel" inputMode="tel" autoComplete="tel" className="mt-2 w-full rounded-xl border border-[#D8CDBB] px-3 py-2.5 font-normal outline-none focus:border-[#B29259] focus:ring-2 focus:ring-[#B29259]/20" />
              </label>
              <label className="text-sm font-bold text-gray-800">
                {copy.email} *
                <input value={form.email} onChange={(event) => setField('email', event.target.value)} type="email" autoComplete="email" className="mt-2 w-full rounded-xl border border-[#D8CDBB] px-3 py-2.5 font-normal outline-none focus:border-[#B29259] focus:ring-2 focus:ring-[#B29259]/20" />
              </label>
              <label className="text-sm font-bold text-gray-800">
                {copy.date} *
                <input value={form.eventDate} onChange={(event) => setField('eventDate', event.target.value)} type="date" className="mt-2 w-full rounded-xl border border-[#D8CDBB] px-3 py-2.5 font-normal outline-none focus:border-[#B29259] focus:ring-2 focus:ring-[#B29259]/20" />
              </label>
              <label className="text-sm font-bold text-gray-800">
                {copy.location} *
                <input value={form.eventLocation} onChange={(event) => setField('eventLocation', event.target.value)} className="mt-2 w-full rounded-xl border border-[#D8CDBB] px-3 py-2.5 font-normal outline-none focus:border-[#B29259] focus:ring-2 focus:ring-[#B29259]/20" />
              </label>
            </div>

            <label className="mt-5 block text-sm font-bold text-gray-800">
              {copy.notes}
              <textarea value={form.notes} onChange={(event) => setField('notes', event.target.value)} rows={4} className="mt-2 w-full resize-y rounded-xl border border-[#D8CDBB] px-3 py-2.5 font-normal outline-none focus:border-[#B29259] focus:ring-2 focus:ring-[#B29259]/20" />
            </label>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl bg-[#FAF7F2] p-4 text-sm text-gray-700">
              <input type="checkbox" checked={termsAccepted} onChange={(event) => { setTermsAccepted(event.target.checked); setError(''); }} className="mt-0.5 h-4 w-4 accent-[#8C6D3F]" />
              <span>{copy.terms} *</span>
            </label>

            {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}

            <button type="submit" disabled={submitting} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#8C6D3F] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#6d5430] disabled:cursor-wait disabled:opacity-60">
              {submitting ? copy.sending : copy.submit}
              {!submitting && <Arrow className="h-4 w-4" aria-hidden="true" />}
            </button>
          </form>

          <aside className="h-fit rounded-3xl border border-[#EAE3D2] bg-white p-6 shadow-warm lg:sticky lg:top-24">
            <h3 className="font-display text-xl font-extrabold text-gray-900">{copy.summary}</h3>
            <p className="mt-3 text-xs leading-relaxed text-gray-600">{itemSummary}</p>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-gray-600">{copy.subtotal}</dt><dd className="font-bold">{money(subtotal)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-gray-600">{copy.delivery}</dt><dd className="font-bold">{money(DELIVERY_FEE)}</dd></div>
              <div className="flex justify-between gap-3 border-t border-[#EAE3D2] pt-4 text-base"><dt className="font-extrabold">{copy.total}</dt><dd className="font-black text-[#8C6D3F]">{money(total)}</dd></div>
            </dl>
            <Link to="/cart" className="mt-5 flex items-center justify-center text-xs font-bold text-[#8C6D3F] hover:underline">{copy.editCart}</Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
