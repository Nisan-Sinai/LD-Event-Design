import { useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, PlayCircle } from 'lucide-react';

type MediaSlide =
  | { type: 'image'; src: string; alt: string }
  | { type: 'video'; src: string; alt: string }
  | { type: 'art'; content: ReactNode; alt: string };

function isVideo(url: string) {
  return /\.(mp4|webm|mov)(\?.*)?$/i.test(url);
}

function normalizeMediaUrls(mediaUrls?: string[], mediaUrl?: string): string[] {
  const seen = new Set<string>();
  return [...(mediaUrls ?? []), ...(mediaUrl ? [mediaUrl] : [])]
    .map((url) => url.trim())
    .filter((url) => {
      if (!url || seen.has(url)) return false;
      seen.add(url);
      return true;
    });
}

export function PackageMediaCarousel({
  title,
  mediaUrl,
  mediaUrls,
  art
}: {
  title: string;
  mediaUrl?: string;
  mediaUrls?: string[];
  art: ReactNode;
}) {
  const uploadedMedia = normalizeMediaUrls(mediaUrls, mediaUrl).slice(0, 4);
  const slides: MediaSlide[] = [
    ...uploadedMedia.map((url, mediaIndex): MediaSlide => (
      isVideo(url)
        ? { type: 'video', src: url, alt: `סרטון ${title} ${mediaIndex + 1}` }
        : { type: 'image', src: url, alt: uploadedMedia.length > 1 ? `${title} — תמונה ${mediaIndex + 1}` : title }
    )),
    { type: 'art', content: art, alt: `המחשת עיצוב ${title}` }
  ];

  const [index, setIndex] = useState(0);
  const current = slides[index] ?? slides[0];
  const move = (direction: number) => setIndex((value) => (value + direction + slides.length) % slides.length);

  return (
    <div className="group relative aspect-[16/11] overflow-hidden bg-gradient-to-br from-[#FAF6F0] to-[#F4E3E3]">
      {current.type === 'image' && (
        <img src={current.src} alt={current.alt} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
      )}
      {current.type === 'video' && (
        <video src={current.src} aria-label={current.alt} className="h-full w-full object-cover" controls playsInline preload="metadata" />
      )}
      {current.type === 'art' && <div role="img" aria-label={current.alt} className="flex h-full items-center justify-center p-5">{current.content}</div>}

      {current.type === 'video' && (
        <span className="pointer-events-none absolute start-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur">
          <PlayCircle className="h-4 w-4" aria-hidden="true" /> סרטון
        </span>
      )}

      {slides.length > 1 && (
        <>
          <button type="button" onClick={() => move(-1)} aria-label={`תמונה קודמת של ${title}`} className="absolute start-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#2C2C2C] shadow-lg backdrop-blur transition hover:bg-white">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => move(1)} aria-label={`תמונה הבאה של ${title}`} className="absolute end-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#2C2C2C] shadow-lg backdrop-blur transition hover:bg-white">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/25 px-2.5 py-1.5 backdrop-blur">
            {slides.map((slide, slideIndex) => (
              <button key={`${slide.type}-${slideIndex}`} type="button" onClick={() => setIndex(slideIndex)} aria-label={`מעבר למדיה ${slideIndex + 1} של ${title}`} aria-pressed={slideIndex === index} className={`h-1.5 rounded-full transition-all ${slideIndex === index ? 'w-6 bg-white' : 'w-1.5 bg-white/65'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
