const ACTIVE_CLASSES = [
  'bg-gradient-to-r',
  'from-[#B8860B]',
  'to-[#D4AF37]',
  'text-white',
  'shadow-[0_7px_20px_rgba(184,134,11,0.24)]',
  'hover:brightness-105'
];

const INACTIVE_CLASSES = [
  'text-[#4A4540]',
  'hover:bg-white/75',
  'hover:text-[#B8860B]'
];

export function isBuildPackageViewportActive(targetTop: number, headerHeight: number, scrollY: number): boolean {
  return scrollY > 120 && targetTop <= headerHeight + 48;
}

function setActive(link: HTMLAnchorElement | null, active: boolean, current: 'page' | 'location') {
  if (!link) return;
  const add = active ? ACTIVE_CLASSES : INACTIVE_CLASSES;
  const remove = active ? INACTIVE_CLASSES : ACTIVE_CLASSES;
  remove.forEach((className) => link.classList.remove(className));
  add.forEach((className) => link.classList.add(className));
  if (active) link.setAttribute('aria-current', current);
  else link.removeAttribute('aria-current');
}

export function installNavigationActiveState() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return () => {};

  let scheduled = false;
  let disposed = false;

  const apply = () => {
    scheduled = false;
    if (disposed) return;

    const header = document.querySelector<HTMLElement>('header');
    const nav = header?.querySelector<HTMLElement>('nav');
    if (!header || !nav) return;

    const home = nav.querySelector<HTMLAnchorElement>('a[href="/"]');
    const build = nav.querySelector<HTMLAnchorElement>('a[href="/#packages"]');
    if (!home || !build) return;

    if (window.location.pathname !== '/') {
      setActive(home, false, 'page');
      setActive(build, false, 'location');
      return;
    }

    const firstBuildSection = document.getElementById('products');
    const buildActive = firstBuildSection
      ? isBuildPackageViewportActive(firstBuildSection.getBoundingClientRect().top, header.offsetHeight, window.scrollY)
      : false;

    setActive(home, !buildActive, 'page');
    setActive(build, buildActive, 'location');
  };

  const schedule = () => {
    if (scheduled || disposed) return;
    scheduled = true;
    window.requestAnimationFrame(apply);
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.getElementById('root') ?? document.body, { childList: true, subtree: true });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('hashchange', schedule);
  window.addEventListener('popstate', schedule);
  schedule();

  return () => {
    disposed = true;
    observer.disconnect();
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('hashchange', schedule);
    window.removeEventListener('popstate', schedule);
  };
}
