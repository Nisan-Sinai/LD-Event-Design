import { expect, test, type Page } from '@playwright/test';

const PUBLIC_ROUTES = ['/', '/order', '/login', '/register'];

function collectRuntimeFailures(page: Page) {
  const failures: string[] = [];

  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    // External fonts can be blocked in isolated CI networks; application errors may not.
    if (!text.includes('Failed to load resource')) failures.push(`console: ${text}`);
  });
  page.on('requestfailed', (request) => {
    const url = new URL(request.url());
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      failures.push(`requestfailed: ${request.method()} ${url.pathname} — ${request.failure()?.errorText ?? 'unknown'}`);
    }
  });

  return failures;
}

for (const route of PUBLIC_ROUTES) {
  test(`${route} loads cleanly without runtime failures or horizontal overflow`, async ({ page }) => {
    const failures = collectRuntimeFailures(page);
    const response = await page.goto(route, { waitUntil: 'networkidle' });

    expect(response?.status(), `HTTP status for ${route}`).toBeLessThan(400);
    expect(failures, `Runtime failures on ${route}`).toEqual([]);

    const overflow = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth
    }));
    expect(
      Math.max(overflow.document, overflow.body),
      `Horizontal overflow on ${route}: ${JSON.stringify(overflow)}`
    ).toBeLessThanOrEqual(overflow.viewport + 1);
  });
}

test.describe('Production-readiness gates', () => {
  test('direct #packages deep link scrolls the catalog into view', async ({ page }) => {
    await page.goto('/#packages', { waitUntil: 'networkidle' });
    const packages = page.locator('#packages');

    await expect(packages).toBeVisible();
    await expect(packages).toBeInViewport({ ratio: 0.1 });
    await expect(page).toHaveURL(/\/#packages$/);
  });

  test('homepage exposes complete SEO metadata', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/LD Event Design/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /עיצוב אירועים/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://ld-event-design.vercel.app/');
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://ld-event-design.vercel.app/');
  });

  test('new-tab links are protected against opener attacks', async ({ page }) => {
    await page.goto('/');
    const links = page.locator('a[target="_blank"]');
    const count = await links.count();

    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      const rel = (await links.nth(index).getAttribute('rel')) ?? '';
      expect(rel.split(/\s+/)).toEqual(expect.arrayContaining(['noopener', 'noreferrer']));
    }
  });

  test('skip link moves keyboard focus to the main content', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.getByRole('link', { name: /דילוג לתוכן|Skip to content/ });

    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
  });
});
