import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import axe from 'axe-core';
import { I18nProvider } from '../i18n/i18n';

// ספקי auth/Supabase ממוקמקים — מאפשרים רינדור מלא ללא רשת
vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({ user: null, role: 'guest', signOut: vi.fn(), signIn: vi.fn(), signUp: vi.fn(), configured: true }),
  AuthProvider: ({ children }: { children: ReactElement }) => children
}));
vi.mock('../lib/supabase', () => ({
  get isSupabaseConfigured() {
    return true;
  },
  supabase: {}
}));
vi.mock('../lib/submitOrder', () => ({ submitOrder: vi.fn() }));

import App from '../App';
import { SiteLayout } from '../components/SiteLayout';
import { HomePage } from '../pages/HomePage';
import { AuthModal } from '../components/AuthModal';
import { AccessibilityWidget } from '../components/AccessibilityWidget';
import { PackageManager } from '../components/PackageManager';

// axe סורק את כל ה-DOM ב-JS וכבד תחת אינסטרומנטציית כיסוי — נותנים שהות נדיבה.
vi.setConfig({ testTimeout: 30000 });

// בודקים לפי תקני WCAG 2.0/2.1 A+AA. color-contrast מושבת — jsdom לא מחשב צבעים.
const axeOptions: axe.RunOptions = {
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  rules: { 'color-contrast': { enabled: false } }
};

async function expectNoViolations(node: Element) {
  const results = await axe.run(node, axeOptions);
  if (results.violations.length > 0) {
    // הדפסה קריאה של ההפרות לאיתור מהיר
    console.error(JSON.stringify(results.violations.map((v) => ({ id: v.id, help: v.help, nodes: v.nodes.length })), null, 2));
  }
  expect(results.violations).toEqual([]);
}

const wrap = (ui: ReactElement, route = '/') => (
  <I18nProvider>
    <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
  </I18nProvider>
);

afterEach(() => cleanup());

describe('accessibility (axe-core, WCAG A/AA)', () => {
  it('home page has no violations', async () => {
    const { container } = render(wrap(<SiteLayout><HomePage /></SiteLayout>));
    await expectNoViolations(container);
  });

  it('order wizard (step 1) has no violations', async () => {
    const { container } = render(wrap(<App />, '/order'));
    await expectNoViolations(container);
  });

  it('auth modal has no violations', async () => {
    const { container } = render(wrap(<AuthModal open onClose={() => {}} onSuccess={() => {}} />));
    await expectNoViolations(container);
  });

  it('accessibility widget (open) has no violations', async () => {
    const { container, getByRole } = render(
      <I18nProvider>
        <AccessibilityWidget onOpenStatement={() => {}} />
      </I18nProvider>
    );
    fireEvent.click(getByRole('button', { name: 'פתיחת תפריט נגישות' }));
    await expectNoViolations(container);
  });

  it('admin package manager has no violations', async () => {
    const { container } = render(
      <I18nProvider>
        <PackageManager />
      </I18nProvider>
    );
    await expectNoViolations(container);
  });
});
