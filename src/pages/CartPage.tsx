import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowRight, Check, Minus, Palette, Plus, ShoppingBag, Sparkles, Trash2 } from 'lucide-react';
import { ArtDefsHost, renderPackageSVG } from '../App';
import { GIFT_COUPON, MINIMUM_ORDER, useCart } from '../cart/CartProvider';
import { QuoteNotice } from '../components/QuoteNotice';
import { useI18n } from '../i18n/i18n';

const COPY = {
  he: {
    title: 'סל העיצוב שלכם',
    emptyTitle: 'העגלה עדיין ריקה',
    emptyBody: 'בחרו חבילה או פריט עיצוב, הוסיפו לסל והתחילו לבנות את האירוע שלכם.',
    back: 'חזרה לחנות',
    remove: 'הסרה',
    quantity: 'כמות',
    subtotal: 'אומדן נוכחי',
    total: 'סה״כ אומדן',
    minimum: 'מינימום להזמנה הינו 2,900 ש״ח',
    missing: 'חסרים להשלמת מינימום ההזמנה',
    checkout: 'המשך לשליחת הצעת מחיר',
    clear: 'ריקון העגלה',
    guest: 'אין צורך בהרשמה. בוחרים, ממלאים פרטים ושולחים בקשה להצעת מחיר בלבד.',
    cartLabel: 'עגלת קניות',
    flowerColor: 'גוון לפרחים',
    balloonColor: 'גוון לבלונים',
    tableclothColor: 'גוון למפות וטקסטיל',
    notSelected: 'טרם נבחר — נסגור יחד בהמשך',
    request: 'בקשה עיצובית אישית',
    coupon: 'קוד קופון',
    apply: 'הפעלת קופון'
  },
  en: {
    title: 'Your design cart',
    emptyTitle: 'Your cart is empty',
    emptyBody: 'Choose a package or design item and start building your celebration.',
    back: 'Back to shop',
    remove: 'Remove',
    quantity: 'Quantity',
    subtotal: 'Current estimate',
    total: 'Estimated total',
    minimum: 'Minimum order is ₪2,900',
    missing: 'Still needed to reach the minimum order',
    checkout: 'Continue to quote request',
    clear: 'Clear cart',
    guest: 'No registration required. Choose, enter details and request a quote with no payment.',
    cartLabel: 'Shopping cart',
    flowerColor: 'Flower shade',
    balloonColor: 'Balloon shade',
    tableclothColor: 'Table linen shade',
    notSelected: 'Not selected yet — we can refine it together',
    request: 'Custom design request',
    coupon: 'Promo code',
    apply: 'Apply code'
  }
} as const;

function money(value: number) {
  return `₪${value.toLocaleString('he-IL')}`;
}

