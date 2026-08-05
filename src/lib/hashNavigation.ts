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
 * hash changes. Returns a cleanup function for tests or embedded usage.
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

  window.addEventListener('hashchange', onHashChange);
  onHashChange();

  return () => {
    cancelled = true;
    clearPending();
    window.removeEventListener('hashchange', onHashChange);
  };
}
