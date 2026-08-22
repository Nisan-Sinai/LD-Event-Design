function syncHiddenDialogOverlays() {
  document.querySelectorAll<HTMLElement>('div.fixed.inset-0[aria-hidden]').forEach((overlay) => {
    if (!overlay.querySelector('aside[role="dialog"]')) return;
    const hidden = overlay.getAttribute('aria-hidden') === 'true';
    if (hidden) overlay.setAttribute('inert', '');
    else overlay.removeAttribute('inert');
  });
}

export function installInertHiddenOverlays() {
  if (typeof document === 'undefined') return () => {};

  syncHiddenDialogOverlays();
  const observer = new MutationObserver(syncHiddenDialogOverlays);
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['aria-hidden'],
    childList: true,
    subtree: true
  });

  return () => observer.disconnect();
}
