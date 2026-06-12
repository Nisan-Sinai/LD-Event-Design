import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft, ArrowRight, MessageCircle } from 'lucide-react';
import { useI18n } from '../i18n/i18n';
import { PACKAGES, CATEGORIES, renderPackageSVG } from '../App';
import { categoryLabel } from '../i18n/content';

export function HomePage() {
  const { t, lang } = useI18n();
  const Arrow = lang === 'he' ? ArrowLeft : ArrowRight;

  const cats = Object.values(CATEGORIES).map((cat) => {
    const pkgs = PACKAGES.filter((p) => p.category === cat);
    return {
      cat,
      minPrice: pkgs.length ? Math.min(...pkgs.map((p) => p.price)) : 0,
      svgType: pkgs[0]?.svgType ?? ''
    };
  });

  return (
    <div className="max-w-5xl mx-auto px-4">
      <section className="text-center py-12 sm:py-16">
        <Sparkles className="w-8 h-8 text-[#B29259] mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-2xl sm:text-4xl font-bold text-[#8C6D3F] font-serif leading-tight max-w-2xl mx-auto">
          {t('home.heroTitle')}
        </h2>
        <p className="text-sm sm:text-base text-gray-500 mt-4 max-w-xl mx-auto leading-relaxed">{t('home.heroSub')}</p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
          <Link to="/order" className="bg-[#B29259] hover:bg-[#8C6D3F] text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-colors">
            {t('home.ctaOrder')}
            <Arrow className="w-4 h-4" aria-hidden="true" />
          </Link>
          <a href="#packages" className="bg-white border border-[#EAE3D2] hover:border-[#B29259] text-[#8C6D3F] px-6 py-3 rounded-xl font-bold text-sm transition-colors">
            {t('home.ctaPackages')}
          </a>
          <a href="https://wa.me/972545740423" target="_blank" rel="noopener noreferrer" className="bg-[#25D366] hover:brightness-95 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition">
            <MessageCircle className="w-4 h-4" aria-hidden="true" />
            {t('home.ctaWhatsapp')}
          </a>
        </div>
        <p className="text-[11px] text-gray-400 mt-4">{t('home.guestNote')}</p>
      </section>

      <section id="packages" className="pb-6 scroll-mt-20">
        <h3 className="text-xl font-bold text-[#8C6D3F] text-center mb-6">{t('home.packagesTitle')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cats.map(({ cat, minPrice, svgType }) => (
            <Link key={cat} to="/order" className="bg-white rounded-2xl border border-[#EAE3D2] hover:border-[#B29259] hover:shadow-md p-4 flex flex-col transition-all">
              <div className="bg-[#FAF7F2] rounded-xl p-2 mb-3 flex items-center justify-center border border-[#EAE3D2]">
                {renderPackageSVG(svgType)}
              </div>
              <h4 className="font-bold text-gray-800">{categoryLabel(cat, lang)}</h4>
              <p className="text-xs text-[#8C6D3F] font-bold mt-1">{t('home.from')}₪{minPrice.toLocaleString()}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
