import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Facebook, Instagram, LogOut, Phone, ShoppingBag, Sparkles, User as UserIcon, X } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { useCart } from '../cart/CartProvider';
import { useI18n } from '../i18n/i18n';
import { brandLogoUrl } from '../lib/branding';
import { usePackages } from '../packages/PackagesProvider';
import { AccessibilityWidget } from './AccessibilityWidget';
import { CartDrawer } from './CartDrawer';
import { WhatsAppButton } from './WhatsAppButton';

type LegalKey = 'privacy' | 'terms' | 'accessibility';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

const CANCELLATION_POLICY = [
  'במקרה של ביטול עקב כוח עליון — מלחמה או מגפה — הסכום ששולם יועבר לזיכוי לתאריך חלופי על בסיס זמינות. אם לא יימצא תאריך מוסכם, לא יוחזרו 50% מסכום העסקה הכולל.',
  'במקרה של כל ביטול אחר, לא יוחזר ללקוח כל תשלום והלקוח יחויב במלוא תשלום העסקה.',
  'אם לא יימצא תאריך חלופי, הלקוח/ה יוכל/תוכל להגיע לקחת את הציוד שהוזמן לאירוע בתשלום מלא של העסקה, ללא הובלה והרכבה ובכפוף להשארת פיקדון עד להחזרת הציוד.',
  'ניתן לעדכן תוספות קלות בכמויות ההזמנה עד 30 ימי עסקים לפני מועד האירוע.',
  'האחריות על הציוד בזמן האירוע חלה על הלקוח/ה.',
  'יתרת התשלום תועבר בהעברה בנקאית כאישור, כשבוע לפני מועד האירוע.'
];

