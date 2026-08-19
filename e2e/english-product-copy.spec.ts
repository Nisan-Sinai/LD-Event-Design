import { test, expect } from '@playwright/test';

test.describe('English storefront product copy', () => {
  test('shows the full subtitle on narrow mobile cards', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 900 });
    await page.addInitScript(() => {
      window.localStorage.setItem('ld-lang', 'en');
    });

    await page.goto('/');

    const subtitle = page.getByText('5–6 flower bud vases and candles for a standard table', { exact: true });
    await expect(subtitle).toBeVisible();

    const layout = await subtitle.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        overflow: style.overflow,
        webkitLineClamp: style.webkitLineClamp,
        fullyVisible: element.scrollHeight <= element.clientHeight + 1
      };
    });

    expect(layout.overflow).toBe('visible');
    expect(layout.webkitLineClamp).not.toBe('2');
    expect(layout.fullyVisible).toBe(true);
  });
});
