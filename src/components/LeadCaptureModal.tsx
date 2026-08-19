import { FormEvent, useEffect, useRef, useState } from 'react';
import { CalendarDays, CheckCircle2, Mail, Phone, Sparkles, UserRound, X } from 'lucide-react';
import { submitLead } from '../lib/submitLead';
import { useI18n } from '../i18n/i18n';

const SESSION_KEY = 'ld-event-design-lead-popup-dismissed';

interface LeadForm {
  fullName: string;
  phone: string;
  email: string;
  estimatedEventDate: string;
  website: string;
}

const EMPTY_FORM: LeadForm = {
  fullName: '',
  phone: '',
  email: '',
  estimatedEventDate: '',
  website: ''
};

const COPY = {
  he: {
    invalidContact: 'נא למלא שם מלא ומספר טלפון תקין.',
    invalidEmail: 'כתובת האימייל אינה תקינה.',
    submitError: 'לא הצלחנו לשלוח כרגע. אפשר לפנות אלינו ישירות בוואטסאפ.',
    close: 'סגירת חלון הייעוץ',
    sentTitle: 'הפרטים התקבלו באהבה',
    sentBody: 'ניצור איתכם קשר לשיחת ייעוץ עיצובית ונעזור להפוך את החזון שלכם לאירוע בלתי נשכח.',
    sentButton: 'איזה כיף, תודה!',
    kicker: 'שיחת ייעוץ במתנה',
    title: 'חולמים על אירוע מושלם ולא בטוחים מאיפה להתחיל?',
    body: 'השאירו פרטים ונחזור אליכם לשיחת ייעוץ עיצובי במתנה!',
    fullName: 'שם מלא',
    fullNamePlaceholder: 'שם מלא *',
    phone: 'טלפון',
    phonePlaceholder: 'טלפון *',
    email: 'אימייל',
    emailPlaceholder: 'אימייל',
    eventDate: 'תאריך האירוע',
    sending: 'שולחים…',
    submit: 'כן, אשמח לשיחת ייעוץ במתנה'
  },
  en: {
    invalidContact: 'Please enter a full name and a valid phone number.',
    invalidEmail: 'Please enter a valid email address.',
    submitError: 'We could not send your details right now. You can contact us directly on WhatsApp.',
    close: 'Close consultation window',
    sentTitle: 'Thank you — we received your details',
    sentBody: 'We will contact you for a design consultation and help turn your vision into an unforgettable event.',
    sentButton: 'Great, thank you!',
    kicker: 'Complimentary consultation',
    title: 'Dreaming of the perfect event and not sure where to begin?',
    body: 'Leave your details and we will contact you for a complimentary design consultation.',
    fullName: 'Full name',
    fullNamePlaceholder: 'Full name *',
    phone: 'Phone',
    phonePlaceholder: 'Phone *',
    email: 'Email',
    emailPlaceholder: 'Email',
    eventDate: 'Event date',
    sending: 'Sending…',
    submit: 'Yes, I would love a free consultation'
  }
} as const;

