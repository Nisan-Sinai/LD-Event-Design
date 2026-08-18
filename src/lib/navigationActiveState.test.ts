import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installNavigationActiveState, isBuildPackageViewportActive } from './navigationActiveState';

let rafQueue: FrameRequestCallback[] = [];

function flushRaf() {
  const queue = [...rafQueue];
  rafQueue = [];
  queue.forEach((callback) => callback(0));
}

function addNavigation({ home = true, build = true } = {}) {
  const header = document.createElement('header');
  Object.defineProperty(header, 'offsetHeight', { configurable: true, value: 90 });
  const nav = document.createElement('nav');
  if (home) {
    const link = document.createElement('a');
    link.href = '/';
    link.textContent = 'home';
    nav.append(link);
  }
  if (build) {
    const link = document.createElement('a');
    link.href = '/#packages';
    link.textContent = 'build';
    nav.append(link);
  }
  header.append(nav);
  document.body.append(header);
  return { header, nav };
}

beforeEach(() => {
  document.body.replaceChildren();
  window.history.replaceState({}, '', '/');
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  rafQueue = [];
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    rafQueue.push(callback);
    return rafQueue.length;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('isBuildPackageViewportActive', () => {
  it('keeps the home tab active while the user is still at the top of the home page', () => {
    expect(isBuildPackageViewportActive(720, 90, 0)).toBe(false);
    expect(isBuildPackageViewportActive(200, 90, 100)).toBe(false);
  });

  it('activates package building only after the products section reaches the header', () => {
    expect(isBuildPackageViewportActive(138, 90, 400)).toBe(true);
    expect(isBuildPackageViewportActive(139, 90, 400)).toBe(false);
  });
});

describe('installNavigationActiveState', () => {
  it('is safe when the page shell is not mounted yet and ignores duplicate scheduling', () => {
    const dispose = installNavigationActiveState();
    expect(rafQueue).toHaveLength(1);
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('hashchange'));
    expect(rafQueue).toHaveLength(1);
    flushRaf();
    expect(document.querySelector('header')).toBeNull();
    dispose();
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(rafQueue).toHaveLength(0);
  });

  it('handles a header without nav and a nav missing one of the required links', () => {
    const header = document.createElement('header');
    document.body.append(header);
    let dispose = installNavigationActiveState();
    flushRaf();
    dispose();

    document.body.replaceChildren();
    addNavigation({ build: false });
    dispose = installNavigationActiveState();
    flushRaf();
    dispose();
  });

  it('clears both active states away from the home route', () => {
    window.history.replaceState({}, '', '/cart');
    const { nav } = addNavigation();
    const home = nav.querySelector<HTMLAnchorElement>('a[href="/"]')!;
    const build = nav.querySelector<HTMLAnchorElement>('a[href="/#packages"]')!;
    home.classList.add('bg-gradient-to-r');
    build.classList.add('bg-gradient-to-r');
    home.setAttribute('aria-current', 'page');
    build.setAttribute('aria-current', 'location');

    const dispose = installNavigationActiveState();
    flushRaf();

    expect(home).not.toHaveAttribute('aria-current');
    expect(build).not.toHaveAttribute('aria-current');
    expect(home).toHaveClass('text-[#4A4540]');
    expect(build).toHaveClass('text-[#4A4540]');
    dispose();
  });

  it('keeps Home active without the products section, then switches as scrolling reaches it', () => {
    const { nav } = addNavigation();
    const home = nav.querySelector<HTMLAnchorElement>('a[href="/"]')!;
    const build = nav.querySelector<HTMLAnchorElement>('a[href="/#packages"]')!;
    const dispose = installNavigationActiveState();
    flushRaf();

    expect(home).toHaveAttribute('aria-current', 'page');
    expect(build).not.toHaveAttribute('aria-current');

    const products = document.createElement('section');
    products.id = 'products';
    products.getBoundingClientRect = () => ({
      top: 100,
      left: 0,
      right: 0,
      bottom: 100,
      width: 0,
      height: 0,
      x: 0,
      y: 100,
      toJSON: () => ({})
    });
    document.body.append(products);
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 500 });
    window.dispatchEvent(new Event('scroll'));
    flushRaf();

    expect(build).toHaveAttribute('aria-current', 'location');
    expect(home).not.toHaveAttribute('aria-current');
    expect(build).toHaveClass('bg-gradient-to-r');

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    window.dispatchEvent(new Event('hashchange'));
    flushRaf();
    expect(home).toHaveAttribute('aria-current', 'page');
    dispose();
  });

  it('does not apply queued work after disposal', () => {
    addNavigation();
    const dispose = installNavigationActiveState();
    expect(rafQueue).toHaveLength(1);
    dispose();
    flushRaf();
    expect(document.querySelector('a[href="/"]')).not.toHaveAttribute('aria-current');
  });
});
