import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { I18nProvider } from '../i18n/i18n';
import { SiteLayout } from './SiteLayout';

const auth = vi.hoisted(() => ({
  value: { user: null as { email?: string } | null, role: 'guest', signOut: vi.fn() }
}));

vi.mock('../auth/AuthProvider', () => ({ useAuth: () => auth.value }));

const renderLayout = (initialEntry = '/') =>
  render(
    <I18nProvider>
      <MemoryRouter initialEntries={[initialEntry]}><SiteLayout><div>CHILD</div></SiteLayout></MemoryRouter>
    </I18nProvider>
  );

beforeEach(() => {
  auth.value = { user: null, role: 'guest', signOut: vi.fn() };
  document.body.style.overflow = '';
  window.localStorage.clear();
});

describe('SiteLayout', () => {
  it('renders the luxury brand shell and children', () => {
    renderLayout();
    expect(screen.getByText('CHILD')).toBeInTheDocument();
    expect(screen.getAllByText('LD Event Design').length).toBeGreaterThan(0);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('highlights the active header destination with the brand color', () => {
    const homeRender = renderLayout('/');
    let header = within(screen.getByRole('banner'));
    let homeLink = header.getByRole('link', { name: 'בית' });
    let buildLink = header.getByRole('link', { name: 'בניית חבילה' });

    expect(homeLink).toHaveAttribute('aria-current', 'page');
    expect(homeLink).toHaveClass('bg-gradient-to-r', 'text-white');
    expect(buildLink).not.toHaveAttribute('aria-current');
    homeRender.unmount();

    const buildRender = renderLayout('/#packages');
    header = within(screen.getByRole('banner'));
    homeLink = header.getByRole('link', { name: 'בית' });
    buildLink = header.getByRole('link', { name: 'בניית חבילה' });

    expect(buildLink).toHaveAttribute('aria-current', 'location');
    expect(buildLink).toHaveClass('bg-gradient-to-r', 'text-white');
    expect(homeLink).not.toHaveAttribute('aria-current');
    buildRender.unmount();

    auth.value = { user: { email: 'admin@example.com' }, role: 'admin', signOut: vi.fn() };
    renderLayout('/admin');
    header = within(screen.getByRole('banner'));
    const adminLink = header.getByRole('link', { name: 'ניהול' });

    expect(adminLink).toHaveAttribute('aria-current', 'page');
    expect(adminLink).toHaveClass('bg-gradient-to-r', 'text-white');
    expect(header.getByRole('link', { name: 'בית' })).not.toHaveAttribute('aria-current');
  });

  it('keeps customer authentication quiet and exposes a dedicated manager login', () => {
    renderLayout();
    const header = within(screen.getByRole('banner'));
    expect(header.getByRole('link', { name: /עגלת קניות: 0/ })).toBeInTheDocument();
    expect(header.queryByRole('link', { name: /הרשמה|התחברות/ })).not.toBeInTheDocument();
    expect(header.queryByRole('link', { name: 'האזור שלי' })).not.toBeInTheDocument();
    expect(header.queryByRole('link', { name: 'ניהול' })).not.toBeInTheDocument();

    const managerLogin = within(screen.getByRole('contentinfo')).getByRole('link', { name: 'כניסת מנהלת' });
    expect(managerLogin).toHaveAttribute('href', '/login');
  });

  it('opens and closes the slide-in quote cart from the header', async () => {
    renderLayout();
    fireEvent.click(within(screen.getByRole('banner')).getByRole('link', { name: /עגלת קניות: 0/ }));

    const drawer = screen.getByRole('dialog', { name: 'סל הצעת מחיר' });
    await waitFor(() => expect(drawer).toHaveFocus());
    expect(screen.getByText('הסל מחכה לעיצוב שלכם')).toBeInTheDocument();
    expect(document.body).toHaveStyle({ overflow: 'hidden' });

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'סל הצעת מחיר' })).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });

  it('closes the cart drawer from its close action', () => {
    renderLayout();
    fireEvent.click(within(screen.getByRole('banner')).getByRole('link', { name: /עגלת קניות: 0/ }));
    const drawer = screen.getByRole('dialog', { name: 'סל הצעת מחיר' });
    fireEvent.click(within(drawer).getByRole('button', { name: 'סגירה' }));
    expect(screen.queryByRole('dialog', { name: 'סל הצעת מחיר' })).not.toBeInTheDocument();
  });

  it('shows account and logout for a customer but not management', () => {
    auth.value = { user: { email: 'customer@example.com' }, role: 'customer', signOut: vi.fn() };
    renderLayout();
    const header = within(screen.getByRole('banner'));
    expect(header.getByRole('link', { name: 'האזור שלי' })).toBeInTheDocument();
    expect(header.queryByRole('link', { name: 'ניהול' })).not.toBeInTheDocument();
    expect(header.getByRole('button', { name: /התנתקות/ })).toBeInTheDocument();
  });

  it('shows management for an administrator', () => {
    auth.value = { user: { email: 'admin@example.com' }, role: 'admin', signOut: vi.fn() };
    renderLayout();
    expect(within(screen.getByRole('banner')).getByRole('link', { name: 'ניהול' })).toHaveAttribute('href', '/admin');
    expect(within(screen.getByRole('contentinfo')).getByRole('link', { name: 'ניהול' })).toBeInTheDocument();
  });

  it('calls signOut', () => {
    const signOut = vi.fn();
    auth.value = { user: { email: 'customer@example.com' }, role: 'customer', signOut };
    renderLayout();
    fireEvent.click(screen.getByRole('button', { name: /התנתקות/ }));
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('renders a logged-in user without an email safely', () => {
    auth.value = { user: {}, role: 'customer', signOut: vi.fn() };
    renderLayout();
    expect(screen.getByRole('button', { name: /התנתקות/ })).toBeInTheDocument();
  });

  it('switches language in both directions', () => {
    renderLayout();
    const header = within(screen.getByRole('banner'));
    fireEvent.click(header.getByRole('button', { name: 'EN' }));
    expect(header.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(header.getByRole('link', { name: /Shopping cart: 0/ })).toBeInTheDocument();
    fireEvent.click(header.getByRole('button', { name: 'עברית' }));
    expect(header.getByRole('link', { name: 'בית' })).toBeInTheDocument();
  });

  it('opens the official cancellation policy from the footer', () => {
    renderLayout();
    fireEvent.click(within(screen.getByRole('contentinfo')).getByRole('button', { name: 'מדיניות ביטולים ושינויים' }));
    const dialog = screen.getByRole('dialog', { name: 'מדיניות ביטולים ושינויים' });
    expect(within(dialog).getByText(/מלחמה או מגפה/)).toBeInTheDocument();
    expect(within(dialog).getByText(/30 ימי עסקים/)).toBeInTheDocument();
    expect(within(dialog).getByText(/האחריות על הציוד בזמן האירוע/)).toBeInTheDocument();
  });

  it('opens and closes privacy with Escape', () => {
    renderLayout();
    fireEvent.click(within(screen.getByRole('contentinfo')).getByRole('button', { name: 'מדיניות פרטיות' }));
    expect(screen.getByRole('dialog', { name: 'מדיניות פרטיות' })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'מדיניות פרטיות' })).not.toBeInTheDocument();
  });

  it('closes legal content from the top and bottom actions', () => {
    const first = renderLayout();
    fireEvent.click(within(screen.getByRole('contentinfo')).getByRole('button', { name: 'מדיניות פרטיות' }));
    let dialog = screen.getByRole('dialog', { name: 'מדיניות פרטיות' });
    fireEvent.click(within(dialog).getAllByRole('button', { name: 'סגירה' })[0]);
    expect(screen.queryByRole('dialog', { name: 'מדיניות פרטיות' })).not.toBeInTheDocument();
    first.unmount();

    renderLayout();
    fireEvent.click(within(screen.getByRole('contentinfo')).getByRole('button', { name: 'הצהרת נגישות' }));
    dialog = screen.getByRole('dialog', { name: 'הצהרת נגישות' });
    const closeButtons = within(dialog).getAllByRole('button', { name: 'סגירה' });
    fireEvent.click(closeButtons[closeButtons.length - 1]);
    expect(screen.queryByRole('dialog', { name: 'הצהרת נגישות' })).not.toBeInTheDocument();
  });

  it('closes a legal modal from the backdrop but not its panel', () => {
    renderLayout();
    fireEvent.click(within(screen.getByRole('contentinfo')).getByRole('button', { name: 'מדיניות פרטיות' }));
    const dialog = screen.getByRole('dialog', { name: 'מדיניות פרטיות' });
    fireEvent.click(within(dialog).getByRole('heading', { name: 'מדיניות פרטיות' }));
    expect(screen.getByRole('dialog', { name: 'מדיניות פרטיות' })).toBeInTheDocument();
    fireEvent.click(dialog.parentElement!);
    expect(screen.queryByRole('dialog', { name: 'מדיניות פרטיות' })).not.toBeInTheDocument();
  });

  it('traps focus, locks scrolling and restores focus for legal dialogs', async () => {
    renderLayout();
    const trigger = within(screen.getByRole('contentinfo')).getByRole('button', { name: 'מדיניות פרטיות' });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole('dialog', { name: 'מדיניות פרטיות' });
    await waitFor(() => expect(dialog).toHaveFocus());
    expect(document.body).toHaveStyle({ overflow: 'hidden' });

    const closeButtons = within(dialog).getAllByRole('button', { name: 'סגירה' });
    closeButtons[0].focus();
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(closeButtons[closeButtons.length - 1]).toHaveFocus();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
  });

  it('keeps keyboard focus inside at every Tab edge', async () => {
    renderLayout();
    const trigger = within(screen.getByRole('contentinfo')).getByRole('button', { name: 'מדיניות פרטיות' });
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'מדיניות פרטיות' });
    await waitFor(() => expect(dialog).toHaveFocus());
    const closeButtons = within(dialog).getAllByRole('button', { name: 'סגירה' });
    const first = closeButtons[0];
    const last = closeButtons[closeButtons.length - 1];

    last.focus();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(first).toHaveFocus();

    trigger.focus();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(first).toHaveFocus();

    dialog.focus();
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();

    closeButtons.forEach((button) => button.setAttribute('disabled', ''));
    dialog.focus();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(dialog).toHaveFocus();
  });

  it('opens the accessibility statement from the accessibility widget', () => {
    renderLayout();
    fireEvent.click(screen.getByRole('button', { name: 'פתיחת תפריט נגישות' }));
    const widget = screen.getByRole('dialog', { name: 'נגישות' });
    fireEvent.click(within(widget).getByRole('button', { name: /הצהרת נגישות/ }));
    expect(screen.getByRole('dialog', { name: 'הצהרת נגישות' })).toBeInTheDocument();
  });

  it('marks the English toggle with lang=en and exposes social links', () => {
    renderLayout();
    expect(within(screen.getByRole('banner')).getByRole('button', { name: 'EN' })).toHaveAttribute('lang', 'en');
    const footer = within(screen.getByRole('contentinfo'));
    expect(footer.getByRole('link', { name: 'אינסטגרם LD Event Design' })).toHaveAttribute('href', expect.stringContaining('instagram.com'));
    expect(footer.getByRole('link', { name: 'פייסבוק LD Event Design' })).toHaveAttribute('href', expect.stringContaining('facebook.com'));
  });
});
