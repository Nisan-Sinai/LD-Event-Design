const PROMO_VIDEO_SRC = 'https://deafgaztsyukmmeqnmvw.supabase.co/storage/v1/object/public/ld-event-design-promo.mp4/WhatsApp%20Video%202026-08-11%20at%2009.55.10.mp4';

const COPY = {
  he: {
    eyebrow: 'LD EVENT DESIGN • מאחורי העיצוב',
    title: 'מהרעיון — לרגע שאי אפשר לשכוח',
    body: 'הצצה קצרה לעולם של LD Event Design: צבעים, פרחים, בלונים ופרטים שמתחברים לאירוע אחד שמרגיש בדיוק שלכם.',
    cta: 'בואו נבנה את האירוע שלכם',
    videoLabel: 'סרטון תדמית של LD Event Design'
  },
  en: {
    eyebrow: 'LD EVENT DESIGN • BEHIND THE DESIGN',
    title: 'From an idea to a moment you never forget',
    body: 'A short look into LD Event Design — colors, florals, balloons and thoughtful details coming together into an event that feels unmistakably yours.',
    cta: 'Build your event',
    videoLabel: 'LD Event Design promotional film'
  }
} as const;

type PromoLanguage = keyof typeof COPY;

function currentLanguage(): PromoLanguage {
  return document.documentElement.lang === 'en' ? 'en' : 'he';
}

function createPromoSection(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'ld-promo-section';
  section.dataset.ldPromoVideo = 'true';
  section.setAttribute('aria-labelledby', 'ld-promo-title');

  const inner = document.createElement('div');
  inner.className = 'ld-promo-inner';

  const copy = document.createElement('div');
  copy.className = 'ld-promo-copy';
  const eyebrow = document.createElement('p');
  eyebrow.className = 'ld-promo-eyebrow';
  eyebrow.dataset.promoCopy = 'eyebrow';
  const title = document.createElement('h2');
  title.id = 'ld-promo-title';
  title.className = 'ld-promo-title';
  title.dataset.promoCopy = 'title';
  const body = document.createElement('p');
  body.className = 'ld-promo-body';
  body.dataset.promoCopy = 'body';
  const cta = document.createElement('a');
  cta.className = 'ld-promo-cta';
  cta.href = '#products';
  cta.dataset.promoCopy = 'cta';
  copy.append(eyebrow, title, body, cta);

  const media = document.createElement('div');
  media.className = 'ld-promo-media';
  const frame = document.createElement('div');
  frame.className = 'ld-promo-frame';
  const video = document.createElement('video');
  video.className = 'ld-promo-video';
  video.src = PROMO_VIDEO_SRC;
  video.controls = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.setAttribute('aria-label', COPY.he.videoLabel);
  frame.append(video);
  media.append(frame);

  inner.append(copy, media);
  section.append(inner);
  return section;
}

function syncPromoLanguage(section: HTMLElement) {
  const copy = COPY[currentLanguage()];
  (section.querySelector('[data-promo-copy="eyebrow"]') as HTMLElement | null)?.replaceChildren(copy.eyebrow);
  (section.querySelector('[data-promo-copy="title"]') as HTMLElement | null)?.replaceChildren(copy.title);
  (section.querySelector('[data-promo-copy="body"]') as HTMLElement | null)?.replaceChildren(copy.body);
  (section.querySelector('[data-promo-copy="cta"]') as HTMLElement | null)?.replaceChildren(copy.cta);
  section.querySelector('video')?.setAttribute('aria-label', copy.videoLabel);
}

export function installPromoVideo(): () => void {
  let section: HTMLElement | null = null;
  let contentObserver: MutationObserver | null = null;
  let languageObserver: MutationObserver | null = null;

  const mount = () => {
    const packages = document.getElementById('packages');
    if (!packages) return false;
    section = document.querySelector<HTMLElement>('[data-ld-promo-video]');
    if (!section) {
      section = createPromoSection();
      packages.insertAdjacentElement('afterend', section);
    }
    syncPromoLanguage(section);
    languageObserver?.disconnect();
    languageObserver = new MutationObserver(() => section && syncPromoLanguage(section));
    languageObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    return true;
  };

  if (!mount()) {
    contentObserver = new MutationObserver(() => {
      if (mount()) {
        contentObserver?.disconnect();
        contentObserver = null;
      }
    });
    contentObserver.observe(document.body, { childList: true, subtree: true });
  }

  return () => {
    contentObserver?.disconnect();
    languageObserver?.disconnect();
    section?.remove();
  };
}
