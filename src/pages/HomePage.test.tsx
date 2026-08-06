import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { CATEGORIES, PACKAGES } from '../App';
import { CART_STORAGE_KEY, CartProvider } from '../cart/CartProvider';
import { SHOP_PRODUCTS, SHOP_PRODUCT_CATEGORIES } from '../catalog/shopProducts';
import { renderWithProviders } from '../test/render';
import { HomePage } from './HomePage';

const renderHome = () => renderWithProviders(<CartProvider><HomePage /></CartProvider>);

beforeEach(() => {
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

  it('adds a small product and shows the floating cart', () => {
    renderHome();
    const product = SHOP_PRODUCTS[0];

    fireEvent.click(screen.getByRole('button', { name: `הוספה לסל: ${product.title}` }));

    expect(screen.getByText('עגלת קניות: 1 פריט')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /לצפייה בעגלה/ })).toHaveAttribute('href', '/cart');
    expect(screen.getAllByText('נוסף לסל').length).toBeGreaterThan(0);
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

  it('shop navigation points to product categories and packages', () => {
    const { container } = renderHome();

    expect(container.querySelectorAll('a[href^="#product-category-"]').length).toBe(Object.values(SHOP_PRODUCT_CATEGORIES).length);
    expect(container.querySelector('a[href="#packages"]')).toBeInTheDocument();
  });

  it('shows a WhatsApp contact link', () => {
    renderHome();
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', expect.stringContaining('wa.me'));
  });

  it('renders English storefront content', () => {
    window.localStorage.setItem('ld-lang', 'en');
    renderHome();

    expect(screen.getByText('Event design in a click!')).toBeInTheDocument();
    expect(screen.getAllByText('Small products').length).toBeGreaterThan(0);
    expect(screen.getByText('Wedding Design Package — Classic S')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Add to cart/ }).length).toBeGreaterThan(0);
  });
});
