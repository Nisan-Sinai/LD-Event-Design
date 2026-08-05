import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
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
  document.body.style.overflow = '';
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

  it('switches language via the toggle (both directions)', () => {
    renderLayout();
    const header = within(screen.getByRole('banner'));
    fireEvent.click(header.getByRole('button', { name: 'EN' }));
    expect(header.getByRole('link', { name: /Log in/ })).toBeInTheDocument();
    fireEvent.click(header.getByRole('button', { name: 'עברית' }));
    expect(header.getByRole('link', { name: /התחברות/ })).toBeInTheDocument();
  });

  it('opens the accessibility statement from the accessibility widget', () => {
    renderLayout();
    fireEvent.click(screen.getByRole('button', { name: 'פתיחת תפריט נגישות' }));
    const widget = screen.getByRole('dialog', { name: 'נגישות' });
    fireEvent.click(within(widget).getByRole('button', { name: /הצהרת נגישות/ }));
    expect(screen.getByRole('dialog', { name: 'הצהרת נגישות' })).toBeInTheDocument();
  });

  it('opens and closes a legal modal from the footer (Escape only)', () => {
    renderLayout();
    fireEvent.click(screen.getByRole('button', { name: 'מדיניות פרטיות' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'a' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders a logged-in user without an email address safely', () => {
    a.value = { user: {}, role: 'customer', signOut: vi.fn() };
    renderLayout();
    expect(screen.getByRole('button', { name: /התנתקות/ })).toBeInTheDocument();
  });

  it('closes the legal modal with the close button', () => {
    renderLayout();
    fireEvent.click(within(screen.getByRole('contentinfo')).getByRole('button', { name: 'תנאי שימוש' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    fireEvent.click(within(dialog).getAllByRole('button', { name: 'סגירה' })[0]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the legal modal with the bottom "close" action button', () => {
    renderLayout();
    fireEvent.click(within(screen.getByRole('contentinfo')).getByRole('button', { name: 'הצהרת נגישות' }));
    const dialog = screen.getByRole('dialog');
    const closeButtons = within(dialog).getAllByRole('button', { name: 'סגירה' });
    fireEvent.click(closeButtons[closeButtons.length - 1]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the legal modal when clicking the backdrop, but not the panel', () => {
    renderLayout();
    fireEvent.click(within(screen.getByRole('contentinfo')).getByRole('button', { name: 'מדיניות פרטיות' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('heading', { name: 'מדיניות פרטיות' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(dialog);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(dialog.parentElement!);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('moves focus into the legal dialog, traps it, locks scroll and restores the trigger', async () => {
    renderLayout();
    const trigger = within(screen.getByRole('contentinfo')).getByRole('button', { name: 'מדיניות פרטיות' });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole('dialog');
    await waitFor(() => expect(dialog).toHaveFocus());
    expect(document.body).toHaveStyle({ overflow: 'hidden' });

    const closeButtons = within(dialog).getAllByRole('button', { name: 'סגירה' });
    closeButtons[0].focus();
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(closeButtons[closeButtons.length - 1]).toHaveFocus();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
  });

  it('keeps keyboard focus inside the legal dialog for every Tab edge case', async () => {
    renderLayout();
    const trigger = within(screen.getByRole('contentinfo')).getByRole('button', { name: 'מדיניות פרטיות' });
    fireEvent.click(trigger);

    const dialog = screen.getByRole('dialog');
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

    closeButtons.forEach((button) => {
      button.setAttribute('disabled', '');
    });
    dialog.focus();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(dialog).toHaveFocus();
  });

  it('closes safely when the element that had focus is no longer connected', () => {
    renderLayout();
    const detachedTrigger = document.createElement('button');
    document.body.appendChild(detachedTrigger);
    detachedTrigger.focus();

    const legalTrigger = within(screen.getByRole('contentinfo')).getByRole('button', { name: 'מדיניות פרטיות' });
    fireEvent.click(legalTrigger);
    detachedTrigger.remove();
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('marks the English toggle with lang="en" for correct pronunciation by screen readers', () => {
    renderLayout();
    expect(within(screen.getByRole('banner')).getByRole('button', { name: 'EN' })).toHaveAttribute('lang', 'en');
  });
});
