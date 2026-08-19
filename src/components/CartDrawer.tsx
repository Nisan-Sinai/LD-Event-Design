import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Check, Minus, Plus, ShoppingBag, Sparkles, Trash2, X } from 'lucide-react';
import { MINIMUM_ORDER, useCart, type CartItem } from '../cart/CartProvider';
import { categoryLabel, PACKAGE_EN } from '../i18n/content';
import { useI18n, type Lang } from '../i18n/i18n';
import { localizedProductCategory, localizedProductText } from '../i18n/products';
import { QuoteNotice } from './QuoteNotice';

const COPY = {
  he: {
    invalidCoupon: 'הקוד אינו תקין.',
    closeCart: 'סגירת סל הקניות',
    dialog: 'סל הצעת מחיר',
    title: 'הסל שלי',
    close: 'סגירה',
    emptyTitle: 'הסל מחכה לעיצוב שלכם',
    emptyBody: 'בחרו פריטים או חבילה ונרכיב יחד הצעת מחיר אישית.',
    backToSelection: 'חזרה לבחירה',
    remove: (title: string) => `הסרת ${title}`,
    quantity: (title: string) => `כמות ${title}`,
    decrease: (title: string) => `הפחתת כמות ${title}`,
    increase: (title: string) => `הגדלת כמות ${title}`,
    designChoices: 'הבחירות העיצוביות שלכם',
    colors: 'צבעי האקססוריז, הפרחים או הבלונים: ',
    notEntered: 'טרם נכתבו',
    request: 'בקשה אישית: ',
    updateDesign: 'עדכון צבעים ובקשות',
    couponQuestion: 'יש לכם קוד קופון?',
    couponPlaceholder: 'הקלידו קוד',
    checking: 'בודק…',
    apply: 'הפעלה',
    couponSuccess: 'קופון התקבל! הפתעה מיוחדת מחכה לכם בשיחת הטלפון איתנו :)',
    cancel: 'ביטול',
    estimate: 'אומדן נוכחי',
    minimum: (amount: string) => `מינימום להזמנה הינו ${amount}`,
    missing: (amount: string) => `חסרים ${amount}`,
    continue: 'המשך להשלמת בחירת ההזמנה',
    minimumRequired: 'יש להגיע למינימום כדי להמשיך',
    fullCart: 'לצפייה בסל המלא'
  },
  en: {
    invalidCoupon: 'The code is invalid.',
    closeCart: 'Close shopping cart',
    dialog: 'Quote cart',
    title: 'My cart',
    close: 'Close',
    emptyTitle: 'Your cart is ready for your design',
    emptyBody: 'Choose design pieces or a package and we will build a personalized quote together.',
    backToSelection: 'Back to selection',
    remove: (title: string) => `Remove ${title}`,
    quantity: (title: string) => `Quantity of ${title}`,
    decrease: (title: string) => `Decrease quantity of ${title}`,
    increase: (title: string) => `Increase quantity of ${title}`,
    designChoices: 'Your design choices',
    colors: 'Accessory, flower or balloon colors: ',
    notEntered: 'Not entered yet',
    request: 'Custom request: ',
    updateDesign: 'Update colors and requests',
    couponQuestion: 'Have a promo code?',
    couponPlaceholder: 'Enter code',
    checking: 'Checking…',
    apply: 'Apply',
    couponSuccess: 'Promo code accepted! A special surprise is waiting for you when we speak :)',
    cancel: 'Cancel',
    estimate: 'Current estimate',
    minimum: (amount: string) => `Minimum order is ${amount}`,
    missing: (amount: string) => `${amount} still needed`,
    continue: 'Continue to complete your selection',
    minimumRequired: 'Reach the minimum order to continue',
    fullCart: 'View full cart'
  }
} as const;

