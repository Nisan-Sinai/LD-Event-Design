import { test, expect } from '@playwright/test';

test.describe('Current package builder', () => {
  test('legacy order URL redirects to the current package builder without a signature flow', async ({ page }) => {
    await page.goto('/order');

    await expect(page).toHaveURL(/\/#packages$/);
    await expect(page.locator('#packages')).toBeVisible();
    await expect(page.getByText(/חתימה/)).toHaveCount(0);
  });
});
