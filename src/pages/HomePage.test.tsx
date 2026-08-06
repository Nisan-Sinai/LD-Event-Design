import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { HomePage } from './HomePage';
import { CATEGORIES, PACKAGES } from '../App';
import { CartProvider, CART_STORAGE_KEY } from '../cart/CartProvider';
import { renderWithProviders } from '../test/render';

const renderHome = () => renderWithProviders(<CartProvider><HomePage /></CartProvider>);

beforeEach(() => {
  window.localStorage.removeItem('ld-lang');
  window.localStorage.removeItem(CART_STORAGE_KEY);
});

describe('HomePage', () => {
  it('renders the shop-first hero and cart CTA', () => {
    renderHome();

    expect(screen.getByText('מוסיפים לסל.')).toBeInTheDocument();
    const cartLinks = screen.getAllByRole('link', { name: /לצפייה בעגלה/ });
    expect(cartLinks.length).toBeGreaterThan(0);
    expect(cartLinks[0]).toHaveAttribute('href', '/cart');
  });

  it('shows minimum order and delivery prices', () => {
    renderHome();

    expect(screen.getByText(/מינימום הזמנה/)).toBeInTheDocument();
    expect(screen.getAllByText(/₪2,500/).length).toBeGreaterThan(0);
    expect(screen.getByText(/הובלה, הקמה ופירוק/)).toBeInTheDocument();
    expect(screen.getByText(/₪500/)).toBeInTheDocument();
  });

  it('shows the simple choose, cart and order flow', () => {
    renderHome();

    expect(screen.getByText('1. בוחרים')).toBeInTheDocument();
    expect(screen.getByText('2. מוסיפים לסל')).toBeInTheDocument();
    expect(screen.getByText('3. מזמינים')).toBeInTheDocument();
  });

  it('shows a WhatsApp contact link', () => {
    renderHome();

    const whatsapp = screen.getByRole('link', { name: /שאלה בוואטסאפ/ });
    expect(whatsapp).toHaveAttribute('href', expect.stringContaining('wa.me'));
  });

  it('lists every category as a section heading', () => {
    renderHome();

    expect(screen.getAllByText(categoryHe(CATEGORIES.WEDDING)).length).toBeGreaterThan(0);
    expect(screen.getAllByText('עמדות בר מתוק').length).toBeGreaterThan(0);
  });

  it('renders package cards with starting prices and details', () => {
    renderHome();
    const sample = PACKAGES.find((pkg) => pkg.id === 'classic-s')!;

    expect(screen.getByText(sample.title)).toBeInTheDocument();
    expect(screen.getAllByText('החל מ־').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/₪2,900/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('מה כלול בחבילה?').length).toBeGreaterThan(0);
  });

  it('adds a package to the persistent cart', () => {
    renderHome();
    const sample = PACKAGES.find((pkg) => pkg.id === 'classic-s')!;

    fireEvent.click(screen.getByRole('button', { name: `הוספה לסל: ${sample.title}` }));

    expect(screen.getByRole('button', { name: `הוספה לסל: ${sample.title}` })).toHaveTextContent('נוסף לסל');
    expect(screen.getAllByRole('link', { name: /לצפייה בעגלה · 1 פריט/ }).length).toBeGreaterThan(0);
  });

  it('quick navigation points to every category section', () => {
    const { container } = renderHome();
    const anchors = container.querySelectorAll('a[href^="#cat-"]');

    expect(anchors.length).toBe(Object.values(CATEGORIES).length);
  });

  it('states clearly that registration is not required', () => {
    renderHome();

    expect(screen.getByText('לא צריך להירשם כדי לבצע הזמנה.')).toBeInTheDocument();
  });

  it('renders English shop and package content', () => {
    window.localStorage.setItem('ld-lang', 'en');
    renderHome();

    expect(screen.getByText('Add it to cart.')).toBeInTheDocument();
    expect(screen.getByText('Wedding Design Package — Classic S')).toBeInTheDocument();
    expect(screen.getAllByText('From').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /Add to cart/ }).length).toBeGreaterThan(0);
  });
});

function categoryHe(category: string) {
  return category === 'חתונה' ? 'חתונה' : category;
}
