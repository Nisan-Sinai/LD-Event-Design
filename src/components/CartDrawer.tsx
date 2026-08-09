import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Check, Minus, Plus, ShoppingBag, Sparkles, Trash2, X } from 'lucide-react';
import { MINIMUM_ORDER, useCart } from '../cart/CartProvider';
import { QuoteNotice } from './QuoteNotice';

function money(value: number) {
  return `₪${value.toLocaleString('he-IL')}`;
}

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
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
      setCouponError('הקוד אינו תקין.');
    } finally {
      setCouponBusy(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[110] transition ${open ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!open}>
      <button type="button" onClick={onClose} aria-label="סגירת סל הקניות" className={`absolute inset-0 bg-[#2C2C2C]/45 backdrop-blur-sm transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} />
      <aside ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="סל הצעת מחיר" className={`absolute inset-y-0 end-0 flex w-full max-w-md flex-col bg-[#FDFBF7] shadow-[-28px_0_80px_rgba(44,44,44,0.22)] outline-none transition-transform duration-500 ease-out ${open ? 'translate-x-0' : 'translate-x-full rtl:-translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-[#E8C5B8]/70 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#B8860B]">LD Event Design</p>
            <h2 className="font-display mt-1 flex items-center gap-2 text-xl font-black text-[#2C2C2C]">
              <ShoppingBag className="h-5 w-5 text-[#B8860B]" aria-hidden="true" /> הסל שלי
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="סגירה" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#6C625A] shadow-sm transition hover:rotate-90 hover:text-[#2C2C2C]"><X className="h-5 w-5" aria-hidden="true" /></button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {items.length === 0 ? (
            <div className="py-14 text-center">
              <ShoppingBag className="mx-auto h-12 w-12 text-[#E8C5B8]" aria-hidden="true" />
              <h3 className="font-display mt-4 text-xl font-black text-[#2C2C2C]">הסל מחכה לעיצוב שלכם</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6C625A]">בחרו פריטים או חבילה ונרכיב יחד הצעת מחיר אישית.</p>
              <button type="button" onClick={onClose} className="mt-5 rounded-full bg-[#B8860B] px-6 py-2.5 text-sm font-bold text-white">חזרה לבחירה</button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {items.map((item) => (
                  <article key={item.id} className="rounded-3xl border border-[#E8C5B8]/70 bg-white p-4 shadow-sm">
                    <div className="flex gap-3">
                      {item.image && <img src={item.image} alt="" className="h-20 w-20 shrink-0 rounded-2xl object-cover" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#B8860B]">{item.category}</p>
                        <h3 className="mt-1 truncate text-sm font-extrabold text-[#2C2C2C]">{item.title}</h3>
                        <p className="mt-1 font-black text-[#B8860B]">{money(item.price * item.quantity)}</p>
                      </div>
                      <button type="button" onClick={() => removeItem(item.id)} aria-label={`הסרת ${item.title}`} className="self-start rounded-full p-2 text-[#9B8A7D] transition hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                    </div>
                    <div className="mt-3 inline-flex items-center rounded-full border border-[#E8C5B8] bg-[#FAF6F0]" role="group" aria-label={`כמות ${item.title}`}>
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`הפחתת כמות ${item.title}`} className="p-2 text-[#B8860B]"><Minus className="h-3.5 w-3.5" aria-hidden="true" /></button>
                      <span className="min-w-8 text-center text-xs font-bold">{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`הגדלת כמות ${item.title}`} className="p-2 text-[#B8860B]"><Plus className="h-3.5 w-3.5" aria-hidden="true" /></button>
                    </div>
                  </article>
                ))}
              </div>

              <section className="rounded-3xl border border-[#E8C5B8]/70 bg-[#FAF6F0] p-4">
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#2C2C2C]"><Sparkles className="h-4 w-4 text-[#B8860B]" aria-hidden="true" />הבחירות העיצוביות שלכם</h3>
                <dl className="mt-3 space-y-2 text-xs leading-relaxed text-[#6C625A]">
                  <div><dt className="inline font-bold text-[#2C2C2C]">צבעי האקססוריז, הפרחים או הבלונים: </dt><dd className="inline whitespace-pre-wrap">{preferences.customColors || 'טרם נכתבו'}</dd></div>
                  {preferences.customRequest && <div><dt className="inline font-bold text-[#2C2C2C]">בקשה אישית: </dt><dd className="inline">{preferences.customRequest}</dd></div>}
                </dl>
                <Link to="/#design-details" onClick={onClose} className="mt-3 inline-flex text-xs font-extrabold text-[#B8860B] underline-offset-4 hover:underline">עדכון צבעים ובקשות</Link>
              </section>

              <section className="rounded-3xl border border-[#E8C5B8]/70 bg-white p-4">
                <label htmlFor="drawer-coupon" className="text-xs font-extrabold text-[#2C2C2C]">יש לכם קוד קופון?</label>
                <div className="mt-2 flex gap-2">
                  <input id="drawer-coupon" value={couponInput} onChange={(event) => { setCouponInput(event.target.value); setCouponError(''); }} placeholder="הקלידו קוד" className="min-w-0 flex-1 rounded-full border border-[#E8C5B8] px-4 py-2.5 text-sm outline-none focus:border-[#B8860B]" />
                  <button type="button" onClick={() => void submitCoupon()} disabled={couponBusy} className="rounded-full bg-[#2C2C2C] px-4 py-2.5 text-xs font-bold text-white disabled:cursor-wait disabled:opacity-60">{couponBusy ? 'בודק…' : 'הפעלה'}</button>
                </div>
                {preferences.couponApplied && (
                  <div role="status" className="mt-3 flex items-start gap-2 rounded-2xl bg-emerald-50 p-3 text-xs font-bold leading-relaxed text-emerald-800">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> קופון התקבל! הפתעה מיוחדת מחכה לכם בשיחת הטלפון איתנו :)
                    <button type="button" onClick={() => { clearCoupon(); setCouponInput(''); }} className="ms-auto shrink-0 underline">ביטול</button>
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
              <div><p className="text-xs text-[#6C625A]">אומדן נוכחי</p><strong className="font-display text-2xl font-black text-[#B8860B]">{money(subtotal)}</strong></div>
              {missing > 0 && <p className="max-w-[190px] text-end text-xs font-bold leading-relaxed text-[#8A5A44]">מינימום להזמנה הינו {money(MINIMUM_ORDER)}<br />חסרים {money(missing)}</p>}
            </div>
            <QuoteNotice compact />
            {canContinue ? (
              <Link to="/checkout" onClick={onClose} className="mt-4 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#C69A71] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5">המשך להשלמת בחירת ההזמנה</Link>
            ) : (
              <button type="button" disabled className="mt-4 w-full cursor-not-allowed rounded-full bg-[#E9E4DE] px-5 py-3.5 text-sm font-extrabold text-[#9B8A7D]">יש להגיע למינימום כדי להמשיך</button>
            )}
            <Link to="/cart" onClick={onClose} className="mt-3 block text-center text-xs font-bold text-[#B8860B] underline-offset-4 hover:underline">לצפייה בסל המלא</Link>
          </div>
        )}
      </aside>
    </div>
  );
}