export function LeadCaptureModal() {
  const { lang, dir } = useI18n();
  const copy = COPY[lang];
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<LeadForm>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.sessionStorage.getItem(SESSION_KEY) === '1') return;
    let shown = false;
    const show = () => {
      if (shown || window.sessionStorage.getItem(SESSION_KEY) === '1') return;
      shown = true;
      setOpen(true);
    };
    const onScroll = () => {
      const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      if (window.scrollY / scrollable > 0.28) show();
    };
    const onExit = (event: MouseEvent) => {
      if (event.clientY <= 8) show();
    };
    const timer = window.setTimeout(show, 14000);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('mouseleave', onExit);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mouseleave', onExit);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => dialogRef.current?.focus(), 0);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => {
    window.sessionStorage.setItem(SESSION_KEY, '1');
    setOpen(false);
  };

  const setField = (field: keyof LeadForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.website) return;
    if (form.fullName.trim().length < 2 || form.phone.replace(/\D/g, '').length < 9) {
      setError(copy.invalidContact);
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError(copy.invalidEmail);
      return;
    }

    setSubmitting(true);
    try {
      await submitLead({
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        estimatedEventDate: form.estimatedEventDate
      });
      setSent(true);
      window.sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      setError(copy.submitError);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const inputBaseClass = 'w-full rounded-2xl border border-[#E8C5B8] bg-white/90 py-3 text-sm text-[#2C2C2C] outline-none transition focus:border-[#B8860B] focus:ring-4 focus:ring-[#E8C5B8]/35';
  const inputClass = `${inputBaseClass} ps-11 pe-4`;
  const phoneInputClass = `${inputBaseClass} ps-11 pe-4 ${lang === 'he' ? 'text-right' : 'text-left'}`;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#2C2C2C]/55 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="lead-dialog-title" className="relative max-h-[92vh] w-full max-w-xl overflow-auto rounded-[2.25rem] border border-white/70 bg-[#FDFBF7] p-5 shadow-[0_30px_100px_rgba(44,44,44,0.35)] outline-none sm:p-8" dir={dir}>
        <button type="button" onClick={close} aria-label={copy.close} className="absolute end-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#6C625A] shadow-sm transition hover:rotate-90 hover:text-[#2C2C2C]">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        {sent ? (
          <div className="px-3 py-12 text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-[#B8860B]" aria-hidden="true" />
            <h2 id="lead-dialog-title" className="font-display mt-5 text-3xl font-black text-[#2C2C2C]">{copy.sentTitle}</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#6C625A]">{copy.sentBody}</p>
            <button type="button" onClick={() => setOpen(false)} className="mt-7 rounded-full bg-gradient-to-r from-[#B8860B] to-[#D4AF37] px-7 py-3 text-sm font-extrabold text-white shadow-lg">{copy.sentButton}</button>
          </div>
        ) : (
          <>
            <div className="pe-10 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F4E3E3] text-[#B8860B]"><Sparkles className="h-5 w-5" aria-hidden="true" /></span>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.32em] text-[#B8860B]">{copy.kicker}</p>
              <h2 id="lead-dialog-title" className="font-display mt-2 text-2xl font-black leading-tight text-[#2C2C2C] sm:text-3xl">{copy.title}</h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#6C625A]">{copy.body}</p>
            </div>

            <form onSubmit={submit} className="mt-6 grid gap-3.5 sm:grid-cols-2" noValidate>
              <label className="relative block sm:col-span-2">
                <span className="sr-only">{copy.fullName}</span>
                <UserRound className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B8860B]" aria-hidden="true" />
                <input value={form.fullName} onChange={(event) => setField('fullName', event.target.value)} placeholder={copy.fullNamePlaceholder} autoComplete="name" className={inputClass} />
              </label>
              <label className="relative block">
                <span className="sr-only">{copy.phone}</span>
                <Phone className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B8860B]" aria-hidden="true" />
                <input value={form.phone} onChange={(event) => setField('phone', event.target.value)} placeholder={copy.phonePlaceholder} type="tel" inputMode="tel" autoComplete="tel" dir="ltr" className={phoneInputClass} />
              </label>
              <label className="relative block">
                <span className="sr-only">{copy.email}</span>
                <Mail className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B8860B]" aria-hidden="true" />
                <input value={form.email} onChange={(event) => setField('email', event.target.value)} placeholder={copy.emailPlaceholder} type="email" autoComplete="email" className={inputClass} />
              </label>
              <label className="block text-start sm:col-span-2">
                <span className="mb-1.5 block text-xs font-extrabold text-[#6C625A]">{copy.eventDate}</span>
                <span className="relative block">
                  <CalendarDays className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B8860B]" aria-hidden="true" />
                  <input value={form.estimatedEventDate} onChange={(event) => setField('estimatedEventDate', event.target.value)} type="date" className={inputClass} />
                </span>
              </label>
              <label className="hidden" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => setField('website', event.target.value)} /></label>

              {error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-center text-xs font-bold text-red-700 sm:col-span-2">{error}</p>}

              <button type="submit" disabled={submitting} className="mt-1 rounded-full bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#C69A71] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(184,134,11,0.24)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60 sm:col-span-2">
                {submitting ? copy.sending : copy.submit}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
