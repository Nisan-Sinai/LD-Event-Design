import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  ShoppingBag,
  Sparkles,
  Truck,
  Users
} from 'lucide-react';
import { MINIMUM_ORDER, useCart, type CartItem } from '../cart/CartProvider';
import { QuoteNotice } from '../components/QuoteNotice';
import { SignaturePad } from '../components/SignaturePad';
import { categoryLabel, PACKAGE_EN } from '../i18n/content';
import { useI18n, type Lang } from '../i18n/i18n';
import { localizedProductCategory, localizedProductText } from '../i18n/products';
import { brandLogoUrl } from '../lib/branding';
import { EMPTY_SIGNATURE, hasSignature, type DigitalSignature } from '../lib/signatures';
import { submitCartOrder } from '../lib/submitCartOrder';
import { usePackages } from '../packages/PackagesProvider';

const DELIVERY_PRICE = 500;

const POLICY = {
  he: [
    'במקרה של ביטול עקב כוח עליון — מלחמה או מגפה — הסכום ששולם יועבר לזיכוי לתאריך חלופי על בסיס זמינות. אם לא יימצא תאריך מוסכם, לא יוחזרו 50% מסכום העסקה הכולל.',
    'במקרה של כל ביטול אחר, לא יוחזר ללקוח כל תשלום והלקוח יחויב במלוא תשלום העסקה.',
    'אם לא יימצא תאריך חלופי, הלקוח/ה יוכל/תוכל להגיע לקחת את הציוד שהוזמן לאירוע בתשלום מלא של העסקה, ללא הובלה והרכבה ובכפוף להשארת פיקדון עד להחזרת הציוד.',
    'ניתן לעדכן תוספות קלות בכמויות ההזמנה עד 30 ימי עסקים לפני מועד האירוע.',
    'האחריות על הציוד בזמן האירוע חלה על הלקוח/ה.',
    'יתרת התשלום תועבר בהעברה בנקאית כאישור, כשבוע לפני מועד האירוע.'
  ],
  en: [
    'In the event of cancellation due to force majeure — war or pandemic — the amount paid will be transferred as credit toward an alternative date subject to availability. If no mutually agreed date is found, 50% of the total transaction amount will not be refunded.',
    'For any other cancellation, no payment will be refunded and the client will be charged the full transaction amount.',
    'If no alternative date is found, the client may collect the equipment ordered for the event after full payment, without delivery or setup, subject to leaving a deposit until the equipment is returned.',
    'Minor quantity changes to add-ons may be made up to 30 business days before the event date.',
    'The client is responsible for the equipment during the event.',
    'The remaining balance will be paid by bank transfer as confirmation, approximately one week before the event.'
  ]
} as const;

const EVENT_TYPES = {
  he: [
    { value: 'wedding', label: 'חתונה' },
    { value: 'engagement', label: 'אירוסין' },
    { value: 'henna', label: 'חינה' },
    { value: 'bar-bat-mitzvah', label: 'בר / בת מצווה' },
    { value: 'brit', label: 'ברית / בריתה' },
    { value: 'birthday', label: 'יום הולדת' },
    { value: 'other', label: 'אירוע אחר' }
  ],
  en: [
    { value: 'wedding', label: 'Wedding' },
    { value: 'engagement', label: 'Engagement' },
    { value: 'henna', label: 'Henna' },
    { value: 'bar-bat-mitzvah', label: 'Bar / Bat Mitzvah' },
    { value: 'brit', label: 'Brit / baby celebration' },
    { value: 'birthday', label: 'Birthday' },
    { value: 'other', label: 'Other event' }
  ]
} as const;