export function CartPage() {
  const { t, lang } = useI18n();
  const copy = COPY[lang];
  const {
    items,
    subtotal,
    preferences,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    clearCoupon
  } = useCart();
  const [couponInput, setCouponInput] = useState(preferences.couponCode);
  const [couponError, setCouponError] = useState('');
  const Arrow = lang === 'he' ? ArrowLeft : ArrowRight;
  const minimumMissing = Math.max(0, MINIMUM_ORDER - subtotal);
  const canCheckout = items.length > 0 && minimumMissing === 0;

  const submitCoupon = () => {
    if (applyCoupon(couponInput)) {
      setCouponError('');
      return;
    }
    setCouponError(t('cart.couponInvalid', { code: GIFT_COUPON }));
  };

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#F4E3E3] text-[#B8860B]">
          <ShoppingBag className="h-9 w-9" aria-hidden="true" />
        </div>
        <h2 className="font-display mt-6 text-4xl font-black text-[#2C2C2C]">{copy.emptyTitle}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#6C625A]">{copy.emptyBody}</p>
        <Link to="/#packages" className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#B8860B] to-[#D4AF37] px-7 py-3.5 text-sm font-extrabold text-white shadow-lg">
          {copy.back}
          <Arrow className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    );
  }

  return (
    <section className="bg-[#FAF6F0] py-10 sm:py-16" aria-label={copy.cartLabel}>
      <ArtDefsHost />
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#B8860B]">LD Event Design</p>
            <h2 className="font-display mt-2 text-4xl font-black text-[#2C2C2C] sm:text-5xl">{copy.title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6C625A]">{copy.guest}</p>
          </div>
          <button type="button" onClick={clearCart} className="text-sm font-bold text-red-600 underline-offset-4 hover:underline">
            {copy.clear}
          </button>
        </div>

        <div className="grid gap-7 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {items.map((item) => (
              <article key={item.id} className="grid gap-4 rounded-[2rem] border border-[#E8C5B8]/70 bg-white p-4 shadow-sm sm:grid-cols-[150px_1fr] sm:p-5">
                <div className="flex min-h-32 items-center justify-center overflow-hidden rounded-[1.5rem] bg-[#F4E3E3] p-2">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="h-32 w-full rounded-2xl object-cover" />
                  ) : (
                    <div className="w-full">{renderPackageSVG(item.svgType)}</div>
                  )}
                </div>

                <div className="flex min-w-0 flex-col justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#B8860B]">{item.category}</p>
                    <h3 className="font-display mt-1 text-xl font-black text-[#2C2C2C]">{item.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-[#766C65]">{item.subtitle}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center rounded-full border border-[#E8C5B8] bg-[#FAF6F0]" role="group" aria-label={`${copy.quantity}: ${item.title}`}>
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`הפחתת כמות ${item.title}`} className="p-2.5 text-[#B8860B] hover:bg-white">
                        <Minus className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <span className="min-w-10 text-center text-sm font-bold" aria-live="polite">{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`הגדלת כמות ${item.title}`} className="p-2.5 text-[#B8860B] hover:bg-white">
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <strong className="font-display text-xl font-black text-[#B8860B]">{money(item.price * item.quantity)}</strong>
                      <button type="button" onClick={() => removeItem(item.id)} aria-label={copy.remove} className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:underline">
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        {copy.remove}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            <section className="rounded-[2rem] border border-[#E8C5B8]/70 bg-white p-5 sm:p-6">
              <h3 className="flex items-center gap-2 font-display text-xl font-black text-[#2C2C2C]"><Palette className="h-5 w-5 text-[#B8860B]" aria-hidden="true" />הבחירות העיצוביות שלכם</h3>
              <dl className="mt-4 grid gap-3 text-sm text-[#6C625A] sm:grid-cols-3">
                <div className="rounded-2xl bg-[#FAF6F0] p-4"><dt className="font-extrabold text-[#2C2C2C]">{copy.flowerColor}</dt><dd className="mt-1">{preferences.flowerColor || copy.notSelected}</dd></div>
                <div className="rounded-2xl bg-[#FAF6F0] p-4"><dt className="font-extrabold text-[#2C2C2C]">{copy.balloonColor}</dt><dd className="mt-1">{preferences.balloonColor || copy.notSelected}</dd></div>
                <div className="rounded-2xl bg-[#FAF6F0] p-4"><dt className="font-extrabold text-[#2C2C2C]">{copy.tableclothColor}</dt><dd className="mt-1">{preferences.tableclothColor || copy.notSelected}</dd></div>
                <div className="rounded-2xl bg-[#FAF6F0] p-4 sm:col-span-3"><dt className="font-extrabold text-[#2C2C2C]">{copy.request}</dt><dd className="mt-1 whitespace-pre-wrap">{preferences.customRequest || 'לא נוספה בקשה מיוחדת'}</dd></div>
              </dl>
              <Link to="/#design-details" className="mt-4 inline-flex items-center gap-2 text-xs font-extrabold text-[#B8860B] hover:underline"><Sparkles className="h-4 w-4" aria-hidden="true" />עדכון בחירות העיצוב</Link>
            </section>
          </div>

          <aside className="h-fit rounded-[2rem] border border-[#E8C5B8]/70 bg-white p-6 shadow-[0_24px_65px_rgba(44,44,44,0.1)] lg:sticky lg:top-24">
            <h3 className="font-display text-2xl font-black text-[#2C2C2C]">{copy.total}</h3>
            <div className="mt-5 flex justify-between gap-3 border-b border-[#E8C5B8]/60 pb-4 text-sm">
              <span className="text-[#6C625A]">{copy.subtotal}</span>
              <strong className="font-display text-2xl font-black text-[#B8860B]">{money(subtotal)}</strong>
            </div>

            <div className="mt-5">
              <label htmlFor="cart-coupon" className="text-xs font-extrabold text-[#2C2C2C]">{copy.coupon}</label>
              <div className="mt-2 flex gap-2">
                <input id="cart-coupon" value={couponInput} onChange={(event) => { setCouponInput(event.target.value); setCouponError(''); }} placeholder="הקלידו קוד" className="min-w-0 flex-1 rounded-full border border-[#E8C5B8] px-4 py-2.5 text-sm outline-none focus:border-[#B8860B]" />
                <button type="button" onClick={submitCoupon} className="rounded-full bg-[#2C2C2C] px-4 py-2.5 text-xs font-bold text-white">{copy.apply}</button>
              </div>
              {preferences.couponApplied && (
                <div role="status" className="mt-3 flex items-start gap-2 rounded-2xl bg-emerald-50 p-3 text-xs font-bold leading-relaxed text-emerald-800">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />קופון התקבל! מתנה מפתיעה מחכה לכם בשיחת הטלפון איתנו :)
                  <button type="button" onClick={() => { clearCoupon(); setCouponInput(''); }} className="ms-auto underline">ביטול</button>
                </div>
              )}
              {couponError && <p role="alert" className="mt-2 text-xs font-bold text-red-600">{couponError}</p>}
            </div>

            <div className={`mt-5 rounded-2xl border p-4 text-xs font-bold leading-relaxed ${canCheckout ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-[#E8C5B8] bg-[#F4E3E3] text-[#7A493D]'}`}>
              <p>{copy.minimum}</p>
              {!canCheckout && <p className="mt-1">{copy.missing}: {money(minimumMissing)}</p>}
            </div>

            <div className="mt-5"><QuoteNotice compact /></div>

            {canCheckout ? (
              <Link to="/checkout" className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#C69A71] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5">
                {copy.checkout}
                <Arrow className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <button type="button" disabled className="mt-5 w-full cursor-not-allowed rounded-full bg-[#E8E3DE] px-5 py-3.5 text-sm font-extrabold text-[#9B8A7D]">
                {copy.checkout}
              </button>
            )}

            <Link to="/#packages" className="mt-4 flex w-full items-center justify-center text-xs font-bold text-[#B8860B] hover:underline">
              {copy.back}
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
