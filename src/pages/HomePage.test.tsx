import { fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CATEGORIES, PACKAGES } from '../App';
import { CART_STORAGE_KEY, CartProvider } from '../cart/CartProvider';
import { SHOP_PRODUCTS, SHOP_PRODUCT_CATEGORIES } from '../catalog/shopProducts';
import type { OverrideMap, PackageOverride } from '../lib/packages';
import { renderWithProviders } from '../test/render';

const catalogState = vi.hoisted(() => ({ overrides: {} as OverrideMap }));

vi.mock('../packages/PackagesProvider', () => ({
  usePackages: () => ({
    overrides: catalogState.overrides,
    loading: false,
    refresh: vi.fn(),
    saveOverride: vi.fn(),
    removeOverride: vi.fn()
  })
}));

import { HomePage } from './HomePage';

const renderHome = () => renderWithProviders(<CartProvider><HomePage /></CartProvider>);

function override(input: Partial<PackageOverride> & { package_id: string }): PackageOverride {
  return {
    price: null,
    title: null,
    subtitle: null,
    description: null,
    benefits: null,
    image_url: null,
    category: null,
    svg_type: null,
    pricing_tiers: null,
    hidden: false,
    is_custom: false,
    sort_order: null,
    ...input
  };
}

beforeEach(() => {
  catalogState.overrides = {};
  window.localStorage.removeItem('ld-lang');
  window.localStorage.removeItem(CART_STORAGE_KEY);
});

