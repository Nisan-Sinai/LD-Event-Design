import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initHashNavigation, scrollToHashTarget } from './hashNavigation';

describe('hashNavigation', () => {
  let stopNavigation: (() => void) | undefined;

  beforeEach(() => {
    document.body.innerHTML = '';
    window.history.replaceState(null, '', '/');
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn()
    });
    Object.defineProperty(window, 'scrollTo', {
      configurable: true,
      writable: true,
      value: vi.fn()
    });
    Object.defineProperty(window.performance, 'getEntriesByType', {
      configurable: true,
      writable: true,
      value: vi.fn(() => [])
    });
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      writable: true,
      value: vi.fn((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      })
    });
    Object.defineProperty(window, 'cancelAnimationFrame', {
      configurable: true,
      writable: true,
      value: vi.fn()
    });
  });

  afterEach(() => {
    stopNavigation?.();
    stopNavigation = undefined;
    vi.restoreAllMocks();
  });

  it('scrolls to an existing decoded hash target', () => {
    const target = document.createElement('section');
    target.id = 'חבילות';
    document.body.appendChild(target);

    expect(scrollToHashTarget('#%D7%97%D7%91%D7%99%D7%9C%D7%95%D7%AA')).toBe(true);
    expect(target.scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'auto' });
  });

  it('returns false for empty or missing targets', () => {
    expect(scrollToHashTarget('')).toBe(false);
    expect(scrollToHashTarget('#missing')).toBe(false);
  });

  it('retries until a React-rendered deep-link target exists', () => {
    let retry: (() => void) | undefined;
    vi.spyOn(window, 'setTimeout').mockImplementation(((handler: TimerHandler) => {
      if (typeof handler === 'function') retry = () => handler();
      return 1;
    }) as typeof window.setTimeout);

    window.history.replaceState(null, '', '/#packages');
    stopNavigation = initHashNavigation(3, 10);

    const target = document.createElement('section');
    target.id = 'packages';
    document.body.appendChild(target);
    retry?.();

    expect(target.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('clears a stale hash and stays at the top when the page is refreshed', () => {
    const target = document.createElement('section');
    target.id = 'packages';
    document.body.appendChild(target);
    window.history.replaceState(null, '', '/#packages');

    vi.mocked(window.performance.getEntriesByType).mockReturnValue([
      { type: 'reload' } as PerformanceNavigationTiming
    ]);

    stopNavigation = initHashNavigation();

    expect(window.location.hash).toBe('');
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
    expect(target.scrollIntoView).not.toHaveBeenCalled();
  });

  it('still handles intentional hash changes after a refreshed page is reset', () => {
    window.history.replaceState(null, '', '/#packages');
    vi.mocked(window.performance.getEntriesByType).mockReturnValue([
      { type: 'reload' } as PerformanceNavigationTiming
    ]);
    stopNavigation = initHashNavigation();

    const target = document.createElement('section');
    target.id = 'cat-1';
    document.body.appendChild(target);

    window.history.replaceState(null, '', '/#cat-1');
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    expect(target.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('handles hash changes after the initial page load', () => {
    stopNavigation = initHashNavigation();
    const target = document.createElement('section');
    target.id = 'cat-1';
    document.body.appendChild(target);

    window.history.replaceState(null, '', '/#cat-1');
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    expect(target.scrollIntoView).toHaveBeenCalledTimes(1);
  });
});
