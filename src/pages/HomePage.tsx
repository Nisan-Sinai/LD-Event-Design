import { useMemo } from 'react';
import { Link } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  FileText,
  Gift,
  MessageCircle,
  Sparkles,
  Truck
} from 'lucide-react';
import { useI18n } from '../i18n/i18n';
import { PACKAGES, CATEGORIES, renderPackageSVG, ArtDefsHost, type Package } from '../App';
import { usePackages } from '../packages/PackagesProvider';
import { buildCatalog } from '../lib/packages';
import { categoryLabel, PACKAGE_EN } from '../i18n/content';

const COPY = {
  he: {
    announcementMinimum: 'מינימום הזמנה באתר',
    announcementDelivery: 'הובלה ותיאום מחושבים לפי מיקום האירוע',
    heroKicker: 'עיצוב אירועים שמזמינים בקלות',
    heroLine1: 'בוחרים עיצוב.',
    heroAccent: 'מתאימים לאירוע.',
    heroLine2: 'מאשרים הזמנה.',
    heroSub:
      'כל החבילות של LD Event Design במקום אחד: בוחרים קטגוריה וחבילה, מוסיפים התאמות ותוספות וממשיכים לאישור הזמנה מסודר.',
    browseCatalog: 'לצפייה בקטלוג',
    whatsapp: 'שאלה לפני שמזמינים? דברו איתנו',
    guestNote: 'אפשר לצפות, לבחור ולהרכיב הזמנה ללא התחברות. ההזדהות נדרשת רק בשלב האישור הסופי.',
    stepsKicker: 'פשוט, ברור ומסודר',
    stepsTitle: 'כך מזמינים עיצוב לאירוע',
    chooseTitle: '1. בוחרים',
    chooseBody: 'עוברים בין הקטגוריות ובוחרים את החבילה שמתאימה לסוג ולגודל האירוע.',
    customizeTitle: '2. מתאימים',
    customizeBody: 'בוחרים כמות שולחנות, תוספות, הובלה ושדרוגים ורואים סיכום מחיר מסודר.',
    approveTitle: '3. מאשרים',
    approveBody: 'ממלאים פרטי אירוע, עוברים על ההסכם ושולחים הזמנה לאישור.',
    catalogKicker: 'הקטלוג של LD Event Design',
    catalogTitle: 'בוחרים חבילה ומתחילים לעצב',
    catalogSub:
      'המחירים מוצגים כמחירי התחלה. המחיר הסופי מתעדכן לפי גודל האירוע, כמות השולחנות, התוספות וההובלה.',
    from: 'החל מ־',
    details: 'מה כוללת החבילה?',
    tiers: 'אפשרויות מחיר לפי כמות שולחנות',
    tables: 'שולחנות',
    orderPackage: 'להמשך להרכבת הזמנה',
    minimumReminder: 'סכום מינימום להזמנה',
    deliveryReminder: 'הובלה מתווספת לפי אזור האירוע',
    finalPriceReminder: 'המחיר הסופי מוצג לפני שליחת ההזמנה',
    ctaTitle: 'מצאתם את הכיוון שלכם?',
    ctaSub: 'עברו להרכבת ההזמנה, בחרו חבילות ותוספות וקבלו סיכום מלא לפני האישור.',
    ctaStart: 'התחלת הזמנה',
    statsPackages: 'חבילות לבחירה',
    statsCategories: 'קטגוריות אירוע',
    statsProcess: 'תהליך הזמנה אחד מסודר'
  },
  en: {
    announcementMinimum: 'Website order minimum',
    announcementDelivery: 'Delivery and coordination are calculated by event location',
    heroKicker: 'Event design made easy to order',
    heroLine1: 'Choose a design.',
    heroAccent: 'Tailor it to your event.',
    heroLine2: 'Confirm your order.',
    heroSub:
      'All LD Event Design packages in one place: choose a category and package, add customizations and extras, and continue to a clear order confirmation.',
    browseCatalog: 'Browse the catalog',
    whatsapp: 'Questions before ordering? Talk to us',
    guestNote: 'You can browse, choose and build an order without signing in. Authentication is required only for final confirmation.',
    stepsKicker: 'Simple, clear and organized',
    stepsTitle: 'How to order your event design',
    chooseTitle: '1. Choose',
    chooseBody: 'Browse the categories and select the package that fits your event type and size.',
    customizeTitle: '2. Customize',
    customizeBody: 'Choose table quantity, extras, delivery and upgrades, with a clear price summary.',
    approveTitle: '3. Confirm',
    approveBody: 'Enter the event details, review the agreement and submit the order for approval.',
    catalogKicker: 'The LD Event Design catalog',
    catalogTitle: 'Choose a package and start designing',
    catalogSub:
      'Prices are starting prices. The final price updates according to event size, table quantity, extras and delivery.',
    from: 'From ',
    details: 'What is included?',
    tiers: 'Pricing options by table quantity',
    tables: 'tables',
    orderPackage: 'Continue to build the order',
    minimumReminder: 'Minimum order amount',
    deliveryReminder: 'Delivery is added according to the event area',
    finalPriceReminder: 'The final price is shown before submitting the order',
    ctaTitle: 'Found the right direction?',
    ctaSub: 'Build your order, select packages and extras, and review the full summary before confirmation.',
    ctaStart: 'Start an order',
    statsPackages: 'packages to choose from',
    statsCategories: 'event categories',
    statsProcess: 'one organized ordering flow'
  }
} as const;

