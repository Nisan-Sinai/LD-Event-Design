import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '../test/render';
import { HomePage } from './HomePage';
import { PACKAGES, CATEGORIES } from '../App';

describe('HomePage', () => {
  it('renders the hero and CTAs', () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText('כמו חלום')).toBeInTheDocument();
    // יש לפחות קישור אחד להתחלת הזמנה
    const orderLinks = screen.getAllByRole('link', { name: /התחלת הזמנה/ });
    expect(orderLinks.length).toBeGreaterThan(0);
    expect(orderLinks[0]).toHaveAttribute('href', '/order');
  });

  it('shows a WhatsApp contact link', () => {
    renderWithProviders(<HomePage />);
    const wa = screen.getAllByRole('link', { name: /וואטסאפ/ })[0];
    expect(wa).toHaveAttribute('href', expect.stringContaining('wa.me'));
  });

  it('lists every category as a section heading', () => {
    renderWithProviders(<HomePage />);
    // 4 קטגוריות → לפחות כותרת אחת לכל אחת (גם בניווט וגם בכותרת הסקשן)
    expect(screen.getAllByText(categoryHe(CATEGORIES.WEDDING)).length).toBeGreaterThan(0);
    expect(screen.getAllByText('עמדות בר מתוק').length).toBeGreaterThan(0);
  });

  it('renders a card for every package with its price', () => {
    renderWithProviders(<HomePage />);
    const sample = PACKAGES.find((p) => p.id === 'classic-s')!;
    expect(screen.getByText(sample.title)).toBeInTheDocument();
    // המחיר מופיע (₪2,900 לדוגמה)
    expect(screen.getAllByText(/₪2,900/).length).toBeGreaterThan(0);
  });

  it('quick-nav anchors point to category sections', () => {
    const { container } = renderWithProviders(<HomePage />);
    const anchors = container.querySelectorAll('a[href^="#cat-"]');
    expect(anchors.length).toBe(Object.values(CATEGORIES).length);
  });

  it('shows the guest note about registering only at confirmation', () => {
    renderWithProviders(<HomePage />);
    expect(within(document.body).getAllByText(/כדי להשלים הזמנה|נרשמים רק/).length).toBeGreaterThan(0);
  });

  it('renders English package text when the language is English', () => {
    window.localStorage.setItem('ld-lang', 'en');
    renderWithProviders(<HomePage />);
    expect(screen.getByText('Wedding Design Package — Classic S')).toBeInTheDocument();
  });
});

function categoryHe(cat: string) {
  return cat === 'חתונה' ? 'חתונה' : cat;
}
