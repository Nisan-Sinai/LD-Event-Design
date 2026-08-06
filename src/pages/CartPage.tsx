import { Link } from 'react-router';
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Trash2, Truck } from 'lucide-react';
import { ArtDefsHost, renderPackageSVG } from '../App';
import { MINIMUM_ORDER, useCart } from '../cart/CartProvider';
import { useI18n } from '../i18n/i18n';
import { DELIVERY_FEE } from '../lib/pricing';

const COPY = {
  he: {
    title: 'עגלת הקניות שלך',
    emptyTitle: 'העגלה עדיין ריקה',
    emptyBody: 'בוחרים חבילה או עיצוב, מוסיפים לסל וממשיכים להזמנה פשוטה.',
    back: 'חזרה לחנות',
    remove: 'הסרה',
    quantity: 'כמות',
    subtotal: 'סכום ביניים',
    delivery: 'הובלה, הקמה ופירוק',
    total: 'סה״כ לתשלום',
    minimum: 'מינימום הזמנה',
    missing: 'חסרים להשלמת מינימום ההזמנה',
    checkout: 'המשך לפרטים ותשלום',
    clear: 'ריקון העגלה',
    guest: 'אין צורך בהרשמה. ממלאים פרטים ומסיימים.',
    cartLabel: 'עגלת קניות'
  },
  en: {
    title: 'Your shopping cart',
    emptyTitle: 'Your cart is empty',
    emptyBody: 'Choose a package, add it to the cart and continue to a simple checkout.',
    back: 'Back to shop',
    remove: 'Remove',
    quantity: 'Quantity',
    subtotal: 'Subtotal',
    delivery: 'Delivery, setup and collection',
    total: 'Total',
    minimum: 'Minimum order',
    missing: 'Still needed to reach the minimum order',
    checkout: 'Continue to checkout',
    clear: 'Clear cart',
    guest: 'No registration required. Enter your details and finish.',
    cartLabel: 'Shopping cart'
  }
} as const;

function money(value: number) {
  return `₪${value.toLocaleString()}`;
}

export function CartPage() {
  const { lang } = useI18n();
  const copy = COPY[lang];
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const Arrow = lang === 'he' ? ArrowLeft : ArrowRight;
  const minimumMissing = Math.max(0, MINIMUM_ORDER - subtotal);
  const canCheckout = items.length > 0 && minimumMissing === 0;
  const total = subtotal + (items.length > 0 ? DELIVERY_FEE : 0);

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F3EBDD] text-[#8C6D3F]">
          <ShoppingBag className="h-8 w-8" aria-hidden="true" />
        </div>
        <h2 className="font-display mt-6 text-3xl font-extrabold text-gray-900">{copy.emptyTitle}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-600">{copy.emptyBody}</p>
        <Link to="/#packages" className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-[#8C6D3F] px-6 py-3 text-sm font-bold text-white hover:bg-[#6d5430]">
          {copy.back}
          <Arrow className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    );
  }

  return (
    <section className="bg-[#FAF7F2] py-10 sm:py-14" aria-label={copy.cartLabel}>
      <ArtDefsHost />
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#B29259]">LD Event Design</p>
            <h2 className="font-display mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">{copy.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{copy.guest}</p>
          </div>
          <button type="button" onClick={clearCart} className="text-sm font-bold text-red-600 underline-offset-4 hover:underline">
            {copy.clear}
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            {items.map((item) => (
              <article key={item.id} className="grid gap-4 rounded-3xl border border-[#EAE3D2] bg-white p-4 sm:grid-cols-[150px_1fr] sm:p-5">
                <div className="flex min-h-28 items-center justify-center overflow-hidden rounded-2xl border border-[#EAE3D2] bg-[#FAF7F2] p-2">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="h-28 w-full rounded-xl object-cover" />
                  ) : (
                    <div className="w-full">{renderPackageSVG(item.svgType)}</div>
                  )}
                </div>

                <div className="flex min-w-0 flex-col justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B29259]">{item.category}</p>
                    <h3 className="mt-1 text-lg font-bold text-gray-900">{item.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">{item.subtitle}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center rounded-xl border border-[#EAE3D2] bg-[#FAF7F2]" role="group" aria-label={`${copy.quantity}: ${item.title}`}>
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`הפחתת כמות ${item.title}`} className="p-2 text-[#8C6D3F] hover:bg-white">
                        <Minus className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <span className="min-w-9 text-center text-sm font-bold" aria-live="polite">{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`הגדלת כמות ${item.title}`} className="p-2 text-[#8C6D3F] hover:bg-white">
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <strong className="text-lg text-[#8C6D3F]">{money(item.price * item.quantity)}</strong>
                      <button type="button" onClick={() => removeItem(item.id)} className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:underline">
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        {copy.remove}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="h-fit rounded-3xl border border-[#EAE3D2] bg-white p-6 shadow-warm lg:sticky lg:top-24">
            <h3 className="font-display text-xl font-extrabold text-gray-900">{copy.total}</h3>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-3 text-gray-600">
                <dt>{copy.subtotal}</dt>
                <dd className="font-bold text-gray-900">{money(subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-3 text-gray-600">
                <dt className="inline-flex items-center gap-1.5"><Truck className="h-4 w-4" aria-hidden="true" />{copy.delivery}</dt>
                <dd className="font-bold text-gray-900">{money(DELIVERY_FEE)}</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-[#EAE3D2] pt-4 text-base">
                <dt className="font-extrabold text-gray-900">{copy.total}</dt>
                <dd className="font-black text-[#8C6D3F]">{money(total)}</dd>
              </div>
            </dl>

            <div className={`mt-5 rounded-2xl border p-4 text-xs font-bold ${canCheckout ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
              <p>{copy.minimum}: {money(MINIMUM_ORDER)}</p>
              {!canCheckout && <p className="mt-1">{copy.missing}: {money(minimumMissing)}</p>}
            </div>

            {canCheckout ? (
              <Link to="/checkout" className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#8C6D3F] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#6d5430]">
                {copy.checkout}
                <Arrow className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <button type="button" disabled className="mt-5 w-full cursor-not-allowed rounded-2xl bg-gray-200 px-5 py-3.5 text-sm font-bold text-gray-500">
                {copy.checkout}
              </button>
            )}

            <Link to="/#packages" className="mt-3 flex w-full items-center justify-center text-xs font-bold text-[#8C6D3F] hover:underline">
              {copy.back}
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
