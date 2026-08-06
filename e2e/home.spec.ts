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

  test('guest can view the full package catalog without logging in', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('חבילת עיצוב חתונה - Classic S')).toBeVisible();
    await expect(page.getByText('עמדות בר מתוק').first()).toBeVisible();
    await expect(page.getByText('לא צריך להירשם כדי לבצע הזמנה.')).toBeVisible();
  });

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