const COPY = {
  he: {
    kicker: 'בחירת הזמנה',
    title: 'שליחת בחירת ההזמנה',
    subtitle: 'בוחרים, חותמים ושולחים. לא משלמים כרגע — נחזור אליכם להשלמת ההזמנה.',
    eventType: 'סוג האירוע',
    eventTypePlaceholder: 'בחרו סוג אירוע',
    fullName: 'שם המזמין/ה',
    additionalName: 'שם המזמין/ה הנוסף/ת',
    phone: 'מספר טלפון',
    additionalPhone: 'מספר טלפון נוסף',
    email: 'אימייל',
    date: 'תאריך האירוע',
    location: 'מיקום האירוע',
    notes: 'הערות ובקשות נוספות',
    terms: 'אני מאשר/ת כי קראתי את תנאי ההתקשרות ומדיניות הביטולים והשינויים',
    submit: 'שליחת ההזמנה (ללא תשלום כרגע)',
    sending: 'ההזמנה נשלחת…',
    summary: 'סיכום בחירת ההזמנה',
    total: 'סה״כ בחירה',
    editCart: 'חזרה לעריכת הסל',
    successTitle: 'בחירת ההזמנה התקבלה',
    successBody: 'הפרטים והחתימות נשמרו ונשלח אליכם סיכום במייל. נחזור אליכם להשלמת ההזמנה.',
    orderNumber: 'מספר פנייה',
    home: 'חזרה לעמוד הבית',
    required: 'נא למלא את כל שדות החובה, לחתום ולאשר את התנאים.',
    secondHostRequired: 'בחתונה או באירוסין נדרשים שם, טלפון וחתימה של שני המזמינים.',
    signatureRequired: 'נדרשת חתימה של המזמין/ה.',
    phoneError: 'נא להזין מספר טלפון תקין.',
    emailError: 'נא להזין כתובת אימייל תקינה.',
    genericError: 'לא הצלחנו לשלוח את ההזמנה. נסו שוב או פנו אלינו בוואטסאפ.',
    empty: 'העגלה ריקה או שטרם הגעתם למינימום ההזמנה. יש לעדכן את הסל לפני השליחה.',
    policyTitle: 'מדיניות ביטולים, שינויים ואחריות',
    colors: 'צבעי האקססוריז, הפרחים או הבלונים',
    notSelected: 'טרם נכתב',
    request: 'בקשה אישית',
    coupon: 'קופון',
    deliveryTitle: 'הובלה והרכבה',
    deliveryBody: 'הוספת שירות הובלה והרכבה להזמנה ב־₪500.',
    deliveryOptional: 'לא חובה',
    items: 'פריטים וכמויות',
    signaturesTitle: 'חתימות המזמינים',
    signaturesBody: 'אפשר לחתום בציור באצבע או בעכבר, או להקליד שם מלא כחלופה נגישה.',
    primarySignature: 'חתימת המזמין/ה',
    secondarySignature: 'חתימת המזמין/ה הנוסף/ת',
    typedSignature: 'הקלדת שם מלא לחתימה',
    logoAlt: 'לוגו LD Event Design'
  },
  en: {
    kicker: 'Order selection',
    title: 'Submit your order selection',
    subtitle: 'Choose, sign and send. No payment is collected now — we will contact you to complete the order.',
    eventType: 'Event type',
    eventTypePlaceholder: 'Select an event type',
    fullName: 'Host name',
    additionalName: 'Second host name',
    phone: 'Phone number',
    additionalPhone: 'Second phone number',
    email: 'Email',
    date: 'Event date',
    location: 'Event venue',
    notes: 'Additional notes and requests',
    terms: 'I confirm that I have read the engagement, cancellation and change policy',
    submit: 'Submit order (no payment now)',
    sending: 'Submitting…',
    summary: 'Order selection summary',
    total: 'Selection total',
    editCart: 'Edit cart',
    successTitle: 'Your order selection was received',
    successBody: 'Your details and signatures were saved and a summary will be emailed to you. We will contact you to complete the order.',
    orderNumber: 'Request number',
    home: 'Back to homepage',
    required: 'Please complete all required fields, sign and approve the terms.',
    secondHostRequired: 'Weddings and engagements require the name, phone and signature of both hosts.',
    signatureRequired: 'The host signature is required.',
    phoneError: 'Please enter a valid phone number.',
    emailError: 'Please enter a valid email address.',
    genericError: 'We could not submit the order. Please try again or contact us on WhatsApp.',
    empty: 'The cart is empty or below the minimum. Please update it before submitting.',
    policyTitle: 'Cancellation, changes and responsibility policy',
    colors: 'Accessory, flower or balloon colors',
    notSelected: 'Not entered',
    request: 'Custom request',
    coupon: 'Coupon',
    deliveryTitle: 'Delivery and setup',
    deliveryBody: 'Add delivery and setup to the order for ₪500.',
    deliveryOptional: 'Optional',
    items: 'Items and quantities',
    signaturesTitle: 'Host signatures',
    signaturesBody: 'Draw with a finger or mouse, or type a full name as an accessible alternative.',
    primarySignature: 'Host signature',
    secondarySignature: 'Second host signature',
    typedSignature: 'Type full name as signature',
    logoAlt: 'LD Event Design logo'
  }
} as const;

