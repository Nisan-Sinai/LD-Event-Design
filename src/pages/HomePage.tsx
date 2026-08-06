import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  MessageCircle,
  PackageOpen,
  ShoppingBag,
  Sparkles,
  Truck
} from 'lucide-react';
import { ArtDefsHost, CATEGORIES, PACKAGES, renderPackageSVG, type Package } from '../App';
import { MINIMUM_ORDER, useCart } from '../cart/CartProvider';
import {
  buildShopProducts,
  SHOP_PRODUCT_CATEGORIES,
  type ShopProduct
} from '../catalog/shopProducts';
import { useI18n } from '../i18n/i18n';
import { categoryLabel, PACKAGE_EN } from '../i18n/content';
import { buildCatalog } from '../lib/packages';
import { DELIVERY_FEE } from '../lib/pricing';
import { usePackages } from '../packages/PackagesProvider';

const COPY = {
  he: {
    minimum: 'מינימום הזמנה',
    delivery: 'הובלה, הקמה ופירוק',
    hero: 'עיצוב אירועים בקליק!',
    heroBody: 'בוחרים מוצרים קטנים או חבילה מלאה, מוסיפים לעגלה ומסיימים הזמנה פשוטה — בדיוק כמו בחנות רגילה.',
    choose: '1. בוחרים',
    chooseBody: 'מוצרים קטנים או חבילה שמתאימה לאירוע.',
    order: '2. מזמינים',
    orderBody: 'מוסיפים לסל, מעדכנים כמויות וממלאים פרטים.',
    love: '3. מתאהבים',
    loveBody: 'אנחנו מתאמים, מכינים ומעצבים את האירוע.',
    products: 'מוצרים קטנים',
    productsBody: 'מוסיפים כל פריט בנפרד ובוחרים את הכמות הרצויה.',
    packages: 'חבילות',
    packagesBody: 'חבילות מוכנות שמרכזות כמה אלמנטים במחיר אחד.',
    add: 'הוספה לסל',
    added: 'נוסף לסל',
    from: 'החל מ־',
    details: 'מה כלול?',
    cart: 'עגלת קניות',
    viewCart: 'לצפייה בעגלה',
    noSignup: 'אין צורך בהרשמה כדי להזמין',
    whatsapp: 'יש לכם שאלה?',
    item: 'פריט',
    items: 'פריטים',
    shopNav: 'קטגוריות החנות'
  },
  en: {
    minimum: 'Minimum order',
    delivery: 'Delivery, setup and collection',
    hero: 'Event design in a click!',
    heroBody: 'Choose small products or a complete package, add them to your cart and complete a simple guest order.',
    choose: '1. Choose',
    chooseBody: 'Small products or a package that fits your event.',
    order: '2. Order',
    orderBody: 'Add to cart, update quantities and enter your details.',
    love: '3. Fall in love',
    loveBody: 'We coordinate, prepare and style your event.',
    products: 'Small products',
    productsBody: 'Add each item separately and choose the quantity you need.',
    packages: 'Packages',
    packagesBody: 'Ready-made packages that combine several elements at one price.',
    add: 'Add to cart',
    added: 'Added to cart',
    from: 'From',
    details: 'What is included?',
    cart: 'Shopping cart',
    viewCart: 'View cart',
    noSignup: 'No registration is required',
    whatsapp: 'Have a question?',
    item: 'item',
    items: 'items',
    shopNav: 'Shop categories'
  }
} as const;

function money(value: number) {
  return `₪${value.toLocaleString()}`;
}

function productCategoryLabel(category: string, lang: 'he' | 'en') {
  if (lang === 'he') return category;
  const labels: Record<string, string> = {
    [SHOP_PRODUCT_CATEGORIES.CENTERPIECES]: 'Table centerpieces',
    [SHOP_PRODUCT_CATEGORIES.CHUPPAH]: 'Chuppah styling',
    [SHOP_PRODUCT_CATEGORIES.ENTRANCE]: 'Entrance styling',
    [SHOP_PRODUCT_CATEGORIES.SWEET_BAR]: 'Sweet bar & accessories'
  };
  return labels[category] ?? category;
}

