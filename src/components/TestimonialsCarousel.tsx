import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'שני ואיתי',
    event: 'חתונה',
    initials: 'ש״א',
    quote: 'העיצוב היה מדויק, אלגנטי ומרגש. הרגשנו שכל פרט נבחר במיוחד בשבילנו והאולם נראה כמו חלום.'
  },
  {
    name: 'משפחת לוי',
    event: 'בת מצווה',
    initials: 'מ״ל',
    quote: 'מהרגע הראשון קיבלנו יחס אישי, הקשבה והמון יצירתיות. האורחים לא הפסיקו לצלם ולהחמיא.'
  },
  {
    name: 'נועה ואלעד',
    event: 'חינה',
    initials: 'נ״א',
    quote: 'הצבעים, הפרחים והאווירה התחברו לתמונה אחת מושלמת. התוצאה הייתה הרבה מעבר למה שדמיינו.'
  }
];

export function TestimonialsCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % TESTIMONIALS.length), 6500);
    return () => window.clearInterval(timer);
  }, []);

  const current = TESTIMONIALS[index];
  const move = (direction: number) => setIndex((value) => (value + direction + TESTIMONIALS.length) % TESTIMONIALS.length);

  return (
    <section className="overflow-hidden bg-[#2C2C2C] py-16 text-white sm:py-24" aria-labelledby="testimonials-title">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#E8C5B8]">Love Notes</p>
          <h2 id="testimonials-title" className="font-display mt-3 text-3xl font-black sm:text-5xl">הלקוחות שלנו מספרים</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/65">רגעים שנשארים בלב הרבה אחרי שהאירוע מסתיים.</p>
        </div>

        <div className="relative mx-auto mt-10 max-w-3xl rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-6 text-center shadow-[0_35px_90px_rgba(0,0,0,0.28)] backdrop-blur sm:p-10">
          <Quote className="mx-auto h-9 w-9 text-[#D4AF37]" aria-hidden="true" />
          <blockquote className="font-display mx-auto mt-5 max-w-2xl text-xl font-semibold leading-relaxed sm:text-2xl">“{current.quote}”</blockquote>

          <div className="mt-7 flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-gradient-to-br from-[#F4E3E3] to-[#E8C5B8] text-lg font-black text-[#2C2C2C] shadow-lg" role="img" aria-label={`תמונת פרופיל של ${current.name}`}>{current.initials}</div>
            <strong className="mt-3 text-base">{current.name}</strong>
            <span className="mt-0.5 text-xs text-white/55">{current.event}</span>
            <div className="mt-2 flex gap-0.5" role="img" aria-label="דירוג 5 מתוך 5">
              {Array.from({ length: 5 }, (_, starIndex) => <Star key={starIndex} className="h-4 w-4 fill-[#D4AF37] text-[#D4AF37]" aria-hidden="true" />)}
            </div>
          </div>

          <button type="button" onClick={() => move(-1)} aria-label="המלצה קודמת" className="absolute start-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white backdrop-blur transition hover:bg-white hover:text-[#2C2C2C] sm:start-5">
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => move(1)} aria-label="המלצה הבאה" className="absolute end-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white backdrop-blur transition hover:bg-white hover:text-[#2C2C2C] sm:end-5">
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 flex justify-center gap-2">
          {TESTIMONIALS.map((item, itemIndex) => (
            <button key={item.name} type="button" onClick={() => setIndex(itemIndex)} aria-label={`הצגת ההמלצה של ${item.name}`} aria-pressed={itemIndex === index} className={`h-2 rounded-full transition-all ${itemIndex === index ? 'w-8 bg-[#D4AF37]' : 'w-2 bg-white/25'}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