function money(value: number, lang: Lang) {
  return `₪${value.toLocaleString(lang === 'he' ? 'he-IL' : 'en-US')}`;
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

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lang, dir } = useI18n();
  const copy = COPY[lang];
  const {
    items,
    subtotal,
    preferences,
    updateQuantity,
    removeItem,
    applyCoupon,
    clearCoupon
  } = useCart();
  const [couponInput, setCouponInput] = useState(preferences.couponCode);
  const [couponError, setCouponError] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const missing = Math.max(0, MINIMUM_ORDER - subtotal);
  const canContinue = items.length > 0 && missing === 0;

  useEffect(() => {
    setCouponInput(preferences.couponCode);
  }, [preferences.couponCode]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => panelRef.current?.focus(), 0);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const submitCoupon = async () => {
    if (couponBusy) return;
    setCouponBusy(true);
    setCouponError('');
    try {
      if (await applyCoupon(couponInput)) return;
      setCouponError(copy.invalidCoupon);
    } finally {
      setCouponBusy(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[110] transition ${open ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!open}>
      <button type="button" onClick={onClose} aria-label={copy.closeCart} className={`absolute inset-0 bg-[#2C2C2C]/45 backdrop-blur-sm transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} />
      <aside ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={copy.dialog} dir={dir} className={`absolute inset-y-0 end-0 flex w-full max-w-md flex-col bg-[#FDFBF7] shadow-[-28px_0_80px_rgba(44,44,44,0.22)] outline-none transition-transform duration-500 ease-out ${open ? 'translate-x-0' : 'translate-x-full rtl:-translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-[#E8C5B8]/70 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#B8860B]">LD Event Design</p>
            <h2 className="font-display mt-1 flex items-center gap-2 text-xl font-black text-[#2C2C2C]">
              <ShoppingBag className="h-5 w-5 text-[#B8860B]" aria-hidden="true" /> {copy.title}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label={copy.close} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#6C625A] shadow-sm transition hover:rotate-90 hover:text-[#2C2C2C]"><X className="h-5 w-5" aria-hidden="true" /></button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {items.length === 0 ? (
            <div className="py-14 text-center">
              <ShoppingBag className="mx-auto h-12 w-12 text-[#E8C5B8]" aria-hidden="true" />
              <h3 className="font-display mt-4 text-xl font-black text-[#2C2C2C]">{copy.emptyTitle}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6C625A]">{copy.emptyBody}</p>
              <button type="button" onClick={onClose} className="mt-5 rounded-full bg-[#B8860B] px-6 py-2.5 text-sm font-bold text-white">{copy.backToSelection}</button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {items.map((item) => {
                  const text = localizedCartItem(item, lang);
                  return (
                    <article key={item.id} className="rounded-3xl border border-[#E8C5B8]/70 bg-white p-4 shadow-sm">
                      <div className="flex gap-3">
                        {item.image && <img src={item.image} alt="" className="h-20 w-20 shrink-0 rounded-2xl object-cover" />}
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#B8860B]">{text.category}</p>
                          <h3 className="mt-1 truncate text-sm font-extrabold text-[#2C2C2C]">{text.title}</h3>
                          <p className="mt-1 font-black text-[#B8860B]">{money(item.price * item.quantity, lang)}</p>
                        </div>
                        <button type="button" onClick={() => removeItem(item.id)} aria-label={copy.remove(text.title)} className="self-start rounded-full p-2 text-[#9B8A7D] transition hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                      </div>
                      <div className="mt-3 inline-flex items-center rounded-full border border-[#E8C5B8] bg-[#FAF6F0]" role="group" aria-label={copy.quantity(text.title)}>
                        <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={copy.decrease(text.title)} className="p-2 text-[#B8860B]"><Minus className="h-3.5 w-3.5" aria-hidden="true" /></button>
                        <span className="min-w-8 text-center text-xs font-bold">{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={copy.increase(text.title)} className="p-2 text-[#B8860B]"><Plus className="h-3.5 w-3.5" aria-hidden="true" /></button>
                      </div>
                    </article>
                  );
                })}
              </div>

              <section className="rounded-3xl border border-[#E8C5B8]/70 bg-[#FAF6F0] p-4">
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#2C2C2C]"><Sparkles className="h-4 w-4 text-[#B8860B]" aria-hidden="true" />{copy.designChoices}</h3>
                <dl className="mt-3 space-y-2 text-xs leading-relaxed text-[#6C625A]">
                  <div><dt className="inline font-bold text-[#2C2C2C]">{copy.colors}</dt><dd className="inline whitespace-pre-wrap">{preferences.customColors || copy.notEntered}</dd></div>
                  {preferences.customRequest && <div><dt className="inline font-bold text-[#2C2C2C]">{copy.request}</dt><dd className="inline">{preferences.customRequest}</dd></div>}
                </dl>
                <Link to="/#design-details" onClick={onClose} className="mt-3 inline-flex text-xs font-extrabold text-[#B8860B] underline-offset-4 hover:underline">{copy.updateDesign}</Link>
              </section>

              <section className="rounded-3xl border border-[#E8C5B8]/70 bg-white p-4">
                <label htmlFor="drawer-coupon" className="text-xs font-extrabold text-[#2C2C2C]">{copy.couponQuestion}</label>
                <div className="mt-2 flex gap-2">
                  <input id="drawer-coupon" value={couponInput} onChange={(event) => { setCouponInput(event.target.value); setCouponError(''); }} placeholder={copy.couponPlaceholder} className="min-w-0 flex-1 rounded-full border border-[#E8C5B8] px-4 py-2.5 text-sm outline-none focus:border-[#B8860B]" />
                  <button type="button" onClick={() => void submitCoupon()} disabled={couponBusy} className="rounded-full bg-[#2C2C2C] px-4 py-2.5 text-xs font-bold text-white disabled:cursor-wait disabled:opacity-60">{couponBusy ? copy.checking : copy.apply}</button>
                </div>
                {preferences.couponApplied && (
                  <div role="status" className="mt-3 flex items-start gap-2 rounded-2xl bg-emerald-50 p-3 text-xs font-bold leading-relaxed text-emerald-800">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {copy.couponSuccess}
                    <button type="button" onClick={() => { clearCoupon(); setCouponInput(''); }} className="ms-auto shrink-0 underline">{copy.cancel}</button>
                  </div>
                )}
                {couponError && <p role="alert" className="mt-2 text-xs font-bold text-red-600">{couponError}</p>}
              </section>
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-[#E8C5B8]/70 bg-white/95 px-5 py-5 backdrop-blur">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div><p className="text-xs text-[#6C625A]">{copy.estimate}</p><strong className="font-display text-2xl font-black text-[#B8860B]">{money(subtotal, lang)}</strong></div>
              {missing > 0 && <p className="max-w-[190px] text-end text-xs font-bold leading-relaxed text-[#8A5A44]">{copy.minimum(money(MINIMUM_ORDER, lang))}<br />{copy.missing(money(missing, lang))}</p>}
            </div>
            <QuoteNotice compact />
            {canContinue ? (
              <Link to="/checkout" onClick={onClose} className="mt-4 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#C69A71] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5">{copy.continue}</Link>
            ) : (
              <button type="button" disabled className="mt-4 w-full cursor-not-allowed rounded-full bg-[#E9E4DE] px-5 py-3.5 text-sm font-extrabold text-[#9B8A7D]">{copy.minimumRequired}</button>
            )}
            <Link to="/cart" onClick={onClose} className="mt-3 block text-center text-xs font-bold text-[#B8860B] underline-offset-4 hover:underline">{copy.fullCart}</Link>
          </div>
        )}
      </aside>
    </div>
  );
}
