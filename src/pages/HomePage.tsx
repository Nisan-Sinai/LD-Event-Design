import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Gift,
  MessageCircle,
  PackageOpen,
  ShoppingBag,
  Sparkles,
  Truck
} from 'lucide-react';
import { ArtDefsHost, CATEGORIES, PACKAGES, renderPackageSVG, type Package } from '../App';
import { MINIMUM_ORDER, useCart } from '../cart/CartProvider';
import { useI18n } from '../i18n/i18n';
import { categoryLabel, PACKAGE_EN } from '../i18n/content';
import { buildCatalog } from '../lib/packages';
import { DELIVERY_FEE } from '../lib/pricing';
import { usePackages } from '../packages/PackagesProvider';

const COPY = {
  he: {
    minimum: 'מינימום הזמנה',
    delivery: 'הובלה, הקמה ופירוק',
    heroKicker: 'עיצוב אירועים שמזמינים בקליק',
    heroLine1: 'בוחרים עיצוב.',
    heroAccent: 'מוסיפים לסל.',
    heroLine2: 'ומסיימים.',
    heroBody: 'בדיוק כמו בחנות: בוחרים חבילות ועיצובים, מוסיפים לעגלה וממלאים פרטים. בלי הרשמה כפויה ובלי תהליך מסורבל.',
    shop: 'לבחירת חבילות',
    cart: 'לצפייה בעגלה',
    whatsapp: 'שאלה בוואטסאפ',
    step1: '1. בוחרים',
    step1Body: 'עוברים בין הקטגוריות ובוחרים את העיצוב שמתאים לאירוע.',
    step2: '2. מוסיפים לסל',
    step2Body: 'מוסיפים חבילה אחת או כמה חבילות, ומשנים כמויות בעגלה.',
    step3: '3. מזמינים',
    step3Body: 'ממלאים פרטי אירוע ושולחים הזמנה — ללא פתיחת חשבון.',
    catalogKicker: 'החנות של LD Event Design',
    catalogTitle: 'בוחרים ומוסיפים לסל',
    catalogBody: 'כל המחירים מוצגים מראש. אפשר לפתוח פירוט, לבחור כמה פריטים ולהמשיך לעגלה.',
    from: 'החל מ־',
    tiers: 'אפשרויות מחיר',
    details: 'מה כלול בחבילה?',
    add: 'הוספה לסל',
    added: 'נוסף לסל',
    benefit: 'הטבה',
    noRegistration: 'לא צריך להירשם כדי לבצע הזמנה.',
    ctaTitle: 'סיימתם לבחור? העגלה מחכה לכם.',
    ctaBody: 'בודקים את הפריטים, מעדכנים כמויות וממשיכים להזמנה פשוטה.',
    item: 'פריט',
    items: 'פריטים'
  },
  en: {
    minimum: 'Minimum order',
    delivery: 'Delivery, setup and collection',
    heroKicker: 'Event design ordered in a click',
    heroLine1: 'Choose a design.',
    heroAccent: 'Add it to cart.',
    heroLine2: 'And finish.',
    heroBody: 'Just like a regular shop: choose packages, add them to your cart and enter your details. No forced registration and no complicated process.',
    shop: 'Browse packages',
    cart: 'View cart',
    whatsapp: 'WhatsApp us',
    step1: '1. Choose',
    step1Body: 'Browse the categories and select the design that fits your event.',
    step2: '2. Add to cart',
    step2Body: 'Add one or several packages and update quantities in the cart.',
    step3: '3. Order',
    step3Body: 'Enter the event details and submit — no account required.',
    catalogKicker: 'LD Event Design shop',
    catalogTitle: 'Choose and add to cart',
    catalogBody: 'Prices are shown in advance. Open the details, choose several items and continue to your cart.',
    from: 'From',
    tiers: 'Price options',
    details: 'What is included?',
    add: 'Add to cart',
    added: 'Added to cart',
    benefit: 'Benefit',
    noRegistration: 'No registration is required to place an order.',
    ctaTitle: 'Finished choosing? Your cart is ready.',
    ctaBody: 'Review the items, update quantities and continue to a simple checkout.',
    item: 'item',
    items: 'items'
  }
} as const;

function money(value: number) {
  return `₪${value.toLocaleString()}`;
}

