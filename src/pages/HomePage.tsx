import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  Instagram,
  MessageCircle,
  Palette,
  Play,
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import { ArtDefsHost, CATEGORIES, PACKAGES, renderPackageSVG, type Package } from '../App';
import { useCart } from '../cart/CartProvider';
import {
  buildShopProducts,
  SHOP_PRODUCT_CATEGORIES,
  type ShopProduct
} from '../catalog/shopProducts';
import { LeadCaptureModal } from '../components/LeadCaptureModal';
import { PackageMediaCarousel } from '../components/PackageMediaCarousel';
import { QuoteNotice } from '../components/QuoteNotice';
import { TestimonialsCarousel } from '../components/TestimonialsCarousel';
import { useI18n } from '../i18n/i18n';
import { categoryLabel, PACKAGE_EN } from '../i18n/content';
import { buildCatalog } from '../lib/packages';
import { usePackages } from '../packages/PackagesProvider';

const COPY = {
  he: {
    eyebrow: 'עיצוב אירועים בקליק!',
    hero: 'האירוע שלכם. האמנות שלנו.',
    heroBody: 'פורטל אינטראקטיבי להרכבת חבילת עיצוב אישית — מדויקת לסיפור, לצבעים ולחלום שלכם.',
    products: 'פריטי עיצוב',
    packages: 'חבילות עיצוב',
    add: 'הוספה לסל',
    added: 'נוסף לסל',
    from: 'החל מ־',
    details: 'מה כלול?',
    cart: 'עגלת קניות',
    viewCart: 'לצפייה בעגלה',
    item: 'פריט',
    items: 'פריטים',
    builderTitle: 'בואו נרכיב את שפת העיצוב שלכם',
    builderBody: 'בחרו פלטה מובילה, הוסיפו גוונים מדויקים וספרו לנו מה תרצו להגשים.',
    customColors: 'גוונים מדויקים שתרצו לשלב',
    customColorsPlaceholder: 'לדוגמה: שמנת, זהב מט, ורוד עתיק ונגיעות ירוק זית',
    customRequest: 'יש משהו ספציפי שתרצו באירוע ולא מופיע בחבילות?',
    customRequestPlaceholder: 'ספרו לנו עליו כאן ונשמח להגשים לכם אותו!',
    estimate: 'אומדן החבילה שלכם כרגע',
    mediaHint: 'החליקו בין תמונות והמחשות העיצוב',
    shopNav: 'קטגוריות החנות'
  },
  en: {
    eyebrow: 'Event design in a click!',
    hero: 'Your celebration. Our art.',
    heroBody: 'An interactive portal for building a personal event-design package around your story, colors and vision.',
    products: 'Design pieces',
    packages: 'Design packages',
    add: 'Add to cart',
    added: 'Added to cart',
    from: 'From',
    details: 'What is included?',
    cart: 'Shopping cart',
    viewCart: 'View cart',
    item: 'item',
    items: 'items',
    builderTitle: 'Create your event design language',
    builderBody: 'Choose a leading palette, add precise shades and tell us what you dream of creating.',
    customColors: 'Exact shades you would like to include',
    customColorsPlaceholder: 'For example: ivory, matte gold, antique pink and olive accents',
    customRequest: 'Is there something special that is not included in the packages?',
    customRequestPlaceholder: 'Tell us about it and we will be happy to make it happen.',
    estimate: 'Your current package estimate',
    mediaHint: 'Swipe through imagery and design illustrations',
    shopNav: 'Shop categories'
  }
} as const;

const PALETTES = [
  { name: 'לבן וזהב', colors: ['#FDFBF7', '#D4AF37', '#B8860B'] },
  { name: 'ורוד פודרה וזהב־ורוד', colors: ['#F4E3E3', '#E8C5B8', '#C69A71'] },
  { name: 'בורדו וזהב', colors: ['#6E1F2A', '#D4AF37', '#F7E8DA'] },
  { name: 'ירוק זית ושמנת', colors: ['#6D7657', '#FAF6F0', '#C7A76A'] },
  { name: 'שחור, פנינה וזהב', colors: ['#2C2C2C', '#FDFBF7', '#D4AF37'] }
];

