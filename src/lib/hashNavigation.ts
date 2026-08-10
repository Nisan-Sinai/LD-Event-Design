const DEFAULT_MAX_ATTEMPTS = 20;
const DEFAULT_RETRY_DELAY_MS = 50;

function decodeHash(hash: string): string {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw) return '';

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function isReloadNavigation(): boolean {
  const navigation = window.performance?.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined;
  return navigation?.type === 'reload';
}

export function scrollToHashTarget(hash = window.location.hash): boolean {
  const id = decodeHash(hash);
  if (!id) return false;

  const target = document.getElementById(id);
  if (!target) return false;

  target.scrollIntoView({ block: 'start', behavior: 'auto' });
  return true;
}

/**
 * React mounts asynchronously, so a deep link such as /#packages can be
 * evaluated before the target exists. Retry briefly and also handle later
 * hash changes.
 *
 * A browser refresh is intentionally different: if the previous in-page
 * navigation left a hash such as #packages in the URL, clear that stale hash
 * and keep the refreshed homepage at the top. New hash changes after load
 * still scroll normally.
 */
export function initHashNavigation(
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  retryDelayMs = DEFAULT_RETRY_DELAY_MS
): () => void {
  let cancelled = false;
  let retryTimer: number | undefined;
  let frameId: number | undefined;

  const clearPending = () => {
    if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    if (frameId !== undefined) window.cancelAnimationFrame(frameId);
    retryTimer = undefined;
    frameId = undefined;
  };

  const tryScroll = (attemptsLeft: number) => {
    if (cancelled || !window.location.hash) return;
    if (scrollToHashTarget() || attemptsLeft <= 0) return;

    retryTimer = window.setTimeout(() => tryScroll(attemptsLeft - 1), retryDelayMs);
  };

  const onHashChange = () => {
    clearPending();
    frameId = window.requestAnimationFrame(() => tryScroll(maxAttempts));
  };

  const resetReloadedHash = () => {
    if (!window.location.hash || !isReloadNavigation()) return false;

    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${window.location.search}`
    );

    const scrollToTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    scrollToTop();
    frameId = window.requestAnimationFrame(() => {
      scrollToTop();
      window.history.scrollRestoration = previousScrollRestoration;
      frameId = undefined;
    });
    return true;
  };

  window.addEventListener('hashchange', onHashChange);
  if (!resetReloadedHash()) onHashChange();

  return () => {
    cancelled = true;
    clearPending();
    window.removeEventListener('hashchange', onHashChange);
  };
}
