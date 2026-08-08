import { fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CATEGORIES, PACKAGES } from '../App';
import { CART_DESIGN_STORAGE_KEY, CART_STORAGE_KEY, CartProvider } from '../cart/CartProvider';
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
  window.localStorage.removeItem(CART_DESIGN_STORAGE_KEY);
  window.sessionStorage.clear();
});

describe('HomePage', () => {
  it('renders a luxury hero and quote-only package builder', () => {
    renderHome();

    expect(screen.getByText('האירוע שלכם. האמנות שלנו.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /הרכבת חבילה אישית/ })).toHaveAttribute('href', '#products');
    expect(screen.getAllByText(/הרכבת החבילה באתר היא לקבלת הצעת מחיר בלבד/).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'עכשיו מדייקים את הגוונים' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'בואו נרכיב את שפת העיצוב שלכם' })).not.toBeInTheDocument();
  });

  it('critically removes delivery and minimum-order messaging from the homepage', () => {
    renderHome();

    expect(screen.queryByText(/הובלה.*500/)).not.toBeInTheDocument();
    expect(screen.queryByText(/מינימום הזמנה/)).not.toBeInTheDocument();
    expect(screen.queryByText(/מינימום הזמנה.*2,500/)).not.toBeInTheDocument();
  });

  it('keeps every storefront category chip visually uniform', () => {
    renderHome();
    const nav = screen.getByRole('navigation', { name: 'קטגוריות החנות' });
    const links = within(nav).getAllByRole('link');
    const packagesLink = within(nav).getByRole('link', { name: 'חבילות עיצוב' });

    expect(links.length).toBeGreaterThan(1);
    expect(packagesLink.className).toBe(links[0].className);
    expect(packagesLink).toHaveClass('border', 'bg-white', 'text-[#7A5A46]');
    expect(packagesLink).not.toHaveClass('bg-gradient-to-r', 'text-white');
  });

  it('stores separate flower, balloon and table-linen shades plus a custom design request', () => {
    renderHome();

    fireEvent.click(screen.getByRole('button', { name: 'בורדו' }));
    fireEvent.click(screen.getByRole('button', { name: 'שמפניה וזהב' }));
    fireEvent.change(screen.getByLabelText('גוון מדויק / מותאם אישית — מפות וטקסטיל'), { target: { value: 'ירוק זית' } });
    fireEvent.change(screen.getByLabelText(/יש משהו ספציפי/), { target: { value: 'קיר צילום עם פרחים' } });

    const stored = JSON.parse(window.localStorage.getItem(CART_DESIGN_STORAGE_KEY) ?? '{}') as Record<string, unknown>;
    expect(stored).toMatchObject({
      flowerColor: 'בורדו',
      balloonColor: 'שמפניה וזהב',
      tableclothColor: 'ירוק זית',
      customRequest: 'קיר צילום עם פרחים'
    });
  });

  it('renders compact design-product categories and adds products to the cart', () => {
    renderHome();
    const first = SHOP_PRODUCTS[0];

    expect(screen.getAllByText(SHOP_PRODUCT_CATEGORIES.CENTERPIECES).length).toBeGreaterThan(0);
    expect(screen.getAllByText(SHOP_PRODUCT_CATEGORIES.CHUPPAH).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: `הוספה לסל: ${first.title}` }));

    expect(screen.getByText('עגלת קניות: 1 פריט')).toBeInTheDocument();
    expect(screen.getAllByText('רלוונטי לפי הסל').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /לצפייה בעגלה/ })).toHaveAttribute('href', '/cart');
  });

  it('adds an item twice from both product-card controls', () => {
    renderHome();
    const first = SHOP_PRODUCTS[0];

    fireEvent.click(screen.getByRole('button', { name: `הוספה לסל: ${first.title}` }));
    const firstArticle = screen.getAllByText(first.title)
      .map((node) => node.closest('article'))
      .find((node): node is HTMLElement => node instanceof HTMLElement)!;
    fireEvent.click(within(firstArticle).getByRole('button', { name: 'נוסף לסל' }));

    expect(screen.getByText('עגלת קניות: 2 פריטים')).toBeInTheDocument();
  });

  it('renders package categories, media controls and from prices separately', () => {
    renderHome();
    const sample = PACKAGES.find((pkg) => pkg.id === 'classic-s')!;

    expect(screen.getAllByText(CATEGORIES.WEDDING).length).toBeGreaterThan(0);
    expect(screen.getByText(sample.title)).toBeInTheDocument();
    expect(screen.getAllByText('החל מ־').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/₪2,900/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('מה כלול?').length).toBeGreaterThan(0);
    expect(screen.getByRole('img', { name: `המחשת עיצוב ${sample.title}` })).toBeInTheDocument();
  });

  it('adds a package to the same cart', () => {
    renderHome();
    const sample = PACKAGES.find((pkg) => pkg.id === 'classic-s')!;

    fireEvent.click(screen.getByRole('button', { name: `הוספה לסל: ${sample.title}` }));

    expect(screen.getByText('עגלת קניות: 1 פריט')).toBeInTheDocument();
    expect(screen.getAllByText('נוסף לסל').length).toBeGreaterThan(0);
  });

  it('shows product and package media uploaded by the manager', () => {
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

  it('includes social and WhatsApp links', () => {
    renderHome();
    expect(screen.getAllByRole('link', { name: /אינסטגרם|Instagram/ }).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', expect.stringContaining('wa.me'));
  });

  it('renders English storefront and built-in package translations', () => {
    window.localStorage.setItem('ld-lang', 'en');
    renderHome();

    expect(screen.getByText('Your celebration. Our art.')).toBeInTheDocument();
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