function money(value: number) {
  return `₪${value.toLocaleString('he-IL')}`;
}

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { t, tList, lang, dir, setLang } = useI18n();
  const { user, role, roleLoading, signOut } = useAuth();
  const { itemCount, subtotal } = useCart();
  const { overrides } = usePackages();
  const [legalModal, setLegalModal] = useState<LegalKey | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const legalPanelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const openLegalModal = (key: LegalKey) => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setLegalModal(key);
  };

  const closeLegalModal = () => setLegalModal(null);

  useEffect(() => {
    if (!legalModal) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => legalPanelRef.current?.focus(), 0);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeLegalModal();
        return;
      }
      if (event.key !== 'Tab') return;

      const panel = legalPanelRef.current!;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (!panel.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
      const returnTo = returnFocusRef.current;
      if (returnTo?.isConnected) returnTo.focus();
    };
  }, [legalModal]);

  const buildPackageHashes = ['#products', '#packages', '#design-details'];
  const isBuildPackageActive =
    location.pathname === '/' &&
    (buildPackageHashes.includes(location.hash) || location.hash.startsWith('#product-category-'));
  const isHomeActive = location.pathname === '/' && !isBuildPackageActive;
  const isAccountActive = location.pathname === '/account';
  const isAdminActive = location.pathname === '/admin';
  const navLinkClass = (active: boolean) =>
    `rounded-full px-4 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8860B] focus-visible:ring-offset-2 ${
      active
        ? 'bg-gradient-to-r from-[#B8860B] to-[#D4AF37] text-white shadow-[0_7px_20px_rgba(184,134,11,0.24)] hover:brightness-105'
        : 'text-[#4A4540] hover:bg-white/75 hover:text-[#B8860B]'
    }`;
  const cartText = t('nav.cart');
  const logoUrl = brandLogoUrl(overrides);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#FDFBF7] font-sans text-[#2C2C2C] antialiased" dir={dir}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[150] focus:rounded-full focus:bg-[#B8860B] focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-white focus:shadow-xl">
        {t('a11y.skip')}
      </a>

      <header className="sticky top-0 z-50 border-b border-white/70 bg-[#FDFBF7]/82 shadow-[0_8px_35px_rgba(44,44,44,0.05)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className={`group flex min-w-0 items-center ${logoUrl ? '' : 'gap-2.5'}`}>
            {logoUrl ? (
              <>
                <span className="flex h-16 w-[9.75rem] shrink-0 items-center justify-center overflow-hidden rounded-[1.35rem] border border-[#E8C5B8]/70 bg-white px-2 py-1.5 shadow-sm sm:h-[4.5rem] sm:w-52">
                  <img src={logoUrl} alt="לוגו LD Event Design" className="h-full w-full object-contain" />
                </span>
                <h1 className="sr-only">LD Event Design</h1>
              </>
            ) : (
              <>
                <div className="rounded-2xl bg-gradient-to-br from-[#D4AF37] via-[#C69A71] to-[#B8860B] p-2 text-white shadow-lg transition-transform group-hover:rotate-3 group-hover:scale-105">
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="text-start">
                  <h1 className="font-display text-lg font-black tracking-wide text-[#2C2C2C] sm:text-xl">LD Event Design</h1>
                  <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#9B7762]">{t('brand.tagline')}</p>
                </div>
              </>
            )}
          </Link>

          <nav className="order-last flex w-full items-center justify-center gap-1 border-t border-[#E8C5B8]/55 pt-2 sm:order-none sm:w-auto sm:border-0 sm:pt-0" aria-label={t('nav.menu')}>
            <Link to="/" aria-current={isHomeActive ? 'page' : undefined} className={navLinkClass(isHomeActive)}>{t('nav.home')}</Link>
            <Link to="/#packages" aria-current={isBuildPackageActive ? 'location' : undefined} className={navLinkClass(isBuildPackageActive)}>{t('nav.buildPackage')}</Link>
            {!roleLoading && role === 'customer' && <Link to="/account" aria-current={isAccountActive ? 'page' : undefined} className={navLinkClass(isAccountActive)}>{t('nav.account')}</Link>}
            {!roleLoading && role === 'admin' && <Link to="/admin" aria-current={isAdminActive ? 'page' : undefined} className={navLinkClass(isAdminActive)}>{t('nav.admin')}</Link>}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden items-center rounded-full border border-[#E8C5B8]/70 bg-white/70 p-0.5 sm:flex" role="group" aria-label={t('lang.switch')}>
              <button type="button" onClick={() => setLang('he')} aria-pressed={lang === 'he'} className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors ${lang === 'he' ? 'bg-[#B8860B] text-white' : 'text-[#746B64] hover:text-[#B8860B]'}`}>עברית</button>
              <button type="button" onClick={() => setLang('en')} aria-pressed={lang === 'en'} lang="en" className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors ${lang === 'en' ? 'bg-[#B8860B] text-white' : 'text-[#746B64] hover:text-[#B8860B]'}`}>EN</button>
            </div>

            <Link
              to="/cart"
              onClick={(event) => { event.preventDefault(); setCartOpen(true); }}
              aria-label={`${cartText}: ${itemCount}`}
              className="relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#B8860B] to-[#D4AF37] px-3 py-2.5 text-xs font-extrabold text-white shadow-[0_10px_25px_rgba(184,134,11,0.23)] transition hover:-translate-y-0.5"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              <span className="hidden md:inline">{money(subtotal)}</span>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-black text-[#B8860B]">{itemCount}</span>
            </Link>

            {user && (
              <div className="flex items-center gap-1.5">
                <span className="hidden max-w-[140px] items-center gap-1 truncate text-[10px] text-[#746B64] lg:flex" title={user.email ?? ''}>
                  <UserIcon className="h-3.5 w-3.5 text-[#B8860B]" aria-hidden="true" />
                  {user.email}
                </span>
                <button type="button" onClick={() => signOut()} className="flex items-center gap-1 rounded-full px-2 py-1.5 text-[10px] font-bold text-[#746B64] hover:bg-red-50 hover:text-red-600">
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">{t('nav.logout')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 outline-none">{children}</main>

      <footer className="mt-16 bg-[#24211F] text-[#F4EDE7]">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-14 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              {logoUrl ? (
                <span className="flex h-20 w-56 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-sm">
                  <img src={logoUrl} alt="לוגו LD Event Design" className="h-full w-full object-contain" />
                </span>
              ) : (
                <>
                  <div className="rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8860B] p-2 text-white"><Sparkles className="h-4 w-4" aria-hidden="true" /></div>
                  <span className="font-display text-xl font-black text-white">LD Event Design</span>
                </>
              )}
            </div>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-white/55">עיצוב אירועים נשי, מדויק ומלא רגש — מהרעיון הראשון ועד לרגע שבו האורחים נכנסים.</p>
            <a href="tel:+972545740423" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#E8C5B8] hover:text-white">
              <Phone className="h-4 w-4" aria-hidden="true" />
              <span dir="ltr">054-5740423</span>
            </a>
            <div className="mt-5 flex gap-2">
              <a href="https://www.instagram.com/ld_event_design?igsh=MWpsN2c2OWhyY2FsaQ==" target="_blank" rel="noopener noreferrer" aria-label="אינסטגרם LD Event Design" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[#E8C5B8] transition hover:-translate-y-1 hover:bg-[#E8C5B8] hover:text-[#24211F]"><Instagram className="h-4 w-4" aria-hidden="true" /></a>
              <a href="https://www.facebook.com/share/1AvmE8yKWr/" target="_blank" rel="noopener noreferrer" aria-label="פייסבוק LD Event Design" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[#E8C5B8] transition hover:-translate-y-1 hover:bg-[#E8C5B8] hover:text-[#24211F]"><Facebook className="h-4 w-4" aria-hidden="true" /></a>
            </div>
          </div>

          <nav aria-label={t('nav.menu')}>
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37]">{t('nav.menu')}</p>
            <ul className="space-y-3 text-sm text-white/70">
              <li><Link to="/" className="hover:text-white">{t('nav.home')}</Link></li>
              <li><a href="/#packages" className="hover:text-white">{t('nav.buildPackage')}</a></li>
              <li><button type="button" onClick={() => setCartOpen(true)} className="hover:text-white">{cartText}</button></li>
              {!roleLoading && role === 'admin' && <li><Link to="/admin" className="hover:text-white">{t('nav.admin')}</Link></li>}
              {!roleLoading && role === 'customer' && <li><Link to="/account" className="hover:text-white">{t('nav.account')}</Link></li>}
              {!user && (
                <li>
                  <Link to="/login" state={{ from: '/admin' }} className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/60 px-4 py-2 font-bold text-[#E8C5B8] transition hover:bg-[#D4AF37] hover:text-[#24211F]">
                    <UserIcon className="h-4 w-4" aria-hidden="true" />
                    {t('nav.managerLogin')}
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          <nav aria-label={t('legal.terms')}>
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37]">מידע חשוב</p>
            <ul className="space-y-3 text-sm text-white/70">
              <li><button type="button" onClick={() => openLegalModal('privacy')} className="hover:text-white">{t('legal.privacy')}</button></li>
              <li><button type="button" onClick={() => openLegalModal('terms')} className="hover:text-white">מדיניות ביטולים ושינויים</button></li>
              <li><button type="button" onClick={() => openLegalModal('accessibility')} className="hover:text-white">{t('legal.accessibility')}</button></li>
            </ul>
          </nav>
        </div>

        <div className="border-t border-white/10">
          <p className="mx-auto max-w-6xl px-4 py-5 text-center text-[10px] leading-relaxed text-white/40">
            <bdi dir="ltr">© {new Date().getFullYear()} LD EVENT DESIGN.</bdi> {t('footer.rights')}
            <br />
            <a href={`https://wa.me/972587170978?text=${encodeURIComponent('היי ניסן, ראיתי אתר שעיצבת ואשמח לפרטים על בניית אתר 🙂')}`} target="_blank" rel="noopener noreferrer" className="text-white/55 underline-offset-2 hover:text-white hover:underline">{t('footer.credit')}</a>
          </p>
        </div>
      </footer>

      {legalModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#2C2C2C]/55 p-4 backdrop-blur-sm" onClick={closeLegalModal}>
          <div ref={legalPanelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="site-legal-title" aria-describedby="site-legal-body" className="max-h-[84vh] w-full max-w-2xl overflow-auto rounded-[2rem] border border-white/70 bg-[#FDFBF7] p-6 shadow-[0_35px_100px_rgba(44,44,44,0.3)] outline-none sm:p-8" onClick={(event) => event.stopPropagation()} dir={dir}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 id="site-legal-title" className="font-display text-xl font-black text-[#2C2C2C]">{legalModal === 'terms' ? 'מדיניות ביטולים ושינויים' : t(`legal.${legalModal}`)}</h2>
              <button type="button" onClick={closeLegalModal} aria-label={t('legal.close')} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#746B64] shadow-sm hover:text-[#2C2C2C]"><X className="h-5 w-5" aria-hidden="true" /></button>
            </div>
            <div id="site-legal-body" className="space-y-3 text-sm leading-relaxed text-[#5E5752]">
              {legalModal === 'terms'
                ? CANCELLATION_POLICY.map((paragraph, index) => <p key={paragraph} className="rounded-2xl bg-white p-4"><strong className="text-[#B8860B]">{index + 1}.</strong> {paragraph}</p>)
                : tList(`legal.${legalModal}Body`).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </div>
            <button type="button" onClick={closeLegalModal} className="mt-6 w-full rounded-full bg-gradient-to-r from-[#B8860B] to-[#D4AF37] py-3 text-sm font-extrabold text-white">{t('legal.close')}</button>
          </div>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <AccessibilityWidget onOpenStatement={() => openLegalModal('accessibility')} />
      <WhatsAppButton />
    </div>
  );
}
