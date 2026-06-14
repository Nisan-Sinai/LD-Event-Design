import { test, expect } from '@playwright/test';

test.describe('Home (guest)', () => {
  test('shows the hero and navigates to the order page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: /LD Event Design/ })).toBeVisible();
    await page.getByRole('link', { name: /התחלת הזמנה/ }).first().click();
    await expect(page).toHaveURL(/\/order$/);
  });

  test('guest can view the full package catalog without logging in', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('חבילת עיצוב חתונה - Classic S')).toBeVisible();
    await expect(page.getByText('עמדות בר מתוק').first()).toBeVisible();
  });

  test('switches language to English and back', async ({ page }) => {
    await page.goto('/');
    const header = page.getByRole('banner');
    await header.getByRole('button', { name: 'EN' }).click();
    await expect(header.getByRole('link', { name: 'Home' })).toBeVisible();
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
