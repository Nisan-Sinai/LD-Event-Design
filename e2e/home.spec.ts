import { expect, test } from '@playwright/test';

test.describe('Home shop (guest)', () => {
  test('adds a package to cart and continues to guest checkout', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: /LD Event Design/ })).toBeVisible();

    await page.getByRole('button', { name: /הוספה לסל: חבילת עיצוב חתונה - Classic S/ }).click();
    await expect(page.getByRole('link', { name: /עגלת קניות: 1/ })).toBeVisible();

    await page.getByRole('link', { name: /עגלת קניות: 1/ }).click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByText('חבילת עיצוב חתונה - Classic S')).toBeVisible();
    await expect(page.getByText('אין צורך בהרשמה. ממלאים פרטים ומסיימים.')).toBeVisible();

    await page.getByRole('link', { name: /המשך לפרטים ותשלום/ }).click();
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByRole('heading', { name: 'השלמת הזמנה' })).toBeVisible();
  });

  test('guest can view products and packages without logging in', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'קומפוזיציית פרחים ונרות לשולחן' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'חבילת עיצוב חתונה - Classic S' })).toBeVisible();
    await expect(page.getByText('אין צורך בהרשמה כדי להזמין')).toBeVisible();
  });

  for (const width of [360, 390, 430]) {
    test(`keeps the two-column product grid straight at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await page.locator('#products').scrollIntoViewIfNeeded();

      const layout = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll<HTMLElement>('#products article')).slice(0, 4);
        const rects = cards.map((card) => card.getBoundingClientRect());
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          widths: rects.map((rect) => rect.width),
          tops: rects.map((rect) => rect.top),
          lefts: rects.map((rect) => rect.left)
        };
      });

      expect(layout.overflow).toBeLessThanOrEqual(1);
      expect(layout.widths).toHaveLength(4);
      expect(Math.abs(layout.widths[0] - layout.widths[1])).toBeLessThanOrEqual(1);
      expect(Math.abs(layout.widths[2] - layout.widths[3])).toBeLessThanOrEqual(1);
      expect(Math.abs(layout.tops[0] - layout.tops[1])).toBeLessThanOrEqual(1);
      expect(Math.abs(layout.tops[2] - layout.tops[3])).toBeLessThanOrEqual(1);
      expect(layout.lefts[0]).not.toBe(layout.lefts[1]);
    });
  }

  test('switches language to English and back', async ({ page }) => {
    await page.goto('/');
    const header = page.getByRole('banner');
    await header.getByRole('button', { name: 'EN' }).click();
    await expect(header.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(header.getByRole('link', { name: /Shopping cart: 0/ })).toBeVisible();
    await header.getByRole('button', { name: 'עברית' }).click();
    await expect(header.getByRole('link', { name: 'בית' })).toBeVisible();
  });

  test('opens the accessibility widget and increases text size', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'פתיחת תפריט נגישות' }).click();
    await page.getByRole('button', { name: /הגדלת טקסט/ }).click();
    await expect(page.locator('html')).toHaveAttribute('style', /font-size/);
  });
});
