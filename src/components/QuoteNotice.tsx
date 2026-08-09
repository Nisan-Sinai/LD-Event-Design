import { Sparkles } from 'lucide-react';

export function QuoteNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`rounded-[1.75rem] border border-[#E8C5B8] bg-gradient-to-br from-[#FFFDFC] via-[#FDFBF7] to-[#F4E3E3] shadow-[0_18px_50px_rgba(184,134,11,0.08)] ${compact ? 'p-4' : 'p-5 sm:p-6'}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#B8860B] shadow-sm">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </span>
        <p className={`${compact ? 'text-xs' : 'text-sm sm:text-base'} leading-relaxed text-[#2C2C2C]`}>
          <strong className="font-extrabold">לא משלמים כרגע רק בוחרים את ההזמנה ונחזור אליכם להשלמת ההזמנה</strong>
        </p>
      </div>
    </div>
  );
}
