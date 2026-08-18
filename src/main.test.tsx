import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  render: vi.fn(),
  createRoot: vi.fn(),
  hash: vi.fn(),
  active: vi.fn(),
  secondary: vi.fn(),
  lightbox: vi.fn(),
  promo: vi.fn()
}));

vi.mock('react-dom/client', () => ({
  default: {
    createRoot: m.createRoot
  }
}));
vi.mock('./Root', () => ({ Root: () => null }));
vi.mock('./i18n/i18n', () => ({ I18nProvider: ({ children }: { children: unknown }) => children }));
vi.mock('./lib/hashNavigation', () => ({ initHashNavigation: m.hash }));
vi.mock('./lib/navigationActiveState', () => ({ installNavigationActiveState: m.active }));
vi.mock('./lib/secondaryCatalogMedia', () => ({ installSecondaryCatalogMedia: m.secondary }));
vi.mock('./lib/productImageLightbox', () => ({ installProductImageLightbox: m.lightbox }));
vi.mock('./lib/promoVideo', () => ({ installPromoVideo: m.promo }));

describe('main entrypoint', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    m.render.mockReset();
    m.createRoot.mockReset().mockReturnValue({ render: m.render });
    m.hash.mockReset();
    m.active.mockReset();
    m.secondary.mockReset();
    m.lightbox.mockReset();
    m.promo.mockReset();
    vi.resetModules();
  });

  it('mounts React and installs all storefront enhancements', async () => {
    await import('./main');

    expect(m.createRoot).toHaveBeenCalledWith(document.getElementById('root'));
    expect(m.render).toHaveBeenCalledTimes(1);
    expect(m.hash).toHaveBeenCalledTimes(1);
    expect(m.active).toHaveBeenCalledTimes(1);
    expect(m.secondary).toHaveBeenCalledTimes(1);
    expect(m.lightbox).toHaveBeenCalledTimes(1);
    expect(m.promo).toHaveBeenCalledTimes(1);
  });
});
