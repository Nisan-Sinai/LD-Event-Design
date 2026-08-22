import { expect, test, type Page } from '@playwright/test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

async function dismissLeadPopup(page: Page) {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('ld-event-design-lead-popup-dismissed', '1');
  });
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const metrics = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth
  }));
  expect(Math.max(metrics.document, metrics.body), `${label}: ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(metrics.viewport + 1);
}

async function expectNoSeriousA11yViolations(page: Page, label: string) {
  await page.addScriptTag({ content: axeSource });
  const violations = await page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (context?: Document, options?: unknown) => Promise<{ violations: Array<{ id: string; impact: string | null; help: string; nodes: unknown[] }> }> } }).axe;
    const result = await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }
    });
    return result.violations
      .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
      .map((violation) => ({ id: violation.id, impact: violation.impact, help: violation.help, nodes: violation.nodes.length }));
  });
  expect(violations, `${label} accessibility violations`).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await dismissLeadPopup(page);
  await page.addInitScript(() => window.localStorage.clear());
});

test.describe('Extreme storefront QA', () => {
  test('critical routes are clean, responsive and free of serious WCAG violations', async ({ page }) => {
    const routes = ['/', '/cart', '/login', '/register', '/reset-password'];

    for (const route of routes) {
      const runtimeErrors: string[] = [];
      const onPageError = (error: Error) => runtimeErrors.push(`pageerror: ${error.message}`);
      const onConsole = (message: { type: () => string; text: () => string }) => {
        if (message.type() === 'error' && !message.text().includes('Failed to load resource')) runtimeErrors.push(`console: ${message.text()}`);
      };
      page.on('pageerror', onPageError);
      page.on('console', onConsole);

      const response = await page.goto(route, { waitUntil: 'networkidle' });
      expect(response?.status(), `HTTP status for ${route}`).toBeLessThan(400);
      await expectNoHorizontalOverflow(page, route);
      await expectNoSeriousA11yViolations(page, route);
      expect(runtimeErrors, `runtime errors for ${route}`).toEqual([]);

      page.off('pageerror', onPageError);
      page.off('console', onConsole);
    }
  });

  test('cart state survives reload and all cart entry points land on the dedicated cart page', async ({ page }) => {
    await page.goto('/');
    const firstProductAdd = page.locator('button[aria-label^="הוספה לסל:"]').first();
    await expect(firstProductAdd).toBeVisible();
    await firstProductAdd.click();

    await expect(page.getByRole('link', { name: /עגלת קניות: 1/ })).toBeVisible();
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByRole('link', { name: /עגלת קניות: 1/ })).toBeVisible();

    const headerCart = page.getByRole('link', { name: /עגלת קניות: 1/ });
    await expect(headerCart).toHaveAttribute('href', '/cart');

    const reviewCart = page.getByRole('link', { name: /לסיכום בעגלה|Review in cart/ });
    await expect(reviewCart).toHaveAttribute('href', '/cart');

    await headerCart.click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByRole('heading', { name: 'סל העיצוב שלכם' })).toBeVisible();
    await expect(page.locator('video')).toHaveCount(0);
  });

  test('back-to-shop returns to the real products section and keeps it in view', async ({ page }) => {
    await page.goto('/cart');
    await page.getByRole('link', { name: 'חזרה לחנות' }).click();
    await expect(page).toHaveURL(/\/#products$/);
    const products = page.locator('#products');
    await expect(products).toBeVisible();
    await expect(products).toBeInViewport();
    await expect(page.getByRole('heading', { name: 'פריטי עיצוב', exact: true })).toBeVisible();
  });

  test('add-to-cart text stays readable on narrow mobile cards and click feedback is rendered', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto('/');
    await page.locator('#products').scrollIntoViewIfNeeded();

    const buttons = page.locator('#products button[aria-label^="הוספה לסל:"]');
    expect(await buttons.count()).toBeGreaterThan(0);

    for (let index = 0; index < Math.min(await buttons.count(), 6); index += 1) {
      const button = buttons.nth(index);
      await expect(button).toBeVisible();
      const metrics = await button.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          fontSize: Number.parseFloat(style.fontSize),
          whiteSpace: style.whiteSpace,
          width: element.getBoundingClientRect().width,
          parentWidth: element.parentElement?.getBoundingClientRect().width ?? 0
        };
      });
      expect(metrics.fontSize).toBeGreaterThanOrEqual(11);
      expect(metrics.whiteSpace).toBe('nowrap');
      expect(metrics.width).toBeLessThanOrEqual(metrics.parentWidth + 1);
    }

    const first = buttons.first();
    await first.click();
    await expect(first.locator('[data-cart-add-animation]')).toBeVisible();
    await expectNoHorizontalOverflow(page, '320px add-to-cart cards');
  });

  test('quantity controls, cart subtotal and checkout transition stay coherent', async ({ page }) => {
    await page.goto('/');
    const packageButton = page.getByRole('button', { name: /הוספה לסל: חבילת עיצוב חתונה - Classic S/ });
    await packageButton.click();
    await page.getByRole('button', { name: /הגדלת כמות חבילת עיצוב חתונה - Classic S/ }).click();
    await expect(page.getByRole('link', { name: /עגלת קניות: 2/ })).toBeVisible();

    await page.getByRole('link', { name: /עגלת קניות: 2/ }).click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByText('₪5,800')).toBeVisible();

    const continueLink = page.getByRole('link', { name: 'המשך להשלמת בחירת ההזמנה' });
    await expect(continueLink).toBeEnabled();
    await continueLink.click();
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByRole('heading', { name: 'שליחת בחירת ההזמנה' })).toBeVisible();
  });

  test('RTL/LTR, deep links and keyboard skip navigation remain correct', async ({ page }) => {
    await page.goto('/#packages', { waitUntil: 'networkidle' });
    await expect(page.locator('#packages')).toBeInViewport();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    const skipLink = page.locator('a[href="#main"]').first();
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();

    const header = page.getByRole('banner');
    await header.getByRole('button', { name: 'EN' }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.getByRole('heading', { name: 'Your celebration. Our art.' })).toBeVisible();
    await expectNoHorizontalOverflow(page, 'English storefront');
  });

  test('external links are opener-safe and primary WhatsApp link is valid', async ({ page }) => {
    await page.goto('/');
    const targetBlankLinks = page.locator('a[target="_blank"]');
    expect(await targetBlankLinks.count()).toBeGreaterThan(0);

    for (let index = 0; index < await targetBlankLinks.count(); index += 1) {
      const rel = ((await targetBlankLinks.nth(index).getAttribute('rel')) ?? '').split(/\s+/);
      expect(rel).toEqual(expect.arrayContaining(['noopener', 'noreferrer']));
    }

    await expect(page.getByRole('link', { name: 'דברו איתנו בוואטסאפ' })).toHaveAttribute('href', /https:\/\/wa\.me\/972545740423/);
  });
});
