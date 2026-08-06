import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '../test/render';
import { HomePage } from './HomePage';
import { PACKAGES, CATEGORIES } from '../App';

describe('HomePage', () => {
  it('renders the storefront hero and primary order CTA', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByText('מתאימים לאירוע.')).toBeInTheDocument();
    const orderLinks = screen.getAllByRole('link', { name: /התחלת הזמנה/ });
    expect(orderLinks.length).toBeGreaterThan(0);
    expect(orderLinks[0]).toHaveAttribute('href', '/order');
  });

  it('shows the minimum order and delivery information', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getAllByText(/מינימום הזמנה באתר/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/₪2,500/).length).toBeGreaterThan(0);
    expect(screen.getByText(/הובלה ותיאום מחושבים/)).toBeInTheDocument();
  });

  it('shows the three-step ordering flow', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByText('1. בוחרים')).toBeInTheDocument();
    expect(screen.getByText('2. מתאימים')).toBeInTheDocument();
    expect(screen.getByText('3. מאשרים')).toBeInTheDocument();
  });

  it('shows a WhatsApp contact link', () => {
    renderWithProviders(<HomePage />);

    const whatsappLinks = screen.getAllByRole('link', { name: /דברו איתנו/ });
    expect(whatsappLinks[0]).toHaveAttribute('href', expect.stringContaining('wa.me'));
  });

  it('lists every category as a section heading', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getAllByText(categoryHe(CATEGORIES.WEDDING)).length).toBeGreaterThan(0);
    expect(screen.getAllByText('עמדות בר מתוק').length).toBeGreaterThan(0);
  });

  it('renders a card for every package with a starting price', () => {
    renderWithProviders(<HomePage />);
    const sample = PACKAGES.find((pkg) => pkg.id === 'classic-s')!;

    expect(screen.getByText(sample.title)).toBeInTheDocument();
    expect(screen.getAllByText('החל מ־').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/₪2,900/).length).toBeGreaterThan(0);
  });

  it('links each package into the order builder with its package id', () => {
    renderWithProviders(<HomePage />);
    const sample = PACKAGES.find((pkg) => pkg.id === 'classic-s')!;

    const packageLink = screen.getByRole('link', {
      name: new RegExp(`להמשך להרכבת הזמנה: ${sample.title}`)
    });
    expect(packageLink).toHaveAttribute('href', `/order?package=${sample.id}`);
  });

  it('quick-nav anchors point to category sections', () => {
    const { container } = renderWithProviders(<HomePage />);
    const anchors = container.querySelectorAll('a[href^="#cat-"]');

    expect(anchors.length).toBe(Object.values(CATEGORIES).length);
  });

  it('shows the guest note about authentication only at final confirmation', () => {
    renderWithProviders(<HomePage />);

    expect(within(document.body).getByText(/ההזדהות נדרשת רק בשלב האישור הסופי/)).toBeInTheDocument();
  });

  it('renders English storefront and package text when the language is English', () => {
    window.localStorage.setItem('ld-lang', 'en');
    renderWithProviders(<HomePage />);

    expect(screen.getByText('Tailor it to your event.')).toBeInTheDocument();
    expect(screen.getByText('Wedding Design Package — Classic S')).toBeInTheDocument();
    expect(screen.getAllByText('From ').length).toBeGreaterThan(0);
  });
});

function categoryHe(category: string) {
  return category === 'חתונה' ? 'חתונה' : category;
}