interface CheckoutForm {
  eventType: string;
  fullName: string;
  additionalName: string;
  phone: string;
  additionalPhone: string;
  email: string;
  eventDate: string;
  eventLocation: string;
  notes: string;
}

const EMPTY_FORM: CheckoutForm = {
  eventType: '',
  fullName: '',
  additionalName: '',
  phone: '',
  additionalPhone: '',
  email: '',
  eventDate: '',
  eventLocation: '',
  notes: ''
};

const PHONE_PATTERN = /^\+?\d{9,15}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function money(value: number, lang: Lang) {
  return '₪' + value.toLocaleString(lang === 'he' ? 'he-IL' : 'en-US');
}

function validPhone(value: string) {
  return PHONE_PATTERN.test(value.replace(/[\s()-]/g, ''));
}

function localizedCartItem(item: CartItem, lang: Lang) {
  if (lang !== 'en') return item;

  const packageText = PACKAGE_EN[item.id];
  if (packageText) {
    return {
      ...item,
      title: packageText.title,
      subtitle: packageText.subtitle,
      category: categoryLabel(item.category, lang)
    };
  }

  const productText = localizedProductText(item.id, item, lang);
  return {
    ...item,
    title: productText.title,
    subtitle: productText.subtitle,
    category: localizedProductCategory(item.category, lang)
  };
}

