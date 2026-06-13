import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../i18n/i18n';
import { AccessibilityWidget } from './AccessibilityWidget';

function renderWidget(onOpenStatement = vi.fn()) {
  render(
    <I18nProvider>
      <AccessibilityWidget onOpenStatement={onOpenStatement} />
    </I18nProvider>
  );
  return onOpenStatement;
}

const openPanel = () => fireEvent.click(screen.getByRole('button', { name: 'פתיחת תפריט נגישות' }));

beforeEach(() => {
  document.documentElement.style.fontSize = '';
  document.body.className = '';
  window.localStorage.clear();
});

describe('AccessibilityWidget', () => {
  it('toggles the panel open and closed', () => {
    renderWidget();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    openPanel();
    expect(screen.getByRole('dialog', { name: 'נגישות' })).toBeInTheDocument();
  });

  it('increases and decreases the root font size', () => {
    renderWidget();
    openPanel();
    fireEvent.click(screen.getByRole('button', { name: /הגדלת טקסט/ }));
    expect(document.documentElement.style.fontSize).toBe('110%');
    fireEvent.click(screen.getByRole('button', { name: /הקטנת טקסט/ }));
    expect(document.documentElement.style.fontSize).toBe('');
  });

  it('toggles contrast, links and readable body classes', () => {
    renderWidget();
    openPanel();
    fireEvent.click(screen.getByRole('button', { name: /ניגודיות/ }));
    expect(document.body.classList.contains('a11y-contrast')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /הדגשת קישורים/ }));
    expect(document.body.classList.contains('a11y-links')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /גופן קריא/ }));
    expect(document.body.classList.contains('a11y-readable')).toBe(true);
    expect(window.localStorage.getItem('ld-a11y')).toContain('contrast');
  });

  it('resets all settings', () => {
    renderWidget();
    openPanel();
    fireEvent.click(screen.getByRole('button', { name: /ניגודיות/ }));
    fireEvent.click(screen.getByRole('button', { name: /איפוס/ }));
    expect(document.body.classList.contains('a11y-contrast')).toBe(false);
  });

  it('opens the accessibility statement and closes the panel', () => {
    const onOpen = renderWidget();
    openPanel();
    fireEvent.click(screen.getByRole('button', { name: /הצהרת נגישות/ }));
    expect(onOpen).toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on Escape', () => {
    renderWidget();
    openPanel();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('restores saved settings from localStorage on mount', () => {
    window.localStorage.setItem('ld-a11y', JSON.stringify({ fontScale: 1.2, contrast: true, links: false, readable: false }));
    renderWidget();
    expect(document.documentElement.style.fontSize).toBe('120%');
    expect(document.body.classList.contains('a11y-contrast')).toBe(true);
  });

  it('survives corrupted localStorage', () => {
    window.localStorage.setItem('ld-a11y', 'not-json');
    renderWidget();
    openPanel();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
