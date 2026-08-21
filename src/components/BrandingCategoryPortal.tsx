import { lazy, Suspense, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const BrandingManager = lazy(() =>
  import('./BrandingManager').then((module) => ({ default: module.BrandingManager }))
);

export function BrandingCategoryPortal() {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const syncTarget = () => setTarget(document.getElementById('admin-category-management'));
    syncTarget();

    if (typeof MutationObserver === 'undefined') return undefined;
    const observer = new MutationObserver(syncTarget);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{'.space-y-6 > section[aria-labelledby="branding-manager-title"]:has(+ #admin-products){display:none!important}'}</style>
      {target
        ? createPortal(
            <div className="mb-6">
              <Suspense fallback={null}>
                <BrandingManager />
              </Suspense>
            </div>,
            target
          )
        : null}
    </>
  );
}