export function HomePage() {
  const { lang } = useI18n();
  const copy = COPY[lang];
  const { overrides } = usePackages();
  const { addItem, itemCount, subtotal } = useCart();
  const [addedId, setAddedId] = useState('');
  const Arrow = lang === 'he' ? ArrowLeft : ArrowRight;

  const packages = useMemo(() => buildCatalog(PACKAGES, overrides), [overrides]);
  const categories = Object.values(CATEGORIES);
  const byCategory = categories.map((category) => ({
    category,
    packages: packages.filter((pkg) => pkg.category === category)
  }));

  const pkgText = (pkg: Package) =>
    lang === 'en' && PACKAGE_EN[pkg.id]
      ? {
          title: PACKAGE_EN[pkg.id].title,
          subtitle: PACKAGE_EN[pkg.id].subtitle,
          benefits: PACKAGE_EN[pkg.id].benefits
        }
      : { title: pkg.title, subtitle: pkg.subtitle, benefits: pkg.benefits };

  const highlights = (pkg: Package) =>
    Object.values(pkg.details)
      .flatMap((items) => items ?? [])
      .slice(0, 5);

  const handleAdd = (pkg: Package) => {
    const text = pkgText(pkg);
    addItem({
      id: pkg.id,
      title: text.title,
      subtitle: text.subtitle,
      category: categoryLabel(pkg.category, lang),
      price: pkg.price,
      image: pkg.image,
      svgType: pkg.svgType
    });
    setAddedId(pkg.id);
  };

  const cartLabel = `${itemCount} ${itemCount === 1 ? copy.item : copy.items}`;

  return (
    <>
      <ArtDefsHost />

      <section aria-label={copy.minimum} className="border-b border-[#EAE3D2] bg-[#2c241a] text-[#F7F0E4]">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-1 px-4 py-2.5 text-center text-xs font-bold sm:flex-row sm:gap-6">
          <span>{copy.minimum}: <bdi dir="ltr">{money(MINIMUM_ORDER)}</bdi></span>
          <span aria-hidden="true" className="hidden h-3 w-px bg-white/30 sm:block" />
          <span className="inline-flex items-center gap-1.5 text-[#EAE3D2]/85">
            <Truck className="h-3.5 w-3.5" aria-hidden="true" />
            {copy.delivery}: <bdi dir="ltr">{money(DELIVERY_FEE)}</bdi>
          </span>
        </div>
      </section>

      <section className="hero-glow relative overflow-hidden bg-white pb-16 pt-12 sm:pt-16">
        <div className="float-slow pointer-events-none absolute -end-32 -top-32 h-96 w-96 rounded-full bg-[#B29259]/15 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 px-4 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.32em] text-gray-500">
              <span className="divider-gold" aria-hidden="true" />
              {copy.heroKicker}
            </div>
            <h2 className="font-display mt-6 text-[clamp(2.6rem,7vw,4.8rem)] font-extrabold leading-[1.02] tracking-tight text-gray-900">
              {copy.heroLine1}
              <br />
              <span className="italic text-[#B29259]">{copy.heroAccent}</span>
              <br />
              {copy.heroLine2}
            </h2>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg">{copy.heroBody}</p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a href="#packages" className="sheen inline-flex items-center gap-2 rounded-2xl bg-[#8C6D3F] px-7 py-3.5 text-sm font-bold text-white shadow-warm hover:bg-[#6d5430]">
                {copy.shop}
                <Arrow className="h-4 w-4" aria-hidden="true" />
              </a>
              <Link to="/cart" className="inline-flex items-center gap-2 rounded-2xl border border-[#B29259] bg-white px-7 py-3.5 text-sm font-bold text-[#8C6D3F] hover:bg-[#FAF7F2]">
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                {copy.cart} · {cartLabel}
              </Link>
              <a href="https://wa.me/972545740423" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-3.5 text-sm font-bold text-gray-600 hover:text-[#25D366]">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                {copy.whatsapp}
              </a>
            </div>
            <p className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {copy.noRegistration}
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="relative">
              <div className="flex aspect-[4/5] flex-col items-center justify-center gap-10 overflow-hidden rounded-[2.5rem] border border-[#EAE3D2] bg-[#FAF7F2] p-6 shadow-warm">
                <div className="w-full origin-center scale-[1.45]">{renderPackageSVG('chuppah-drapes')}</div>
                <div className="w-full origin-center scale-[1.15] opacity-90">{renderPackageSVG('bar')}</div>
              </div>
              <div className="absolute -bottom-6 end-6 rounded-2xl border border-[#EAE3D2] bg-white px-5 py-3 shadow-warm">
                <div className="text-[10px] font-medium uppercase tracking-[0.28em] text-gray-400">{copy.cart}</div>
                <div className="font-display text-base font-bold text-gray-900">{cartLabel} · {money(subtotal)}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#EAE3D2] bg-[#FAF7F2] py-10">
        <div className="mx-auto grid max-w-5xl gap-5 px-4 sm:grid-cols-3">
          {[
            { icon: PackageOpen, title: copy.step1, body: copy.step1Body },
            { icon: ShoppingBag, title: copy.step2, body: copy.step2Body },
            { icon: CheckCircle2, title: copy.step3, body: copy.step3Body }
          ].map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-3xl border border-[#EAE3D2] bg-white p-6">
              <Icon className="h-6 w-6 text-[#B29259]" aria-hidden="true" />
              <h3 className="font-display mt-4 text-xl font-extrabold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="packages" className="scroll-mt-20 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-8 sm:mb-10">
            <div className="text-[11px] font-medium uppercase tracking-[0.32em] text-gray-500">
              <span className="divider-gold" aria-hidden="true" /> {copy.catalogKicker}
            </div>
            <h3 className="font-display mt-3 inline-block text-3xl font-extrabold text-gray-900 sm:text-4xl">{copy.catalogTitle}</h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600">{copy.catalogBody}</p>
          </div>

          <nav aria-label={copy.catalogTitle} className="mb-10 flex flex-wrap gap-2">
            {byCategory.map(({ category }) => (
              <a key={category} href={`#cat-${categories.indexOf(category)}`} className="rounded-full border border-[#EAE3D2] bg-[#FAF7F2] px-3.5 py-2 text-xs font-bold text-[#8C6D3F] hover:border-[#B29259]">
                {categoryLabel(category, lang)}
              </a>
            ))}
          </nav>

          <div className="space-y-14">
            {byCategory.map(({ category, packages: categoryPackages }) => (
              <section key={category} id={`cat-${categories.indexOf(category)}`} className="scroll-mt-24">
                <h4 className="font-display mb-5 flex items-center gap-3 text-2xl font-bold text-gray-900">
                  <span className="divider-gold" aria-hidden="true" />
                  {categoryLabel(category, lang)}
                </h4>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryPackages.map((pkg) => {
                    const text = pkgText(pkg);
                    const packageHighlights = highlights(pkg);
                    const tiers = pkg.pricingTiers ? Object.entries(pkg.pricingTiers) : [];

                    return (
                      <article key={pkg.id} className="card-hover flex flex-col rounded-3xl border border-[#EAE3D2] bg-[#FAF7F2] p-5">
                        <div className="ld-illus mb-4 flex items-center justify-center overflow-hidden rounded-2xl border border-[#EAE3D2] bg-white p-2">
                          {pkg.image ? (
                            <img src={pkg.image} alt={text.title} loading="lazy" className="h-[132px] w-full rounded-xl object-cover" />
                          ) : (
                            <div className="w-full py-3">{renderPackageSVG(pkg.svgType)}</div>
                          )}
                        </div>

                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C6D3F]">{categoryLabel(category, lang)}</p>
                        <h5 className="mt-2 text-lg font-bold leading-tight text-gray-900">{text.title}</h5>
                        <p className="mt-2 min-h-10 text-xs leading-relaxed text-gray-500">{text.subtitle}</p>

                        <div className="mt-4 flex items-end justify-between gap-3 border-y border-[#EAE3D2] py-3">
                          <span className="text-xs font-bold text-gray-500">{copy.from}</span>
                          <strong className="text-xl text-[#8C6D3F]">{money(pkg.price)}</strong>
                        </div>

                        {tiers.length > 0 && (
                          <div className="mt-3 rounded-xl bg-white p-3 text-[11px] text-gray-600">
                            <p className="font-bold text-gray-800">{copy.tiers}</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {tiers.map(([count, price]) => (
                                <span key={count} className="rounded-full border border-[#EAE3D2] px-2 py-1">{count}: {money(price)}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {packageHighlights.length > 0 && (
                          <details className="mt-3 rounded-xl border border-[#EAE3D2] bg-white p-3 text-xs text-gray-600">
                            <summary className="cursor-pointer font-bold text-[#8C6D3F]">{copy.details}</summary>
                            <ul className="mt-3 space-y-2">
                              {packageHighlights.map((line, index) => <li key={`${pkg.id}-${index}`}>• {line}</li>)}
                            </ul>
                          </details>
                        )}

                        {text.benefits && (
                          <p className="mt-3 inline-flex items-start gap-1.5 text-[11px] font-bold text-emerald-700">
                            <Gift className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span><span className="sr-only">{copy.benefit}: </span>{text.benefits}</span>
                          </p>
                        )}

                        <button type="button" onClick={() => handleAdd(pkg)} className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#8C6D3F] px-4 py-3 text-sm font-bold text-white hover:bg-[#6d5430]" aria-label={`${copy.add}: ${text.title}`}>
                          {addedId === pkg.id ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <ShoppingBag className="h-4 w-4" aria-hidden="true" />}
                          {addedId === pkg.id ? copy.added : copy.add}
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#FAF7F2] py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#8C6D3F] via-[#a8854e] to-[#B29259] px-6 py-12 text-center shadow-warm sm:px-14 sm:py-16">
            <Sparkles className="mx-auto mb-4 h-7 w-7 text-white/70" aria-hidden="true" />
            <h3 className="font-display mx-auto max-w-2xl text-2xl font-extrabold leading-tight text-white sm:text-4xl">{copy.ctaTitle}</h3>
            <p className="mx-auto mt-4 max-w-lg text-sm text-white/80 sm:text-base">{copy.ctaBody}</p>
            <Link to="/cart" className="sheen mx-auto mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-bold text-[#8C6D3F] hover:bg-[#FAF7F2]">
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              {copy.cart} · {cartLabel} · {money(subtotal)}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
