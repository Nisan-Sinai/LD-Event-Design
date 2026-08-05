import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Phone, LogOut, LogIn, UserPlus, User as UserIcon, X } from 'lucide-react';
import { useI18n } from '../i18n/i18n';
import { useAuth } from '../auth/AuthProvider';
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

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const { t, tList, lang, dir, setLang } = useI18n();
  const { user, role, signOut } = useAuth();
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

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeLegalModal();
        return;
      }

      if (e.key !== 'Tab') return;
      const panel = legalPanelRef.current!;

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (!panel.contains(active)) {
        e.preventDefault();
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

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-gray-800 font-sans antialiased flex flex-col overflow-x-hidden" dir={dir}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:start-2 focus:bg-[#B29259] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-bold"
      >
        {t('a11y.skip')}
      </a>

      <header className="bg-white/85 backdrop-blur-md border-b border-[#EAE3D2] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="bg-gradient-to-br from-[#B29259] to-[#8C6D3F] text-white p-2 rounded-2xl shadow-md group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="text-start">
              <h1 className="text-lg sm:text-xl font-bold text-[#8C6D3F] font-display tracking-wide">LD Event Design</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">{t('brand.tagline')}</p>
            </div>
          </Link>

          <nav className="order-last sm:order-none w-full sm:w-auto flex items-center justify-center gap-1 flex-wrap border-t sm:border-0 border-[#EAE3D2] pt-2 sm:pt-0" aria-label={t('nav.menu')}>
            <Link to="/" className={`link-underline ${navLink}`}>{t('nav.home')}</Link>
            <Link to="/order" className={`link-underline ${navLink}`}>{t('nav.order')}</Link>
            {role === 'customer' && <Link to="/account" className={`link-underline ${navLink}`}>{t('nav.account')}</Link>}
            {role === 'admin' && <Link to="/admin" className={`link-underline ${navLink}`}>{t('nav.admin')}</Link>}
          </nav>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#FAF7F2] rounded-full border border-[#EAE3D2] p-0.5" role="group" aria-label={t('lang.switch')}>
              <button type="button" onClick={() => setLang('he')} aria-pressed={lang === 'he'} className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${lang === 'he' ? 'bg-[#B29259] text-white' : 'text-gray-500 hover:text-[#B29259]'}`}>עברית</button>
              <button type="button" onClick={() => setLang('en')} aria-pressed={lang === 'en'} lang="en" className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${lang === 'en' ? 'bg-[#B29259] text-white' : 'text-gray-500 hover:text-[#B29259]'}`}>EN</button>
            </div>

            {user ? (
              <div className="flex items-center gap-1.5">
                <span className="hidden sm:flex items-center gap-1 text-[11px] text-gray-500 max-w-[140px] truncate" title={user.email ?? ''}>
                  <UserIcon className="w-3.5 h-3.5 text-[#B29259]" aria-hidden="true" />
                  {user.email}
                </span>
                <button type="button" onClick={() => signOut()} className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-red-500 px-2 py-1.5 rounded-lg">
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Link to="/login" className="flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-[#B29259] px-2 py-1.5">
                  <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="flex items-center gap-1 text-[11px] font-bold bg-[#B29259] hover:bg-[#8C6D3F] text-white px-3 py-1.5 rounded-lg">
                  <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>

      <footer className="mt-16 bg-[#2c241a] text-[#EAE3D2]">
        <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="bg-gradient-to-br from-[#B29259] to-[#8C6D3F] text-white p-2 rounded-2xl">
                <Sparkles className="w-4 h-4" aria-hidden="true" />
              </div>
              <span className="font-display font-bold text-lg text-white">LD Event Design</span>
            </div>
            <p className="text-xs text-[#EAE3D2]/60 mt-3 leading-relaxed max-w-xs">{t('home.heroSub')}</p>
            <a href="tel:+972545740423" className="inline-flex items-center gap-1.5 text-sm font-bold mt-4 text-[#D8C29A] hover:text-white transition-colors">
              <Phone className="w-3.5 h-3.5" aria-hidden="true" />
              <span dir="ltr">{t('brand.phone')}</span>
            </a>
          </div>

          <nav aria-label={t('nav.menu')}>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#B29259] mb-4">{t('nav.menu')}</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/" className="link-underline hover:text-white transition-colors">{t('nav.home')}</Link></li>
              <li><Link to="/order" className="link-underline hover:text-white transition-colors">{t('nav.order')}</Link></li>
              {role === 'admin' && (
                <li><Link to="/admin" className="link-underline hover:text-white transition-colors">{t('nav.admin')}</Link></li>
              )}
              {role === 'customer' && (
                <li><Link to="/account" className="link-underline hover:text-white transition-colors">{t('nav.account')}</Link></li>
              )}
              {!user && (
                <>
                  <li><Link to="/login" className="link-underline hover:text-white transition-colors">{t('nav.login')}</Link></li>
                  <li><Link to="/register" className="link-underline hover:text-white transition-colors">{t('nav.register')}</Link></li>
                </>
              )}
            </ul>
          </nav>

          <nav aria-label={t('legal.terms')}>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#B29259] mb-4">{t('legal.terms')}</p>
            <ul className="space-y-2.5 text-sm">
              <li><button type="button" onClick={() => openLegalModal('privacy')} className="link-underline hover:text-white transition-colors">{t('legal.privacy')}</button></li>
              <li><button type="button" onClick={() => openLegalModal('terms')} className="link-underline hover:text-white transition-colors">{t('legal.terms')}</button></li>
              <li><button type="button" onClick={() => openLegalModal('accessibility')} className="link-underline hover:text-white transition-colors">{t('legal.accessibility')}</button></li>
            </ul>
          </nav>
        </div>
        <div className="border-t border-white/10">
          <p className="max-w-5xl mx-auto px-4 py-4 text-[11px] text-[#EAE3D2]/50 text-center">
            <bdi dir="ltr">© {new Date().getFullYear()} LD EVENT DESIGN.</bdi> {t('footer.rights')}
            <br />
            <a
              href={`https://wa.me/972587170978?text=${encodeURIComponent('היי ניסן, ראיתי אתר שעיצבת ואשמח לפרטים על בניית אתר 🙂')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#EAE3D2]/70 hover:text-white underline-offset-2 hover:underline transition-colors"
            >
              {t('footer.credit')}
            </a>
          </p>
        </div>
      </footer>

      {legalModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          onClick={closeLegalModal}
        >
          <div
            ref={legalPanelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="site-legal-title"
            aria-describedby="site-legal-body"
            className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-auto p-6 shadow-xl outline-none"
            onClick={(e) => e.stopPropagation()}
            dir={dir}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 id="site-legal-title" className="text-lg font-bold text-[#8C6D3F]">{t(`legal.${legalModal}`)}</h2>
              <button type="button" onClick={closeLegalModal} aria-label={t('legal.close')} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div id="site-legal-body" className="space-y-2.5 text-sm text-gray-600 leading-relaxed">
              {tList(`legal.${legalModal}Body`).map((p, i) => <p key={i}>{p}</p>)}
            </div>
            <button type="button" onClick={closeLegalModal} className="mt-5 w-full bg-[#B29259] hover:bg-[#8C6D3F] text-white py-2.5 rounded-xl text-sm font-bold">
              {t('legal.close')}
            </button>
          </div>
        </div>
      )}

      <AccessibilityWidget onOpenStatement={() => openLegalModal('accessibility')} />
      <WhatsAppButton />
    </div>
  );
}
