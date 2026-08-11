import { afterEach, describe, expect, it } from 'vitest';
import { installPromoVideo } from './promoVideo';

let cleanup: (() => void) | undefined;

afterEach(() => {
  cleanup?.();
  cleanup = undefined;
  document.body.innerHTML = '';
  document.documentElement.lang = 'he';
});

describe('promo video section', () => {
  it('mounts immediately after packages with the local branded video', () => {
    document.body.innerHTML = '<section id="packages"></section><section id="design-details"></section>';
    cleanup = installPromoVideo();

    const packages = document.getElementById('packages')!;
    const promo = document.querySelector<HTMLElement>('[data-ld-promo-video]')!;
    const video = promo.querySelector<HTMLVideoElement>('video')!;

    expect(packages.nextElementSibling).toBe(promo);
    expect(promo.textContent).toContain('מהרעיון — לרגע שאי אפשר לשכוח');
    expect(video.getAttribute('src')).toBe('/media/ld-event-design-promo.mp4');
    expect(video.controls).toBe(true);
    expect(video.playsInline).toBe(true);
    expect(video.getAttribute('aria-label')).toBe('סרטון תדמית של LD Event Design');
  });

  it('updates its copy when the storefront language changes', async () => {
    document.body.innerHTML = '<section id="packages"></section>';
    cleanup = installPromoVideo();

    document.documentElement.lang = 'en';
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    const promo = document.querySelector<HTMLElement>('[data-ld-promo-video]')!;
    expect(promo.textContent).toContain('From an idea to a moment you never forget');
    expect(promo.querySelector('video')?.getAttribute('aria-label')).toBe('LD Event Design promotional film');
  });
});