export function HomePage() {
  const { lang } = useI18n();
  const copy = COPY[lang];
  const { overrides } = usePackages();
  const { addItem, itemCount, subtotal } = useCart();
  const [addedId, setAddedId] = useState('');
  const Arrow = lang === 'he' ? ArrowLeft : ArrowRight;

  const products = useMemo(() => buildShopProducts(overrides), [overrides]);
  const packages = useMemo(() => buildCatalog(PACKAGES, overrides), [overrides]);
  const productCategories = Object.values(SHOP_PRODUCT_CATEGORIES);
  const packageCategories = Object.values(CATEGORIES);

  const packageText = (pkg: Package) =>
    lang === 'en' && PACKAGE_EN[pkg.id]
      ? {
          title: PACKAGE_EN[pkg.id].title,
          subtitle: PACKAGE_EN[pkg.id].subtitle,
          benefits: PACKAGE_EN[pkg.id].benefits
        }
      : { title: pkg.title, subtitle: pkg.subtitle, benefits: pkg.benefits };

  const addProduct = (product: ShopProduct) => {
    addItem({
      id: product.id,
      title: product.title,
      subtitle: product.subtitle,
      category: productCategoryLabel(product.category, lang),
      price: product.price,
      image: product.image,
      svgType: product.svgType
    });
    setAddedId(product.id);
  };

  const addPackage = (pkg: Package) => {
    const text = packageText(pkg);
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

  const cartCount = `${itemCount} ${itemCount === 1 ? copy.item : copy.items}`;

  return (
    <>
      <ArtDefsHost />

      <div className="border-b border-[#EAE3D2] bg-[#2c241a] text-[#F7F0E4]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-1 px-4 py-2.5 text-xs font-bold">
          <span>{copy.minimum} {money(MINIMUM_ORDER)}</span>
          <span className="inline-flex items-center gap-1.5 text-[#EAE3D2]/80"><Truck className="h-3.5 w-3.5" aria-hidden="true" />{copy.delivery} {money(DELIVERY_FEE)}</span>
        </div>
      </div>

      <section className="hero-glow bg-white py-14 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="text-center lg:text-start">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#B29259]">LD Event Design</p>
            <h2 className="font-display mt-4 text-4xl font-black leading-tight text-gray-900 sm:text-6xl">{copy.hero}</h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-gray-600 lg:mx-0">{copy.heroBody}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
              <a href="#products" className="inline-flex items-center gap-2 rounded-full bg-[#8C6D3F] px-6 py-3 text-sm font-bold text-white shadow-warm hover:bg-[#6d5430]">
                {copy.products}<Arrow className="h-4 w-4" aria-hidden="true" />
              </a>
              <a href="#packages" className="inline-flex items-center gap-2 rounded-full border border-[#B29259] bg-white px-6 py-3 text-sm font-bold text-[#8C6D3F] hover:bg-[#FAF7F2]">
                {copy.packages}<PackageOpen className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
            <p className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-emerald-700"><Check className="h-4 w-4" aria-hidden="true" />{copy.noSignup}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {products.slice(0, 4).map((product, index) => (
              <div key={product.id} className={`overflow-hidden rounded-[2rem] border border-[#EAE3D2] bg-[#FAF7F2] shadow-warm ${index % 2 === 1 ? 'translate-y-5' : ''}`}>
                <div className="aspect-[4/5] bg-white p-3">
                  {product.image ? <img src={product.image} alt={product.title} className="h-full w-full rounded-2xl object-cover" /> : <div className="flex h-full items-center justify-center">{renderPackageSVG(product.svgType)}</div>}
                </div>
                <div className="p-3 text-center">
                  <p className="truncate text-xs font-bold text-gray-800">{product.title}</p>
                  <p className="mt-1 text-sm font-black text-[#8C6D3F]">{money(product.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#EAE3D2] bg-[#FAF7F2] py-10">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:grid-cols-3">
          {[
            { icon: ShoppingBag, title: copy.choose, body: copy.chooseBody },
            { icon: PackageOpen, title: copy.order, body: copy.orderBody },
            { icon: Heart, title: copy.love, body: copy.loveBody }
          ].map(({ icon: Icon, title, body }) => (
            <article key={title} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#B29259] shadow-sm"><Icon className="h-5 w-5" aria-hidden="true" /></div>
              <h3 className="font-display mt-3 text-xl font-extrabold text-gray-900">{title}</h3>
              <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-gray-600">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <nav aria-label={copy.shopNav} className="sticky top-[73px] z-40 border-b border-[#EAE3D2] bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3">
          {productCategories.map((category, index) => (
            <a key={category} href={`#product-category-${index}`} className="shrink-0 rounded-full border border-[#EAE3D2] px-4 py-2 text-xs font-bold text-[#8C6D3F] hover:border-[#B29259] hover:bg-[#FAF7F2]">{productCategoryLabel(category, lang)}</a>
          ))}
          <a href="#packages" className="shrink-0 rounded-full bg-[#8C6D3F] px-4 py-2 text-xs font-bold text-white">{copy.packages}</a>
        </div>
      </nav>

      <section id="products" className="scroll-mt-36 bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#B29259]">Shop</p>
            <h3 className="font-display mt-2 text-3xl font-black text-gray-900 sm:text-4xl">{copy.products}</h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-600">{copy.productsBody}</p>
          </div>

          <div className="space-y-16">
            {productCategories.map((category, categoryIndex) => {
              const categoryProducts = products.filter((product) => product.category === category);
              if (categoryProducts.length === 0) return null;
              return (
                <section key={category} id={`product-category-${categoryIndex}`} className="scroll-mt-36">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <h4 className="font-display text-2xl font-extrabold text-gray-900">{productCategoryLabel(category, lang)}</h4>
                    <span className="h-px flex-1 bg-[#EAE3D2]" aria-hidden="true" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                    {categoryProducts.map((product) => (
                      <article key={product.id} className="group flex flex-col overflow-hidden rounded-2xl border border-[#EAE3D2] bg-white transition hover:-translate-y-1 hover:shadow-warm">
                        <div className="relative aspect-[4/5] overflow-hidden bg-[#FAF7F2]">
                          {product.image ? (
                            <img src={product.image} alt={product.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                          ) : (
                            <div className="flex h-full items-center justify-center p-4">{renderPackageSVG(product.svgType)}</div>
                          )}
                          <button type="button" onClick={() => addProduct(product)} aria-label={`${copy.add}: ${product.title}`} className="absolute bottom-3 end-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#8C6D3F] shadow-lg transition hover:bg-[#8C6D3F] hover:text-white">
                            {addedId === product.id ? <Check className="h-4 w-4" aria-hidden="true" /> : <ShoppingBag className="h-4 w-4" aria-hidden="true" />}
                          </button>
                        </div>
                        <div className="flex flex-1 flex-col p-3.5 sm:p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#B29259]">{productCategoryLabel(product.category, lang)}</p>
                          <h5 className="mt-1.5 text-sm font-bold leading-snug text-gray-900 sm:text-base">{product.title}</h5>
                          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-gray-500 sm:text-xs">{product.subtitle}</p>
                          <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                            <strong className="text-base font-black text-[#8C6D3F]">{money(product.price)}</strong>
                            <button type="button" onClick={() => addProduct(product)} className="text-[11px] font-bold text-[#8C6D3F] underline-offset-4 hover:underline">{addedId === product.id ? copy.added : copy.add}</button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </section>

      <section id="packages" className="scroll-mt-36 bg-[#FAF7F2] py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#B29259]">Complete packages</p>
            <h3 className="font-display mt-2 text-3xl font-black text-gray-900 sm:text-4xl">{copy.packages}</h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-600">{copy.packagesBody}</p>
          </div>

          <div className="space-y-14">
            {packageCategories.map((category) => {
              const categoryPackages = packages.filter((pkg) => pkg.category === category);
              if (categoryPackages.length === 0) return null;
              return (
                <section key={category}>
                  <h4 className="font-display mb-5 text-center text-2xl font-extrabold text-gray-900">{categoryLabel(category, lang)}</h4>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {categoryPackages.map((pkg) => {
                      const text = packageText(pkg);
                      const details = Object.values(pkg.details).flatMap((items) => items ?? []).slice(0, 4);
                      return (
                        <article key={pkg.id} className="flex flex-col overflow-hidden rounded-[2rem] border border-[#EAE3D2] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-warm">
                          <div className="aspect-[16/11] overflow-hidden bg-[#FAF7F2] p-4">
                            {pkg.image ? <img src={pkg.image} alt={text.title} className="h-full w-full rounded-2xl object-cover" /> : <div className="flex h-full items-center justify-center">{renderPackageSVG(pkg.svgType)}</div>}
                          </div>
                          <div className="flex flex-1 flex-col p-5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#B29259]">{categoryLabel(category, lang)}</p>
                            <h5 className="mt-2 text-xl font-extrabold text-gray-900">{text.title}</h5>
                            <p className="mt-2 text-sm leading-relaxed text-gray-500">{text.subtitle}</p>
                            {details.length > 0 && (
                              <details className="mt-4 rounded-2xl bg-[#FAF7F2] p-4 text-xs text-gray-600">
                                <summary className="cursor-pointer font-bold text-[#8C6D3F]">{copy.details}</summary>
                                <ul className="mt-3 space-y-2">{details.map((detail, index) => <li key={`${pkg.id}-${index}`}>• {detail}</li>)}</ul>
                              </details>
                            )}
                            <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                              <div><span className="block text-[10px] font-bold text-gray-400">{copy.from}</span><strong className="text-2xl font-black text-[#8C6D3F]">{money(pkg.price)}</strong></div>
                              <button type="button" onClick={() => addPackage(pkg)} aria-label={`${copy.add}: ${text.title}`} className="inline-flex items-center gap-2 rounded-full bg-[#8C6D3F] px-5 py-3 text-xs font-bold text-white hover:bg-[#6d5430]">
                                {addedId === pkg.id ? <Check className="h-4 w-4" aria-hidden="true" /> : <ShoppingBag className="h-4 w-4" aria-hidden="true" />}
                                {addedId === pkg.id ? copy.added : copy.add}
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <MessageCircle className="mx-auto h-7 w-7 text-[#B29259]" aria-hidden="true" />
          <h3 className="font-display mt-3 text-2xl font-extrabold text-gray-900">{copy.whatsapp}</h3>
          <a href="https://wa.me/972545740423" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#B29259] px-6 py-3 text-sm font-bold text-[#8C6D3F] hover:bg-[#FAF7F2]">WhatsApp</a>
        </div>
      </section>

      {itemCount > 0 && (
        <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-[#D8C29A] bg-white p-3 shadow-2xl sm:bottom-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-700">{copy.cart}: {cartCount}</p>
              <p className="text-lg font-black text-[#8C6D3F]">{money(subtotal)}</p>
            </div>
            <Link to="/cart" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#8C6D3F] px-5 py-3 text-xs font-bold text-white hover:bg-[#6d5430]">{copy.viewCart}<Arrow className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
        </div>
      )}

      <div aria-live="polite" className="sr-only">{addedId ? copy.added : ''}</div>
    </>
  );
}
