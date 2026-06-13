import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MessageCircle, Sparkles } from 'lucide-react';
import { useI18n } from '../i18n/i18n';
import { PACKAGES, CATEGORIES, renderPackageSVG } from '../App';
import { categoryLabel } from '../i18n/content';

export function HomePage() {
  const { t, tList, lang } = useI18n();
  const Arrow = lang === 'he' ? ArrowLeft : ArrowRight;

  const cats = Object.values(CATEGORIES).map((cat) => {
    const pkgs = PACKAGES.filter((p) => p.category === cat);
    return {
      cat,
      count: pkgs.length,
      minPrice: pkgs.length ? Math.min(...pkgs.map((p) => p.price)) : 0,
      svgType: pkgs[0]?.svgType ?? ''
    };
  });

  const values = [
    { kicker: '01', title: t('home.value1Title'), body: t('home.value1Body') },
    { kicker: '02', title: t('home.value2Title'), body: t('home.value2Body') },
    { kicker: '03', title: t('home.value3Title'), body: t('home.value3Body') }
  ];

  const marqueeItems = tList('home.marquee');

  return (
    <>
      {/* ============== HERO — עריכתי, דו-טורי ============== */}
      <section className="relative overflow-hidden bg-white hero-glow pb-16 pt-12 sm:pt-16">
        {/* כתמי רקע מרחפים */}
        <div className="float-slow pointer-events-none absolute -end-32 -top-32 h-96 w-96 rounded-full bg-[#B29259]/15 blur-3xl" aria-hidden="true" />
        <div
          className="float-slow pointer-events-none absolute -start-24 bottom-0 h-80 w-80 rounded-full bg-[#8C6D3F]/10 blur-3xl"
          style={{ animationDelay: '2s' }}
          aria-hidden="true"
        />

        <div className="relative max-w-5xl mx-auto px-4 grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          {/* טור טקסט */}
          <div className="lg:col-span-7">
            <div className="animate-rise inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.32em] text-gray-500">
              <span className="divider-gold" aria-hidden="true" />
              {t('home.heroKicker')}
            </div>

            <h2 className="animate-rise-delay-1 font-display mt-6 text-[clamp(2.6rem,7vw,4.8rem)] font-extrabold leading-[1.02] tracking-tight text-gray-900">
              {t('home.heroLine1')}
              <br />
              <span className="italic text-[#B29259]">{t('home.heroAccent')}</span>
              <br />
              {t('home.heroLine2')}
            </h2>

            <p className="animate-rise-delay-2 mt-7 max-w-lg text-base sm:text-lg leading-relaxed text-gray-600">
              {t('home.heroSub')}
            </p>

            <div className="animate-rise-delay-3 mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/order"
                className="sheen bg-[#8C6D3F] hover:bg-[#6d5430] text-white px-7 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-warm transition-colors"
              >
                {t('home.ctaOrder')}
                <Arrow className="w-4 h-4" aria-hidden="true" />
              </Link>
              <a
                href="#packages"
                className="border border-gray-900/15 hover:border-[#B29259] hover:text-[#8C6D3F] text-gray-800 px-7 py-3.5 rounded-2xl font-bold text-sm transition-colors"
              >
                {t('home.ctaPackages')}
              </a>
              <a
                href="https://wa.me/972545740423"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-[#25D366] px-3 py-3.5 transition-colors link-underline"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                {t('home.ctaWhatsapp')}
              </a>
            </div>

            <p className="animate-rise-delay-3 mt-5 text-[11px] text-gray-400">{t('home.guestNote')}</p>
          </div>

          {/* טור איור — מסגרת עריכתית */}
          <div className="animate-rise-delay-2 lg:col-span-5">
            <div className="relative">
              <div className="aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-[#FAF7F2] border border-[#EAE3D2] shadow-warm flex flex-col items-center justify-center gap-10 p-6">
                <div className="w-full scale-[1.45] origin-center">{renderPackageSVG('chuppah-drapes')}</div>
                <div className="w-full scale-[1.15] origin-center opacity-90">{renderPackageSVG('bar')}</div>
              </div>
              {/* תגית כיתוב צפה */}
              <div className="absolute -bottom-6 end-6 rounded-2xl border border-[#EAE3D2] bg-white px-5 py-3 shadow-warm">
                <div className="text-[10px] font-medium uppercase tracking-[0.28em] text-gray-400">{t('home.pickKicker')}</div>
                <div className="font-display text-base font-bold text-gray-900">{t('home.pickTitle')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* פס ערכים — בתוך ה-hero */}
        <div className="relative max-w-5xl mx-auto px-4 mt-14 border-t border-[#EAE3D2]/70 pt-10">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {values.map((v) => (
              <div key={v.kicker} className="flex items-start gap-4">
                <span className="font-display text-3xl font-bold text-[#B29259]">{v.kicker}</span>
                <div>
                  <div className="font-display text-lg font-bold text-gray-900">{v.title}</div>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">{v.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== פס נע ============== */}
      <section aria-hidden="true" className="overflow-hidden border-y border-[#EAE3D2] bg-[#8C6D3F] py-3.5 text-white" dir="ltr">
        <div className="marquee">
          {[0, 1].map((i) => (
            <div key={i} className="flex shrink-0 items-center gap-14 px-7 text-[12px] font-medium uppercase tracking-[0.42em] text-white/85">
              {marqueeItems.map((item, j) => (
                <span key={j}>{item}</span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ============== קטלוג קטגוריות ============== */}
      <section id="packages" className="bg-[#FAF7F2] py-16 sm:py-20 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-10">
            <div className="text-[11px] font-medium uppercase tracking-[0.32em] text-gray-500">
              <span className="divider-gold" aria-hidden="true" /> {t('home.packagesKicker')}
            </div>
            <h3 className="font-display mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900 gradient-text inline-block">
              {t('home.packagesTitle')}
            </h3>
            <p className="mt-3 max-w-xl text-sm text-gray-600 leading-relaxed">{t('home.packagesSub')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {cats.map(({ cat, count, minPrice, svgType }) => (
              <Link
                key={cat}
                to="/order"
                className="card-hover group bg-white rounded-3xl border border-[#EAE3D2] p-5 flex flex-col"
              >
                <div className="bg-[#FAF7F2] rounded-2xl p-2 mb-4 flex items-center justify-center border border-[#EAE3D2] overflow-hidden">
                  {renderPackageSVG(svgType)}
                </div>
                <h4 className="font-display font-bold text-lg text-gray-900">{categoryLabel(cat, lang)}</h4>
                <p className="text-xs text-gray-500 mt-1">
                  {count} {lang === 'he' ? 'חבילות' : 'packages'} · {t('home.from')}₪{minPrice.toLocaleString()}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#8C6D3F] group-hover:gap-3 transition-all">
                  {t('home.viewPackages')}
                  <Arrow className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============== רצועת CTA ============== */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#8C6D3F] via-[#a8854e] to-[#B29259] px-6 py-12 sm:px-14 sm:py-16 text-center shadow-warm">
            <Sparkles className="w-7 h-7 text-white/70 mx-auto mb-4" aria-hidden="true" />
            <h3 className="font-display text-2xl sm:text-4xl font-extrabold text-white leading-tight max-w-2xl mx-auto">
              {t('home.ctaBandTitle')}
            </h3>
            <p className="text-white/80 text-sm sm:text-base mt-4 max-w-lg mx-auto">{t('home.ctaBandSub')}</p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              <Link
                to="/order"
                className="sheen bg-white text-[#8C6D3F] hover:bg-[#FAF7F2] px-7 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2 transition-colors"
              >
                {t('home.ctaOrder')}
                <Arrow className="w-4 h-4" aria-hidden="true" />
              </Link>
              <a
                href="https://wa.me/972545740423"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-white/40 hover:border-white text-white px-7 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                {t('home.ctaWhatsapp')}
              </a>
            </div>

            {/* פס נתונים */}
            <div className="grid grid-cols-3 gap-4 mt-12 border-t border-white/20 pt-8 max-w-lg mx-auto">
              {[
                { num: '100+', label: t('home.statsEvents') },
                { num: String(PACKAGES.length), label: t('home.statsPackages') },
                { num: '✓', label: t('home.statsService') }
              ].map((s, i) => (
                <div key={i}>
                  <div className="font-display text-2xl sm:text-3xl font-extrabold text-white">{s.num}</div>
                  <div className="text-[11px] text-white/70 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
