import { useI18n } from '../i18n/i18n';

// מספר הוואטסאפ העסקי (פורמט בינלאומי ל-wa.me)
const WHATSAPP_NUMBER = '972545740423';

/**
 * כפתור צף ליצירת קשר מהיר בוואטסאפ.
 * ממוקם בפינה התחתונה ההפוכה מווידג'ט הנגישות (שיושב ב-start),
 * כך ששניהם לא חופפים. מוסתר בהדפסה.
 */
export function WhatsAppButton() {
  const { t } = useI18n();
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t('whatsapp.prefill'))}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('whatsapp.float')}
      title={t('whatsapp.float')}
      className="fixed bottom-4 end-4 z-[110] no-print group flex items-center gap-2 rounded-full bg-[#25D366] hover:bg-[#1ebe5b] text-white shadow-lg hover:shadow-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1ebe5b]"
    >
      <span className="flex h-14 w-14 items-center justify-center">
        {/* לוגו וואטסאפ */}
        <svg viewBox="0 0 32 32" className="h-7 w-7 fill-current" aria-hidden="true" focusable="false">
          <path d="M16.04 3.2c-7.1 0-12.86 5.76-12.86 12.86 0 2.27.6 4.48 1.73 6.43L3.1 28.8l6.5-1.7a12.8 12.8 0 0 0 6.43 1.64h.01c7.1 0 12.86-5.76 12.86-12.86 0-3.44-1.34-6.67-3.77-9.1a12.78 12.78 0 0 0-9.1-3.78Zm0 23.36h-.01a10.7 10.7 0 0 1-5.45-1.49l-.39-.23-4.04 1.06 1.08-3.94-.25-.4a10.65 10.65 0 0 1-1.63-5.65c0-5.9 4.8-10.7 10.7-10.7 2.86 0 5.54 1.11 7.56 3.14a10.62 10.62 0 0 1 3.13 7.57c0 5.9-4.8 10.69-10.7 10.69Zm5.86-8.01c-.32-.16-1.9-.94-2.19-1.05-.29-.11-.5-.16-.72.16-.21.32-.83 1.05-1.02 1.26-.19.21-.37.24-.69.08-.32-.16-1.36-.5-2.59-1.6-.96-.85-1.6-1.91-1.79-2.23-.19-.32-.02-.5.14-.66.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.74-.99-2.38-.26-.62-.52-.54-.72-.55l-.61-.01c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.66 0 1.57 1.14 3.08 1.3 3.3.16.21 2.25 3.43 5.45 4.81.76.33 1.36.53 1.82.68.77.24 1.46.21 2.01.13.61-.09 1.9-.78 2.17-1.53.27-.75.27-1.39.19-1.53-.08-.13-.29-.21-.61-.37Z" />
        </svg>
      </span>
      {/* תווית מתגלה במסכים גדולים */}
      <span className="hidden sm:block max-w-0 overflow-hidden whitespace-nowrap text-sm font-bold transition-all duration-300 group-hover:max-w-[180px] group-hover:pe-4 group-focus-visible:max-w-[180px] group-focus-visible:pe-4">
        {t('whatsapp.float')}
      </span>
    </a>
  );
}
