import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initHashNavigation, scrollToHashTarget } from './hashNavigation';

describe('hashNavigation', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    window.history.replaceState(null, '', '/');
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn()
    });
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
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
    vi.useFakeTimers();
    window.history.replaceState(null, '', '/#packages');

    const cleanup = initHashNavigation(3, 10);
    const target = document.createElement('section');
    target.id = 'packages';
    document.body.appendChild(target);

    vi.advanceTimersByTime(10);
    expect(target.scrollIntoView).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it('handles hash changes after the initial page load', () => {
    const cleanup = initHashNavigation();
    const target = document.createElement('section');
    target.id = 'cat-1';
    document.body.appendChild(target);

    window.history.replaceState(null, '', '/#cat-1');
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    expect(target.scrollIntoView).toHaveBeenCalledTimes(1);
    cleanup();
  });
});