export function CheckoutPage() {
  const { lang, dir } = useI18n();
  const copy = COPY[lang];
  const Arrow = lang === 'he' ? ChevronLeft : ChevronRight;
  const { items, subtotal, preferences, clearCart } = useCart();
  const { overrides } = usePackages();
  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM);
  const [includeDelivery, setIncludeDelivery] = useState(false);
  const [primarySignature, setPrimarySignature] = useState<DigitalSignature>({ ...EMPTY_SIGNATURE });
  const [secondarySignature, setSecondarySignature] = useState<DigitalSignature>({ ...EMPTY_SIGNATURE });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState('');

  const requiresTwoHosts = form.eventType === 'wedding' || form.eventType === 'engagement';
  const deliveryPrice = includeDelivery ? DELIVERY_PRICE : 0;
  const totalPrice = subtotal + deliveryPrice;
  const logoUrl = brandLogoUrl(overrides);
  const localizedItems = useMemo(() => items.map((item) => localizedCartItem(item, lang)), [items, lang]);

  const itemSummary = useMemo(
    () => localizedItems.map((item) => item.title + (item.quantity > 1 ? ' × ' + item.quantity : '')).join(', '),
    [localizedItems]
  );

  const setField = (field: keyof CheckoutForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const validate = () => {
    if (
      !form.eventType ||
      !form.fullName.trim() ||
      !form.phone.trim() ||
      !form.email.trim() ||
      !form.eventDate ||
      !form.eventLocation.trim() ||
      !termsAccepted
    ) {
      return copy.required;
    }
    if (requiresTwoHosts && (!form.additionalName.trim() || !form.additionalPhone.trim() || !hasSignature(secondarySignature))) {
      return copy.secondHostRequired;
    }
    if (!hasSignature(primarySignature)) return copy.signatureRequired;
    if (!validPhone(form.phone) || (form.additionalPhone.trim() && !validPhone(form.additionalPhone))) return copy.phoneError;
    if (!EMAIL_PATTERN.test(form.email.trim())) return copy.emailError;
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
        items: localizedItems.map((item) => ({ id: item.id, title: item.title, price: item.price, quantity: item.quantity })),
        preferences,
        subtotal,
        includeDelivery,
        deliveryPrice,
        totalPrice,
        signatures: {
          primary: primarySignature,
          secondary: requiresTwoHosts ? secondarySignature : null
        },
        brandLogoUrl: logoUrl
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
      <section className="mx-auto max-w-2xl px-4 py-24 text-center" dir={dir}>
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
      <section className="mx-auto max-w-2xl px-4 py-24 text-center" dir={dir}>
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
  const phoneAlignment = lang === 'he' ? 'text-right' : 'text-left';

  return (
    <section className="bg-[#FAF6F0] py-10 sm:py-16" dir={dir}>
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-[#B8860B]"><FileText className="h-4 w-4" aria-hidden="true" /> {copy.kicker}</p>
          <h2 className="font-display mt-3 text-4xl font-black text-[#2C2C2C] sm:text-5xl">{copy.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6C625A]">{copy.subtitle}</p>
        </div>

        <QuoteNotice />

        <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_380px]">
          <form onSubmit={handleSubmit} noValidate className="rounded-[2rem] border border-[#E8C5B8]/70 bg-white p-5 shadow-sm sm:p-8">
            <label className="block text-sm font-extrabold text-[#2C2C2C]">
              {copy.eventType} *
              <select value={form.eventType} onChange={(event) => setField('eventType', event.target.value)} className={inputClass}>
                <option value="">{copy.eventTypePlaceholder}</option>
                {EVENT_TYPES[lang].map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </label>

            {requiresTwoHosts && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#D4AF37]/50 bg-[#FFFDF5] p-4 text-xs leading-relaxed text-[#6C5B31]">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#B8860B]" aria-hidden="true" />
                {copy.secondHostRequired}
              </div>
            )}

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-extrabold text-[#2C2C2C]">
                {copy.fullName} *
                <input value={form.fullName} onChange={(event) => setField('fullName', event.target.value)} autoComplete="name" className={inputClass} />
              </label>
              {requiresTwoHosts && (
                <label className="text-sm font-extrabold text-[#2C2C2C]">
                  {copy.additionalName} *
                  <input value={form.additionalName} onChange={(event) => setField('additionalName', event.target.value)} autoComplete="name" className={inputClass} />
                </label>
              )}
              <label className="text-sm font-extrabold text-[#2C2C2C]">
                {copy.phone} *
                <input value={form.phone} onChange={(event) => setField('phone', event.target.value)} type="tel" inputMode="tel" autoComplete="tel" dir="ltr" className={`${inputClass} ${phoneAlignment}`} />
              </label>
              {requiresTwoHosts && (
                <label className="text-sm font-extrabold text-[#2C2C2C]">
                  {copy.additionalPhone} *
                  <input value={form.additionalPhone} onChange={(event) => setField('additionalPhone', event.target.value)} type="tel" inputMode="tel" autoComplete="tel" dir="ltr" className={`${inputClass} ${phoneAlignment}`} />
                </label>
              )}
              <label className="text-sm font-extrabold text-[#2C2C2C]">
                {copy.email} *
                <input value={form.email} onChange={(event) => setField('email', event.target.value)} type="email" autoComplete="email" className={inputClass} />
              </label>
              <label className="text-sm font-extrabold text-[#2C2C2C]">
                {copy.date} *
                <input value={form.eventDate} onChange={(event) => setField('eventDate', event.target.value)} type="date" className={inputClass} />
              </label>
              <label className="text-sm font-extrabold text-[#2C2C2C] sm:col-span-2">
                {copy.location} *
                <input value={form.eventLocation} onChange={(event) => setField('eventLocation', event.target.value)} className={inputClass} />
              </label>
            </div>

            <label className="mt-5 block text-sm font-extrabold text-[#2C2C2C]">
              {copy.notes}
              <textarea value={form.notes} onChange={(event) => setField('notes', event.target.value)} rows={4} className={inputClass + ' resize-y'} />
            </label>

            <label className="mt-6 flex cursor-pointer items-start gap-4 rounded-[1.5rem] border border-[#E8C5B8] bg-gradient-to-br from-[#FFFDF8] to-[#F4E3E3]/40 p-5 shadow-sm">
              <input type="checkbox" checked={includeDelivery} onChange={(event) => setIncludeDelivery(event.target.checked)} className="mt-1 h-5 w-5 accent-[#B8860B]" />
              <span className="flex-1">
                <span className="flex flex-wrap items-center gap-2 font-display text-lg font-black text-[#2C2C2C]">
                  <Truck className="h-5 w-5 text-[#B8860B]" aria-hidden="true" />
                  {copy.deliveryTitle} — {money(DELIVERY_PRICE, lang)}
                  <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-extrabold text-[#8C6D3F]">{copy.deliveryOptional}</span>
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-[#6C625A]">{copy.deliveryBody}</span>
              </span>
            </label>

            <section className="mt-7" aria-labelledby="checkout-signatures-title">
              <h3 id="checkout-signatures-title" className="font-display text-2xl font-black text-[#2C2C2C]">{copy.signaturesTitle}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#6C625A]">{copy.signaturesBody}</p>
              <div className={'mt-4 grid gap-4 ' + (requiresTwoHosts ? 'md:grid-cols-2' : '')}>
                <SignaturePad
                  id="primary-signature"
                  label={copy.primarySignature + ' *'}
                  typedLabel={copy.typedSignature}
                  hint={copy.signaturesBody}
                  value={primarySignature}
                  onChange={(value) => { setPrimarySignature(value); setError(''); }}
                />
                {requiresTwoHosts && (
                  <SignaturePad
                    id="secondary-signature"
                    label={copy.secondarySignature + ' *'}
                    typedLabel={copy.typedSignature}
                    hint={copy.signaturesBody}
                    value={secondarySignature}
                    onChange={(value) => { setSecondarySignature(value); setError(''); }}
                  />
                )}
              </div>
            </section>

            <details className="mt-6 rounded-[1.5rem] border border-[#E8C5B8]/70 bg-[#FAF6F0] p-5">
              <summary className="cursor-pointer font-display text-lg font-black text-[#2C2C2C]">{copy.policyTitle}</summary>
              <ol className="mt-4 space-y-3 text-xs leading-relaxed text-[#5E5752]">
                {POLICY[lang].map((paragraph, index) => <li key={paragraph}><strong className="text-[#B8860B]">{index + 1}.</strong> {paragraph}</li>)}
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
            {logoUrl && <img src={logoUrl} alt={copy.logoAlt} className="mb-5 max-h-20 max-w-[180px] object-contain" />}
            <h3 className="font-display text-2xl font-black text-[#2C2C2C]">{copy.summary}</h3>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="rounded-2xl bg-[#FAF6F0] p-4"><dt className="font-extrabold text-[#2C2C2C]">{copy.items}</dt><dd className="mt-1 text-[#6C625A]">{itemSummary}</dd></div>
              <div className="rounded-2xl bg-[#FAF6F0] p-4"><dt className="font-extrabold text-[#2C2C2C]">{copy.colors}</dt><dd className="mt-1 whitespace-pre-wrap text-[#6C625A]">{preferences.customColors || copy.notSelected}</dd></div>
              {preferences.customRequest && <div className="rounded-2xl bg-[#FAF6F0] p-4"><dt className="font-extrabold text-[#2C2C2C]">{copy.request}</dt><dd className="mt-1 whitespace-pre-wrap text-[#6C625A]">{preferences.customRequest}</dd></div>}
              {preferences.couponApplied && <div className="rounded-2xl bg-emerald-50 p-4"><dt className="font-extrabold text-emerald-800">{copy.coupon}</dt><dd className="mt-1 flex items-center gap-1.5 text-emerald-800"><Sparkles className="h-4 w-4" aria-hidden="true" />{preferences.couponCode}</dd></div>}
              {includeDelivery && <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#FFF8E7] p-4"><dt className="font-extrabold text-[#6C5B31]">{copy.deliveryTitle}</dt><dd className="font-black text-[#B8860B]">{money(DELIVERY_PRICE, lang)}</dd></div>}
              <div className="flex items-center justify-between gap-3 border-t border-[#E8C5B8]/60 pt-5"><dt className="font-extrabold text-[#2C2C2C]">{copy.total}</dt><dd className="font-display text-2xl font-black text-[#B8860B]">{money(totalPrice, lang)}</dd></div>
            </dl>
            <p className="mt-3 text-xs font-bold leading-relaxed text-[#7A7069]">{copy.subtitle}</p>
            <Link to="/cart" className="mt-5 flex items-center justify-center text-xs font-bold text-[#B8860B] hover:underline">{copy.editCart}</Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
