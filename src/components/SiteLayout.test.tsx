import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../i18n/i18n';
import { SiteLayout } from './SiteLayout';

const a = vi.hoisted(() => ({
  value: { user: null as { email?: string } | null, role: 'guest', signOut: vi.fn() }
}));
vi.mock('../auth/AuthProvider', () => ({ useAuth: () => a.value }));

const renderLayout = () =>
  render(
    <I18nProvider>
      <MemoryRouter><SiteLayout><div>CHILD</div></SiteLayout></MemoryRouter>
    </I18nProvider>
  );

beforeEach(() => {
  a.value = { user: null, role: 'guest', signOut: vi.fn() };
});

describe('SiteLayout', () => {
  it('renders children and brand', () => {
    renderLayout();
    expect(screen.getByText('CHILD')).toBeInTheDocument();
    expect(screen.getAllByText('LD Event Design').length).toBeGreaterThan(0);
  });

  it('guest sees login/register, not account/admin', () => {
    renderLayout();
    const header = within(screen.getByRole('banner'));
    expect(header.getByRole('link', { name: /התחברות/ })).toBeInTheDocument();
    expect(header.getByRole('link', { name: /הרשמה/ })).toBeInTheDocument();
    expect(header.queryByRole('link', { name: 'האזור שלי' })).not.toBeInTheDocument();
    expect(header.queryByRole('link', { name: 'ניהול' })).not.toBeInTheDocument();
  });

  it('customer sees account + logout, not admin', () => {
    a.value = { user: { email: 'c@x.com' }, role: 'customer', signOut: vi.fn() };
    renderLayout();
    const header = within(screen.getByRole('banner'));
    expect(header.getByRole('link', { name: 'האזור שלי' })).toBeInTheDocument();
    expect(header.queryByRole('link', { name: 'ניהול' })).not.toBeInTheDocument();
    expect(header.getByRole('button', { name: /התנתקות/ })).toBeInTheDocument();
  });

  it('admin sees the admin link', () => {
    a.value = { user: { email: 'luroni704@gmail.com' }, role: 'admin', signOut: vi.fn() };
    renderLayout();
    const header = within(screen.getByRole('banner'));
    expect(header.getByRole('link', { name: 'ניהול' })).toBeInTheDocument();
  });

  it('logout calls signOut', () => {
    const signOut = vi.fn();
    a.value = { user: { email: 'c@x.com' }, role: 'customer', signOut };
    renderLayout();
    fireEvent.click(screen.getByRole('button', { name: /התנתקות/ }));
    expect(signOut).toHaveBeenCalled();
  });

  it('switches language via the toggle', () => {
    renderLayout();
    const header = within(screen.getByRole('banner'));
    fireEvent.click(header.getByRole('button', { name: 'EN' }));
    expect(header.getByRole('link', { name: /Log in/ })).toBeInTheDocument();
  });

  it('opens and closes a legal modal from the footer', () => {
    renderLayout();
    fireEvent.click(screen.getByRole('button', { name: 'מדיניות פרטיות' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the legal modal with the close button', () => {
    renderLayout();
    // קישור "תנאי שימוש" קיים גם ב-footer וגם ב-aria-label של ה-nav — נבחר את הכפתור בפוטר
    fireEvent.click(within(screen.getByRole('contentinfo')).getByRole('button', { name: 'תנאי שימוש' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    // בתוך המודאל יש כפתור X וכפתור "סגירה" — שניהם בשם הנגיש "סגירה"
    fireEvent.click(within(dialog).getAllByRole('button', { name: 'סגירה' })[0]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
