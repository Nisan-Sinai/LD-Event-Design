import { afterEach, describe, expect, it } from 'vitest';
import { installPromoVideo } from './promoVideo';

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

afterEach(() => {
  document.body.replaceChildren();
  document.documentElement.lang = 'he';
});

describe('installPromoVideo', () => {
  it('mounts after packages, syncs Hebrew and English copy, and cleans up', async () => {
    document.documentElement.lang = 'he';
    const packages = document.createElement('section');
    packages.id = 'packages';
    document.body.append(packages);

    const dispose = installPromoVideo();
    const section = document.querySelector<HTMLElement>('[data-ld-promo-video="true"]');
    expect(section).toBeTruthy();
    expect(packages.nextElementSibling).toBe(section);
    expect(section?.querySelector('[data-promo-copy="title"]')).toHaveTextContent('מהרעיון');
    expect(section?.querySelector('video')).toHaveAttribute('aria-label', 'סרטון תדמית של LD Event Design');

    document.documentElement.lang = 'en';
    await tick();
    expect(section?.querySelector('[data-promo-copy="title"]')).toHaveTextContent('From an idea');
    expect(section?.querySelector('video')).toHaveAttribute('aria-label', 'LD Event Design promotional film');

    dispose();
    expect(document.querySelector('[data-ld-promo-video="true"]')).toBeNull();
  });

  it('waits for lazy content when the packages section is not in the DOM yet', async () => {
    const dispose = installPromoVideo();
    expect(document.querySelector('[data-ld-promo-video="true"]')).toBeNull();

    const packages = document.createElement('section');
    packages.id = 'packages';
    document.body.append(packages);
    await tick();

    expect(document.querySelector('[data-ld-promo-video="true"]')).toBeTruthy();
    dispose();
    expect(document.querySelector('[data-ld-promo-video="true"]')).toBeNull();
  });

  it('removes the promo when home content unmounts and restores it when home returns', async () => {
    const packages = document.createElement('section');
    packages.id = 'packages';
    document.body.append(packages);

    const dispose = installPromoVideo();
    expect(document.querySelector('[data-ld-promo-video="true"]')).toBeTruthy();

    packages.remove();
    await tick();
    expect(document.querySelector('[data-ld-promo-video="true"]')).toBeNull();

    const returnedPackages = document.createElement('section');
    returnedPackages.id = 'packages';
    document.body.append(returnedPackages);
    await tick();

    expect(document.querySelector('[data-ld-promo-video="true"]')).toBeTruthy();
    dispose();
  });

  it('uses Hebrew as the fallback for any language other than English', () => {
    document.documentElement.lang = 'fr';
    const packages = document.createElement('section');
    packages.id = 'packages';
    document.body.append(packages);

    const dispose = installPromoVideo();
    expect(document.querySelector('[data-promo-copy="cta"]')).toHaveTextContent('בואו נבנה');
    dispose();
  });
});