export function HomePage() {
  const { t, lang } = useI18n();
  const { overrides } = usePackages();
  const Arrow = lang === 'he' ? ArrowLeft : ArrowRight;
  const copy = COPY[lang];

  const packages = useMemo(() => buildCatalog(PACKAGES, overrides), [overrides]);
  const minimumOrder = useMemo(
    () => packages.reduce((minimum, pkg) => Math.min(minimum, pkg.price), Number.POSITIVE_INFINITY),
    [packages]
  );

  const pkgText = (pkg: Package) =>
    lang === 'en' && PACKAGE_EN[pkg.id]
      ? {
          title: PACKAGE_EN[pkg.id].title,
          subtitle: PACKAGE_EN[pkg.id].subtitle,
          description: PACKAGE_EN[pkg.id].description,
          benefits: PACKAGE_EN[pkg.id].benefits
        }
      : {
          title: pkg.title,
          subtitle: pkg.subtitle,
          description: pkg.description,
          benefits: pkg.benefits
        };

  const packageHighlights = (pkg: Package) =>
    Object.values(pkg.details)
      .flatMap((items) => items ?? [])
      .slice(0, 4);

  const categories = Object.values(CATEGORIES);
  const byCategory = categories.map((category) => ({
    category,
    packages: packages.filter((pkg) => pkg.category === category)
  }));

  const steps = [
    { icon: Check, title: copy.chooseTitle, body: copy.chooseBody },
    { icon: Sparkles, title: copy.customizeTitle, body: copy.customizeBody },
    { icon: FileText, title: copy.approveTitle, body: copy.approveBody }
  ];

  return (
    <>
      <ArtDefsHost />

      <section className="border-b border-[#EAE3D2] bg-[#2c241a] text-[#F7F0E4]" aria-label={copy.announcementMinimum}>
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-1 px-4 py-2.5 text-center text-xs font-bold sm:flex-row sm:gap-6">
          <span>
            {copy.announcementMinimum}: <bdi dir="ltr">₪{minimumOrder.toLocaleString()}</bdi>
          </span>
          <span className="hidden h-3 w-px bg-white/30 sm:block" aria-hidden="true" />
          <span className="inline-flex items-center gap-1.5 text-[#EAE3D2]/85">
            <Truck className="h-3.5 w-3.5" aria-hidden="true" />
            {copy.announcementDelivery}
          </span>
        </div>
      </section>

      <section className="hero-glow relative overflow-hidden bg-white pb-16 pt-12 sm:pt-16">
        <div className="float-slow pointer-events-none absolute -end-32 -top-32 h-96 w-96 rounded-full bg-[#B29259]/15 blur-3xl" aria-hidden="true" />
        <div
          className="float-slow pointer-events-none absolute -start-24 bottom-0 h-80 w-80 rounded-full bg-[#8C6D3F]/10 blur-3xl"
          style={{ animationDelay: '2s' }}
          aria-hidden="true"
        />

        <div className="relative mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 px-4 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="animate-rise inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.32em] text-gray-500">
              <span className="divider-gold" aria-hidden="true" />
              {copy.heroKicker}
            </div>

            <h2 className="animate-rise-delay-1 font-display mt-6 text-[clamp(2.6rem,7vw,4.8rem)] font-extrabold leading-[1.02] tracking-tight text-gray-900">
              {copy.heroLine1}
              <br />
              <span className="italic text-[#B29259]">{copy.heroAccent}</span>
              <br />
              {copy.heroLine2}
            </h2>

            <p className="animate-rise-delay-2 mt-7 max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg">
              {copy.heroSub}
            </p>

            <div className="animate-rise-delay-3 mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/order"
                className="sheen flex items-center gap-2 rounded-2xl bg-[#8C6D3F] px-7 py-3.5 text-sm font-bold text-white shadow-warm transition-colors hover:bg-[#6d5430]"
              >
                {t('home.ctaOrder')}
                <Arrow className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href="#packages"
                className="rounded-2xl border border-gray-900/15 px-7 py-3.5 text-sm font-bold text-gray-800 transition-colors hover:border-[#B29259] hover:text-[#8C6D3F]"
              >
                {copy.browseCatalog}
              </a>
              <a
                href="https://wa.me/972545740423"
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline flex items-center gap-2 px-3 py-3.5 text-sm font-bold text-gray-600 transition-colors hover:text-[#25D366]"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                {copy.whatsapp}
              </a>
            </div>

            <p className="animate-rise-delay-3 mt-5 text-[11px] text-gray-400">{copy.guestNote}</p>
          </div>

          <div className="animate-rise-delay-2 lg:col-span-5">
            <div className="relative">
              <div className="flex aspect-[4/5] flex-col items-center justify-center gap-10 overflow-hidden rounded-[2.5rem] border border-[#EAE3D2] bg-[#FAF7F2] p-6 shadow-warm">
                <div className="w-full origin-center scale-[1.45]">{renderPackageSVG('chuppah-drapes')}</div>
                <div className="w-full origin-center scale-[1.15] opacity-90">{renderPackageSVG('bar')}</div>
              </div>
              <div className="absolute -bottom-6 end-6 rounded-2xl border border-[#EAE3D2] bg-white px-5 py-3 shadow-warm">
                <div className="text-[10px] font-medium uppercase tracking-[0.28em] text-gray-400">LD Event Design</div>
                <div className="font-display text-base font-bold text-gray-900">{copy.browseCatalog}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#EAE3D2] bg-[#FAF7F2] py-14 sm:py-16">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-gray-500">{copy.stepsKicker}</p>
            <h3 className="font-display mt-3 text-3xl font-extrabold text-gray-900 sm:text-4xl">{copy.stepsTitle}</h3>
          </div>
          <div className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {steps.map(({ icon: Icon, title, body }) => (
              <article key={title} className="card-hover rounded-3xl border border-[#EAE3D2] bg-white p-6 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2E8D8] text-[#8C6D3F]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h4 className="font-display mt-4 text-xl font-bold text-gray-900">{title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="packages" className="scroll-mt-20 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-8 sm:mb-10">
            <div className="text-[11px] font-medium uppercase tracking-[0.32em] text-gray-500">
              <span className="divider-gold" aria-hidden="true" /> {copy.catalogKicker}
            </div>
            <h3 className="gradient-text font-display mt-3 inline-block text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {copy.catalogTitle}
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600">{copy.catalogSub}</p>
          </div>

          <nav className="mb-10 flex flex-wrap gap-2" aria-label={copy.catalogTitle}>
            {byCategory.map(({ category }) => (
              <a
                key={category}
                href={`#cat-${categories.indexOf(category)}`}
                className="rounded-full border border-[#EAE3D2] bg-[#FAF7F2] px-3.5 py-2 text-xs font-bold text-[#8C6D3F] transition-colors hover:border-[#B29259] hover:bg-white"
              >
                {categoryLabel(category, lang)}
              </a>
            ))}
          </nav>

          <div className="space-y-14">
            {byCategory.map(({ category, packages: categoryPackages }) => (
              <section key={category} id={`cat-${categories.indexOf(category)}`} className="scroll-mt-24" aria-labelledby={`cat-title-${categories.indexOf(category)}`}>
                <h4 id={`cat-title-${categories.indexOf(category)}`} className="font-display mb-5 flex items-center gap-3 text-2xl font-bold text-gray-900">
                  <span className="divider-gold" aria-hidden="true" />
                  {categoryLabel(category, lang)}
                </h4>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryPackages.map((pkg) => {
                    const text = pkgText(pkg);
                    const highlights = packageHighlights(pkg);
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
                          <strong className="text-xl font-black text-[#8C6D3F]" dir="ltr">₪{pkg.price.toLocaleString()}</strong>
                        </div>

                        <details className="group mt-4 rounded-2xl border border-[#EAE3D2] bg-white p-3">
                          <summary className="cursor-pointer list-none text-sm font-bold text-gray-800 marker:hidden">
                            <span className="flex items-center justify-between gap-2">
                              {copy.details}
                              <span className="text-lg text-[#B29259] transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                            </span>
                          </summary>
                          <div className="mt-3 border-t border-[#EAE3D2] pt-3">
                            <p className="text-xs leading-relaxed text-gray-600">{text.description}</p>
                            {highlights.length > 0 && (
                              <ul className="mt-3 space-y-2 text-xs text-gray-700">
                                {highlights.map((item) => (
                                  <li key={item} className="flex items-start gap-2">
                                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                            {tiers.length > 0 && (
                              <div className="mt-4">
                                <p className="text-[11px] font-bold text-gray-500">{copy.tiers}</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {tiers.map(([tables, price]) => (
                                    <span key={tables} className="rounded-full bg-[#F2E8D8] px-2.5 py-1 text-[11px] font-bold text-[#6d5430]">
                                      {tables} {copy.tables} · <bdi dir="ltr">₪{price.toLocaleString()}</bdi>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </details>

                        {text.benefits && (
                          <p className="mt-3 inline-flex items-start gap-1.5 text-[11px] font-bold text-emerald-700">
                            <Gift className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            {text.benefits}
                          </p>
                        )}

                        <Link
                          to={`/order?package=${encodeURIComponent(pkg.id)}`}
                          aria-label={`${copy.orderPackage}: ${text.title}`}
                          className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#8C6D3F] py-3 text-xs font-bold text-white transition-colors hover:bg-[#6d5430]"
                        >
                          {copy.orderPackage}
                          <Arrow className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#EAE3D2] bg-[#FAF7F2] py-10">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-4 sm:grid-cols-3">
          {[
            { icon: Gift, text: `${copy.minimumReminder}: ₪${minimumOrder.toLocaleString()}` },
            { icon: Truck, text: copy.deliveryReminder },
            { icon: Calendar, text: copy.finalPriceReminder }
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 rounded-2xl border border-[#EAE3D2] bg-white p-4 text-sm font-bold text-gray-700">
              <Icon className="h-5 w-5 shrink-0 text-[#B29259]" aria-hidden="true" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#8C6D3F] via-[#a8854e] to-[#B29259] px-6 py-12 text-center shadow-warm sm:px-14 sm:py-16">
            <Sparkles className="mx-auto mb-4 h-7 w-7 text-white/70" aria-hidden="true" />
            <h3 className="font-display mx-auto max-w-2xl text-2xl font-extrabold leading-tight text-white sm:text-4xl">{copy.ctaTitle}</h3>
            <p className="mx-auto mt-4 max-w-lg text-sm text-white/80 sm:text-base">{copy.ctaSub}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/order"
                className="sheen flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-bold text-[#8C6D3F] transition-colors hover:bg-[#FAF7F2]"
              >
                {copy.ctaStart}
                <Arrow className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href="https://wa.me/972545740423"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-2xl border border-white/40 px-7 py-3.5 text-sm font-bold text-white transition-colors hover:border-white"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                {copy.whatsapp}
              </a>
            </div>

            <div className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-4 border-t border-white/20 pt-8">
              {[
                { number: String(packages.length), label: copy.statsPackages },
                { number: String(categories.length), label: copy.statsCategories },
                { number: '✓', label: copy.statsProcess }
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-display text-2xl font-extrabold text-white sm:text-3xl">{stat.number}</div>
                  <div className="mt-1 text-[11px] text-white/70">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
