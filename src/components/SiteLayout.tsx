import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { LogOut, Phone, ShoppingBag, Sparkles, User as UserIcon, X } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { useCart } from '../cart/CartProvider';
import { useI18n } from '../i18n/i18n';
import { AccessibilityWidget } from './AccessibilityWidget';
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

function money(value: number) {
  return `₪${value.toLocaleString()}`;
}

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const { t, tList, lang, dir, setLang } = useI18n();
  const { user, role, signOut } = useAuth();
  const { itemCount, subtotal } = useCart();
  const [legalModal, setLegalModal] = useState<LegalKey | null>(null);
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

  const navLink = 'text-xs font-bold text-gray-600 hover:text-[#B29259] transition-colors px-2 py-1';
  const cartText = lang === 'he' ? 'עגלת קניות' : 'Shopping cart';

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#FAF7F2] font-sans text-gray-800 antialiased" dir={dir}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-[100] focus:rounded-lg focus:bg-[#B29259] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg">
        {t('a11y.skip')}
      </a>

      <header className="sticky top-0 z-50 border-b border-[#EAE3D2] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="group flex items-center gap-2.5">
            <div className="rounded-2xl bg-gradient-to-br from-[#B29259] to-[#8C6D3F] p-2 text-white shadow-md transition-transform group-hover:scale-105">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="text-start">
              <h1 className="font-display text-lg font-bold tracking-wide text-[#8C6D3F] sm:text-xl">LD Event Design</h1>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">{t('brand.tagline')}</p>
            </div>
          </Link>

          <nav className="order-last flex w-full flex-wrap items-center justify-center gap-1 border-t border-[#EAE3D2] pt-2 sm:order-none sm:w-auto sm:border-0 sm:pt-0" aria-label={t('nav.menu')}>
            <Link to="/" className={`link-underline ${navLink}`}>{t('nav.home')}</Link>
            <a href="/#packages" className={`link-underline ${navLink}`}>{lang === 'he' ? 'חנות' : 'Shop'}</a>
            {role === 'customer' && <Link to="/account" className={`link-underline ${navLink}`}>{t('nav.account')}</Link>}
            {role === 'admin' && <Link to="/admin" className={`link-underline ${navLink}`}>{t('nav.admin')}</Link>}
          </nav>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-full border border-[#EAE3D2] bg-[#FAF7F2] p-0.5" role="group" aria-label={t('lang.switch')}>
              <button type="button" onClick={() => setLang('he')} aria-pressed={lang === 'he'} className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${lang === 'he' ? 'bg-[#B29259] text-white' : 'text-gray-500 hover:text-[#B29259]'}`}>עברית</button>
              <button type="button" onClick={() => setLang('en')} aria-pressed={lang === 'en'} lang="en" className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${lang === 'en' ? 'bg-[#B29259] text-white' : 'text-gray-500 hover:text-[#B29259]'}`}>EN</button>
            </div>

            <Link to="/cart" aria-label={`${cartText}: ${itemCount}`} className="relative inline-flex items-center gap-2 rounded-xl bg-[#8C6D3F] px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#6d5430]">
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{money(subtotal)}</span>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-black text-[#8C6D3F]">{itemCount}</span>
            </Link>

            {user && (
              <div className="flex items-center gap-1.5">
                <span className="hidden max-w-[140px] items-center gap-1 truncate text-[11px] text-gray-500 sm:flex" title={user.email ?? ''}>
                  <UserIcon className="h-3.5 w-3.5 text-[#B29259]" aria-hidden="true" />
                  {user.email}
                </span>
                <button type="button" onClick={() => signOut()} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold text-gray-600 hover:text-red-500">
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('nav.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 outline-none">{children}</main>

      <footer className="mt-16 bg-[#2c241a] text-[#EAE3D2]">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-4 py-12 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="rounded-2xl bg-gradient-to-br from-[#B29259] to-[#8C6D3F] p-2 text-white"><Sparkles className="h-4 w-4" aria-hidden="true" /></div>
              <span className="font-display text-lg font-bold text-white">LD Event Design</span>
            </div>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-[#EAE3D2]/60">{t('home.heroSub')}</p>
            <a href="tel:+972545740423" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#D8C29A] hover:text-white">
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              <span dir="ltr">{t('brand.phone')}</span>
            </a>
          </div>

          <nav aria-label={t('nav.menu')}>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.25em] text-[#B29259]">{t('nav.menu')}</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/" className="link-underline hover:text-white">{t('nav.home')}</Link></li>
              <li><a href="/#packages" className="link-underline hover:text-white">{lang === 'he' ? 'חנות' : 'Shop'}</a></li>
              <li><Link to="/cart" className="link-underline hover:text-white">{cartText}</Link></li>
              {role === 'admin' && <li><Link to="/admin" className="link-underline hover:text-white">{t('nav.admin')}</Link></li>}
              {role === 'customer' && <li><Link to="/account" className="link-underline hover:text-white">{t('nav.account')}</Link></li>}
              {!user && <li><Link to="/login" className="link-underline text-[#D8C29A] hover:text-white">{lang === 'he' ? 'כניסת לקוחות קיימים' : 'Existing customer login'}</Link></li>}
            </ul>
          </nav>

          <nav aria-label={t('legal.terms')}>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.25em] text-[#B29259]">{t('legal.terms')}</p>
            <ul className="space-y-2.5 text-sm">
              <li><button type="button" onClick={() => openLegalModal('privacy')} className="link-underline hover:text-white">{t('legal.privacy')}</button></li>
              <li><button type="button" onClick={() => openLegalModal('terms')} className="link-underline hover:text-white">{t('legal.terms')}</button></li>
              <li><button type="button" onClick={() => openLegalModal('accessibility')} className="link-underline hover:text-white">{t('legal.accessibility')}</button></li>
            </ul>
          </nav>
        </div>

        <div className="border-t border-white/10">
          <p className="mx-auto max-w-5xl px-4 py-4 text-center text-[11px] text-[#EAE3D2]/50">
            <bdi dir="ltr">© {new Date().getFullYear()} LD EVENT DESIGN.</bdi> {t('footer.rights')}
            <br />
            <a href={`https://wa.me/972587170978?text=${encodeURIComponent('היי ניסן, ראיתי אתר שעיצבת ואשמח לפרטים על בניית אתר 🙂')}`} target="_blank" rel="noopener noreferrer" className="text-[#EAE3D2]/70 underline-offset-2 hover:text-white hover:underline">
              {t('footer.credit')}
            </a>
          </p>
        </div>
      </footer>

      {legalModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={closeLegalModal}>
          <div
            ref={legalPanelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="site-legal-title"
            aria-describedby="site-legal-body"
            className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-6 shadow-xl outline-none"
            onClick={(event) => event.stopPropagation()}
            dir={dir}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 id="site-legal-title" className="text-lg font-bold text-[#8C6D3F]">{t(`legal.${legalModal}`)}</h2>
              <button type="button" onClick={closeLegalModal} aria-label={t('legal.close')} className="text-gray-400 hover:text-gray-700"><X className="h-5 w-5" aria-hidden="true" /></button>
            </div>
            <div id="site-legal-body" className="space-y-2.5 text-sm leading-relaxed text-gray-600">
              {tList(`legal.${legalModal}Body`).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </div>
            <button type="button" onClick={closeLegalModal} className="mt-5 w-full rounded-xl bg-[#B29259] py-2.5 text-sm font-bold text-white hover:bg-[#8C6D3F]">{t('legal.close')}</button>
          </div>
        </div>
      )}

      <AccessibilityWidget onOpenStatement={() => openLegalModal('accessibility')} />
      <WhatsAppButton />
    </div>
  );
}
