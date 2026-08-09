import { useEffect, useState } from 'react';
import { Instagram } from 'lucide-react';

const INSTAGRAM_PROFILE_URL = 'https://www.instagram.com/ld_event_design?igsh=MWpsN2c2OWhyY2FsaQ==';

export interface InstagramFeedItem {
  id: string;
  caption: string;
  mediaType: string;
  imageUrl: string;
  permalink: string;
  timestamp: string;
}

interface InstagramFeedResponse {
  configured?: boolean;
  items?: InstagramFeedItem[];
}

type FeedState = 'loading' | 'ready' | 'unavailable';

function imageAlt(item: InstagramFeedItem, index: number) {
  const caption = item.caption.trim();
  if (caption) return caption.length > 120 ? `${caption.slice(0, 117)}…` : caption;
  return `פוסט ${index + 1} מאינסטגרם LD Event Design`;
}

export function InstagramFeedSection() {
  const [items, setItems] = useState<InstagramFeedItem[]>([]);
  const [state, setState] = useState<FeedState>('loading');

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadFeed() {
      try {
        const response = await fetch('/api/instagram', {
          headers: { Accept: 'application/json' },
          signal: controller.signal
        });
        if (!response.ok) throw new Error(`Instagram feed returned ${response.status}`);

        const payload = (await response.json()) as InstagramFeedResponse;
        const nextItems = Array.isArray(payload.items)
          ? payload.items.filter((item) => item.id && item.imageUrl && item.permalink).slice(0, 6)
          : [];

        if (cancelled) return;
        setItems(nextItems);
        setState(nextItems.length > 0 ? 'ready' : 'unavailable');
      } catch (error) {
        if (cancelled || (error instanceof DOMException && error.name === 'AbortError')) return;
        setItems([]);
        setState('unavailable');
      }
    }

    void loadFeed();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return (
    <section className="bg-[#FAF6F0] py-16 sm:py-24" aria-labelledby="instagram-title">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-[#B8860B]">
              <Instagram className="h-4 w-4" aria-hidden="true" /> Live inspiration
            </p>
            <h2 id="instagram-title" className="font-display mt-3 text-4xl font-black text-[#2C2C2C]">מהאינסטגרם שלנו</h2>
          </div>
          <a href={INSTAGRAM_PROFILE_URL} target="_blank" rel="noopener noreferrer" className="rounded-full border border-[#B8860B] px-5 py-2.5 text-xs font-extrabold text-[#7A5A46] transition hover:bg-[#B8860B] hover:text-white">@ld_event_design</a>
        </div>

        {state === 'loading' && (
          <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6" aria-label="טוען תמונות מאינסטגרם" aria-busy="true">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="aspect-square animate-pulse rounded-3xl bg-white/80 shadow-sm" />
            ))}
          </div>
        )}

        {state === 'ready' && (
          <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {items.map((item, index) => (
              <a key={item.id} href={item.permalink} target="_blank" rel="noopener noreferrer" aria-label={`פתיחת הפוסט באינסטגרם — ${imageAlt(item, index)}`} className="group relative aspect-square overflow-hidden rounded-3xl bg-white shadow-sm">
                <img src={item.imageUrl} alt={imageAlt(item, index)} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                {item.mediaType === 'VIDEO' && (
                  <span className="absolute end-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[9px] font-bold text-white backdrop-blur">REEL</span>
                )}
              </a>
            ))}
          </div>
        )}

        {state === 'unavailable' && (
          <div className="mt-8 rounded-[2rem] border border-[#E8C5B8] bg-white px-5 py-8 text-center shadow-sm">
            <Instagram className="mx-auto h-8 w-8 text-[#B8860B]" aria-hidden="true" />
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#6C625A]">לצפייה בתמונות ובסרטונים האחרונים שלנו, עברו ישירות לעמוד האינסטגרם.</p>
            <a href={INSTAGRAM_PROFILE_URL} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex rounded-full bg-[#2C2C2C] px-6 py-3 text-xs font-extrabold text-white transition hover:bg-[#B8860B]">פתיחת האינסטגרם</a>
          </div>
        )}
      </div>
    </section>
  );
}