describe('HomePage', () => {
  it('renders a simple store hero with products and packages entry points', () => {
    renderHome();

    expect(screen.getByText('עיצוב אירועים בקליק!')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'מוצרים קטנים' })).toHaveAttribute('href', '#products');
    expect(screen.getAllByRole('link', { name: 'חבילות' }).length).toBeGreaterThan(0);
    expect(screen.getByText('אין צורך בהרשמה כדי להזמין')).toBeInTheDocument();
  });

  it('shows minimum order and delivery prices', () => {
    renderHome();

    expect(screen.getByText(/מינימום הזמנה ₪2,500/)).toBeInTheDocument();
    expect(screen.getByText(/הובלה, הקמה ופירוק ₪500/)).toBeInTheDocument();
  });

  it('shows the choose, order and love flow', () => {
    renderHome();

    expect(screen.getByText('1. בוחרים')).toBeInTheDocument();
    expect(screen.getByText('2. מזמינים')).toBeInTheDocument();
    expect(screen.getByText('3. מתאהבים')).toBeInTheDocument();
  });

  it('renders compact small-product categories', () => {
    renderHome();

    expect(screen.getAllByText(SHOP_PRODUCT_CATEGORIES.CENTERPIECES).length).toBeGreaterThan(0);
    expect(screen.getAllByText(SHOP_PRODUCT_CATEGORIES.CHUPPAH).length).toBeGreaterThan(0);
    expect(screen.getAllByText(SHOP_PRODUCTS[0].title).length).toBeGreaterThan(0);
    expect(screen.getAllByText(`₪${SHOP_PRODUCTS[0].price.toLocaleString()}`).length).toBeGreaterThan(0);
  });

  it('adds a small product with both card controls and shows plural cart state', () => {
    renderHome();
    const first = SHOP_PRODUCTS[0];
    const second = SHOP_PRODUCTS[1];

    fireEvent.click(screen.getByRole('button', { name: `הוספה לסל: ${first.title}` }));
    const firstArticle = screen.getAllByText(first.title)
      .map((node) => node.closest('article'))
      .find((node): node is HTMLElement => node instanceof HTMLElement)!;
    fireEvent.click(within(firstArticle).getByRole('button', { name: 'נוסף לסל' }));
    fireEvent.click(screen.getByRole('button', { name: `הוספה לסל: ${second.title}` }));

    expect(screen.getByText('עגלת קניות: 3 פריטים')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /לצפייה בעגלה/ })).toHaveAttribute('href', '/cart');
  });

  it('renders package categories and package cards separately', () => {
    renderHome();
    const sample = PACKAGES.find((pkg) => pkg.id === 'classic-s')!;

    expect(screen.getAllByText(CATEGORIES.WEDDING).length).toBeGreaterThan(0);
    expect(screen.getByText(sample.title)).toBeInTheDocument();
    expect(screen.getAllByText('החל מ־').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/₪2,900/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('מה כלול?').length).toBeGreaterThan(0);
  });

  it('adds a package to the same cart', () => {
    renderHome();
    const sample = PACKAGES.find((pkg) => pkg.id === 'classic-s')!;

    fireEvent.click(screen.getByRole('button', { name: `הוספה לסל: ${sample.title}` }));

    expect(screen.getByText('עגלת קניות: 1 פריט')).toBeInTheDocument();
    expect(screen.getAllByText('נוסף לסל').length).toBeGreaterThan(0);
  });

  it('shows product and package images uploaded by the manager', () => {
    const product = SHOP_PRODUCTS[0];
    const pkg = PACKAGES.find((item) => item.id === 'classic-s')!;
    catalogState.overrides = {
      [product.id]: override({ package_id: product.id, image_url: 'https://cdn.example/product.webp' }),
      [pkg.id]: override({ package_id: pkg.id, image_url: 'https://cdn.example/package.webp' })
    };

    renderHome();

    expect(screen.getAllByRole('img', { name: product.title }).length).toBeGreaterThan(0);
    expect(screen.getByRole('img', { name: pkg.title })).toHaveAttribute('src', 'https://cdn.example/package.webp');
  });

  it('omits empty product and package category sections', () => {
    const hiddenProducts = SHOP_PRODUCTS
      .filter((product) => product.category === SHOP_PRODUCT_CATEGORIES.SWEET_BAR)
      .map((product) => [product.id, override({ package_id: product.id, hidden: true })] as const);
    const hiddenPackages = PACKAGES
      .filter((pkg) => pkg.category === CATEGORIES.HENNA)
      .map((pkg) => [pkg.id, override({ package_id: pkg.id, hidden: true })] as const);
    catalogState.overrides = Object.fromEntries([...hiddenProducts, ...hiddenPackages]);

    const { container } = renderHome();
    const productCategoryIndex = Object.values(SHOP_PRODUCT_CATEGORIES).indexOf(SHOP_PRODUCT_CATEGORIES.SWEET_BAR);

    expect(container.querySelector(`#product-category-${productCategoryIndex}`)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: CATEGORIES.HENNA })).not.toBeInTheDocument();
  });

  it('shop navigation points to product categories and packages', () => {
    const { container } = renderHome();

    expect(container.querySelectorAll('a[href^="#product-category-"]').length).toBe(Object.values(SHOP_PRODUCT_CATEGORIES).length);
    expect(container.querySelector('a[href="#packages"]')).toBeInTheDocument();
  });

  it('shows a WhatsApp contact link', () => {
    renderHome();
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', expect.stringContaining('wa.me'));
  });

  it('renders English storefront and built-in package translations', () => {
    window.localStorage.setItem('ld-lang', 'en');
    renderHome();

    expect(screen.getByText('Event design in a click!')).toBeInTheDocument();
    expect(screen.getAllByText('Small products').length).toBeGreaterThan(0);
    expect(screen.getByText('Wedding Design Package — Classic S')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Add to cart/ }).length).toBeGreaterThan(0);
  });

  it('uses the original text for a custom package in English', () => {
    catalogState.overrides = {
      'custom-package': override({
        package_id: 'custom-package',
        title: 'Custom Package',
        subtitle: 'Custom subtitle',
        category: CATEGORIES.WEDDING,
        price: 4100,
        is_custom: true,
        sort_order: 1
      })
    };
    window.localStorage.setItem('ld-lang', 'en');

    renderHome();

    expect(screen.getByText('Custom Package')).toBeInTheDocument();
    expect(screen.getByText('Custom subtitle')).toBeInTheDocument();
  });
});