function money(value: number) {
  return `₪${value.toLocaleString('he-IL')}`;
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
  const {
    addItem,
    itemCount,
    subtotal,
    preferences,
    setPalette,
    setCustomColors,
    setCustomRequest
  } = useCart();
  const [addedId, setAddedId] = useState('');
  const [videoFailed, setVideoFailed] = useState(false);
  const Arrow = lang === 'he' ? ArrowLeft : ArrowRight;

  const products = useMemo(() => buildShopProducts(overrides), [overrides]);
  const packages = useMemo(() => buildCatalog(PACKAGES, overrides), [overrides]);
  const productCategories = Object.values(SHOP_PRODUCT_CATEGORIES);
  const packageCategories = Object.values(CATEGORIES);
  const heroVideo = (import.meta.env.VITE_HERO_VIDEO_URL as string | undefined) ?? '/media/ld-event-design-hero.mp4';

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

      <section className="relative isolate min-h-[78vh] overflow-hidden bg-[#2C2C2C] text-white">
        {!videoFailed && (
          <video
            className="absolute inset-0 h-full w-full object-cover opacity-75"
            src={heroVideo}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onError={() => setVideoFailed(true)}
            aria-label="עיצוב אירועים יוקרתי"
          />
        )}
        {videoFailed && (
          <div className="absolute inset-0 grid grid-cols-2 opacity-55 sm:grid-cols-4">
            {products.slice(0, 4).map((product) => (
              <div key={product.id} className="relative min-h-[78vh] overflow-hidden border-e border-white/10">
                {product.image ? (
                  <img src={product.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#F4E3E3] to-[#C69A71] p-8">{renderPackageSVG(product.svgType)}</div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2C2C2C]/35 via-[#2C2C2C]/42 to-[#2C2C2C]/88" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(232,197,184,0.25),transparent_34%),radial-gradient(circle_at_20%_75%,rgba(212,175,55,0.16),transparent_30%)]" />

        <div className="relative mx-auto flex min-h-[78vh] max-w-6xl items-end px-4 pb-16 pt-24 sm:items-center sm:pb-20 sm:pt-20">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.3em] backdrop-blur-xl">
              <Sparkles className="h-4 w-4 text-[#E8C5B8]" aria-hidden="true" /> {copy.eyebrow}
            </p>
            <h2 className="font-display mt-6 text-5xl font-black leading-[0.98] tracking-tight sm:text-7xl lg:text-8xl">{copy.hero}</h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/82 sm:text-xl">{copy.heroBody}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#builder" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#C69A71] px-7 py-3.5 text-sm font-extrabold text-white shadow-[0_18px_45px_rgba(184,134,11,0.3)] transition hover:-translate-y-1">
                הרכבת חבילה אישית <Arrow className="h-4 w-4" aria-hidden="true" />
              </a>
              <a href="#packages" className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 px-7 py-3.5 text-sm font-extrabold text-white backdrop-blur transition hover:bg-white hover:text-[#2C2C2C]">
                צפייה בחבילות <Play className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="builder" className="scroll-mt-28 bg-[#FDFBF7] py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <QuoteNotice />

          <div className="mt-10 grid gap-8 rounded-[2.5rem] border border-[#E8C5B8]/70 bg-white p-5 shadow-[0_30px_80px_rgba(184,134,11,0.08)] sm:p-8 lg:grid-cols-[1fr_0.42fr]">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-[#B8860B]"><Palette className="h-4 w-4" aria-hidden="true" /> Design palette</p>
              <h2 className="font-display mt-3 text-3xl font-black text-[#2C2C2C] sm:text-5xl">{copy.builderTitle}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6C625A]">{copy.builderBody}</p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {PALETTES.map((palette) => (
                  <button key={palette.name} type="button" onClick={() => setPalette(palette.name)} aria-pressed={preferences.palette === palette.name} className={`rounded-3xl border p-4 text-start transition ${preferences.palette === palette.name ? 'border-[#B8860B] bg-[#FAF6F0] shadow-[0_12px_30px_rgba(184,134,11,0.12)]' : 'border-[#E8C5B8]/65 bg-white hover:-translate-y-0.5 hover:border-[#D4AF37]'}`}>
                    <span className="flex gap-1.5">{palette.colors.map((color) => <span key={color} className="h-7 flex-1 rounded-full border border-black/5" style={{ backgroundColor: color }} />)}</span>
                    <span className="mt-3 flex items-center justify-between gap-2 text-sm font-extrabold text-[#2C2C2C]">{palette.name}{preferences.palette === palette.name && <Check className="h-4 w-4 text-[#B8860B]" aria-hidden="true" />}</span>
                  </button>
                ))}
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-extrabold text-[#2C2C2C]">
                  {copy.customColors}
                  <input value={preferences.customColors} onChange={(event) => setCustomColors(event.target.value)} placeholder={copy.customColorsPlaceholder} className="mt-2 w-full rounded-2xl border border-[#E8C5B8] bg-[#FDFBF7] px-4 py-3 font-normal outline-none transition placeholder:text-[#A99B90] focus:border-[#B8860B] focus:ring-4 focus:ring-[#E8C5B8]/30" />
                </label>
                <label className="text-sm font-extrabold text-[#2C2C2C]">
                  {copy.customRequest}
                  <textarea value={preferences.customRequest} onChange={(event) => setCustomRequest(event.target.value)} placeholder={copy.customRequestPlaceholder} rows={3} className="mt-2 w-full resize-y rounded-2xl border border-[#E8C5B8] bg-[#FDFBF7] px-4 py-3 font-normal outline-none transition placeholder:text-[#A99B90] focus:border-[#B8860B] focus:ring-4 focus:ring-[#E8C5B8]/30" />
                </label>
              </div>
            </div>

            <aside className="flex flex-col justify-between rounded-[2rem] bg-gradient-to-br from-[#2C2C2C] to-[#4A3C34] p-6 text-white">
              <div>
                <Heart className="h-8 w-8 text-[#E8C5B8]" aria-hidden="true" />
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-white/55">{copy.estimate}</p>
                <strong className="font-display mt-2 block text-4xl font-black text-[#E8C5B8]">{money(subtotal)}</strong>
                <p className="mt-2 text-xs leading-relaxed text-white/55">האומדן מתעדכן בזמן אמת לפי הפריטים והחבילות שתבחרו.</p>
              </div>
              <a href="#products" className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-extrabold text-[#2C2C2C] transition hover:-translate-y-0.5">מתחילים לבחור <Arrow className="h-4 w-4" aria-hidden="true" /></a>
            </aside>
          </div>
        </div>
      </section>

      <nav aria-label={copy.shopNav} className="sticky top-[73px] z-40 border-y border-[#E8C5B8]/60 bg-[#FDFBF7]/92 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3">
          {productCategories.map((category, index) => (
            <a key={category} href={`#product-category-${index}`} className="shrink-0 rounded-full border border-[#E8C5B8] bg-white px-4 py-2 text-xs font-bold text-[#7A5A46] transition hover:border-[#B8860B] hover:text-[#B8860B]">{productCategoryLabel(category, lang)}</a>
          ))}
          <a href="#packages" className="shrink-0 rounded-full bg-gradient-to-r from-[#B8860B] to-[#D4AF37] px-4 py-2 text-xs font-bold text-white">{copy.packages}</a>
        </div>
      </nav>

      <section id="products" className="scroll-mt-36 bg-[#FAF6F0] py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#B8860B]">Curated details</p>
            <h2 className="font-display mt-3 text-4xl font-black text-[#2C2C2C] sm:text-6xl">{copy.products}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#6C625A]">בחרו פריטים קטנים, שנו כמויות וצרו שילוב שמרגיש בדיוק שלכם.</p>
          </div>

          <div className="space-y-16">
            {productCategories.map((category, categoryIndex) => {
              const categoryProducts = products.filter((product) => product.category === category);
              if (categoryProducts.length === 0) return null;
              return (
                <section key={category} id={`product-category-${categoryIndex}`} className="scroll-mt-36">
                  <div className="mb-6 flex items-center gap-4">
                    <h3 className="font-display text-2xl font-black text-[#2C2C2C] sm:text-3xl">{productCategoryLabel(category, lang)}</h3>
                    <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[#E8C5B8] to-transparent" aria-hidden="true" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                    {categoryProducts.map((product) => (
                      <article key={product.id} className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-[#E8C5B8]/70 bg-white transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_55px_rgba(184,134,11,0.13)]">
                        <div className="relative aspect-[4/5] overflow-hidden bg-[#F4E3E3]">
                          {product.image ? (
                            <img src={product.image} alt={product.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                          ) : (
                            <div className="flex h-full items-center justify-center p-4">{renderPackageSVG(product.svgType)}</div>
                          )}
                          <button type="button" onClick={() => addProduct(product)} aria-label={`${copy.add}: ${product.title}`} className="absolute bottom-3 end-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#B8860B] shadow-xl transition hover:scale-105 hover:bg-[#B8860B] hover:text-white">
                            {addedId === product.id ? <Check className="h-4 w-4" aria-hidden="true" /> : <ShoppingBag className="h-4 w-4" aria-hidden="true" />}
                          </button>
                        </div>
                        <div className="flex flex-1 flex-col p-4">
                          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#B8860B]">{productCategoryLabel(product.category, lang)}</p>
                          <h4 className="mt-2 text-sm font-extrabold leading-snug text-[#2C2C2C] sm:text-base">{product.title}</h4>
                          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#7A7069] sm:text-xs">{product.subtitle}</p>
                          <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                            <strong className="text-base font-black text-[#B8860B]">{money(product.price)}</strong>
                            <button type="button" onClick={() => addProduct(product)} className="text-[10px] font-extrabold text-[#7A5A46] underline-offset-4 hover:underline">{addedId === product.id ? copy.added : copy.add}</button>
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

      <section id="packages" className="scroll-mt-36 bg-[#FDFBF7] py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#B8860B]">Signature collections</p>
            <h2 className="font-display mt-3 text-4xl font-black text-[#2C2C2C] sm:text-6xl">{copy.packages}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#6C625A]">{copy.mediaHint}</p>
          </div>

          <div className="space-y-16">
            {packageCategories.map((category) => {
              const categoryPackages = packages.filter((pkg) => pkg.category === category);
              if (categoryPackages.length === 0) return null;
              return (
                <section key={category}>
                  <h3 className="font-display mb-6 text-center text-3xl font-black text-[#2C2C2C]">{categoryLabel(category, lang)}</h3>
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {categoryPackages.map((pkg) => {
                      const text = packageText(pkg);
                      const details = Object.values(pkg.details).flatMap((items) => items ?? []).slice(0, 5);
                      return (
                        <article key={pkg.id} className="flex flex-col overflow-hidden rounded-[2.25rem] border border-[#E8C5B8]/70 bg-white shadow-[0_18px_55px_rgba(44,44,44,0.07)] transition hover:-translate-y-1.5 hover:shadow-[0_28px_70px_rgba(184,134,11,0.14)]">
                          <PackageMediaCarousel title={text.title} mediaUrl={pkg.image} art={renderPackageSVG(pkg.svgType)} />
                          <div className="flex flex-1 flex-col p-5 sm:p-6">
                            <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#B8860B]">{categoryLabel(category, lang)}</p>
                            <h4 className="font-display mt-2 text-2xl font-black leading-tight text-[#2C2C2C]">{text.title}</h4>
                            <p className="mt-3 text-sm leading-relaxed text-[#6C625A]">{text.subtitle}</p>
                            {details.length > 0 && (
                              <details className="mt-4 rounded-2xl border border-[#E8C5B8]/60 bg-[#FAF6F0] p-4 text-xs text-[#6C625A]">
                                <summary className="cursor-pointer font-extrabold text-[#7A5A46]">{copy.details}</summary>
                                <ul className="mt-3 space-y-2">{details.map((detail, index) => <li key={`${pkg.id}-${index}`} className="flex gap-2"><Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B8860B]" aria-hidden="true" />{detail}</li>)}</ul>
                              </details>
                            )}
                            <div className="mt-auto flex items-end justify-between gap-3 pt-6">
                              <div><span className="block text-[10px] font-bold text-[#9B8A7D]">{copy.from}</span><strong className="font-display text-2xl font-black text-[#B8860B]">{money(pkg.price)}</strong></div>
                              <button type="button" onClick={() => addPackage(pkg)} aria-label={`${copy.add}: ${text.title}`} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#B8860B] to-[#D4AF37] px-5 py-3 text-xs font-extrabold text-white shadow-lg transition hover:-translate-y-0.5">
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

      <TestimonialsCarousel />

      <section className="bg-[#FAF6F0] py-16 sm:py-24" aria-labelledby="instagram-title">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-[#B8860B]"><Instagram className="h-4 w-4" aria-hidden="true" /> Live inspiration</p>
              <h2 id="instagram-title" className="font-display mt-3 text-4xl font-black text-[#2C2C2C]">מהאינסטגרם שלנו</h2>
            </div>
            <a href="https://www.instagram.com/ld_event_design?igsh=MWpsN2c2OWhyY2FsaQ==" target="_blank" rel="noopener noreferrer" className="rounded-full border border-[#B8860B] px-5 py-2.5 text-xs font-extrabold text-[#7A5A46] transition hover:bg-[#B8860B] hover:text-white">@ld_event_design</a>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {products.slice(0, 6).map((product) => (
              <a key={product.id} href="https://www.instagram.com/ld_event_design?igsh=MWpsN2c2OWhyY2FsaQ==" target="_blank" rel="noopener noreferrer" aria-label={`פתיחת אינסטגרם — ${product.title}`} className="group aspect-square overflow-hidden rounded-3xl bg-white shadow-sm">
                {product.image ? <img src={product.image} alt={product.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" /> : <div className="flex h-full items-center justify-center p-3 transition duration-500 group-hover:scale-105">{renderPackageSVG(product.svgType)}</div>}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <MessageCircle className="mx-auto h-8 w-8 text-[#B8860B]" aria-hidden="true" />
          <h2 className="font-display mt-4 text-3xl font-black text-[#2C2C2C]">בואו נדבר על האירוע שלכם</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#6C625A]">אנחנו כאן לכל שאלה, רעיון או חלום עיצובי — גם לפני שבחרתם חבילה.</p>
          <a href="https://wa.me/972545740423" target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#2C2C2C] px-7 py-3.5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#B8860B]">WhatsApp</a>
        </div>
      </section>

      {itemCount > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-[1.5rem] border border-[#E8C5B8] bg-white/94 p-3 shadow-[0_20px_60px_rgba(44,44,44,0.2)] backdrop-blur-xl sm:bottom-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#6C625A]">{copy.cart}: {cartCount}</p>
              <p className="font-display text-xl font-black text-[#B8860B]">{money(subtotal)}</p>
            </div>
            <Link to="/cart" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-[#B8860B] to-[#D4AF37] px-5 py-3 text-xs font-extrabold text-white shadow-lg">{copy.viewCart}<Arrow className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
        </div>
      )}

      <LeadCaptureModal />
      <div aria-live="polite" className="sr-only">{addedId ? copy.added : ''}</div>
    </>
  );
}
