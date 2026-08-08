import { test, expect } from '@playwright/test';

test.describe('Regression — guest flows', () => {
  test('legacy order URL returns to the current package builder', async ({ page }) => {
    await page.goto('/order');
    await expect(page).toHaveURL(/\/#packages$/);
    await expect(page.locator('#packages')).toBeVisible();
  });

  test('language toggle flips the document direction (RTL ↔ LTR)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await page.getByRole('banner').getByRole('button', { name: 'EN' }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await page.getByRole('banner').getByRole('button', { name: 'עברית' }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  test('floating WhatsApp button links to wa.me', async ({ page }) => {
    await page.goto('/');
    const wa = page.getByRole('link', { name: 'דברו איתנו בוואטסאפ' });
    await expect(wa).toHaveAttribute('href', /wa\.me\/972545740423/);
  });
});
