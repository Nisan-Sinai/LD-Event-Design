import { test, expect } from '@playwright/test';

test.describe('Current order builder', () => {
  test('legacy order URL redirects to the active package builder', async ({ page }) => {
    await page.goto('/order');

    await expect(page).toHaveURL(/\/#packages$/);
    await expect(page.locator('#packages')).toBeVisible();
  });

  test('checkout exposes signatures, conditional second host and optional delivery', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('ld-event-design-cart-v1', JSON.stringify([{
        id: 'classic-s',
        title: 'חבילת Classic S',
        subtitle: 'עיצוב חופה ושולחנות',
        category: 'חתונה',
        price: 2900,
        quantity: 1,
        svgType: 'chuppah-s'
      }]));
    });

    await page.goto('/checkout');
    await expect(page.getByRole('heading', { name: 'שליחת בחירת ההזמנה' })).toBeVisible();
    await expect(page.getByLabel(/הוספת שירות הובלה והרכבה/)).not.toBeChecked();
    await expect(page.getByLabel('הקלדת שם מלא לחתימה')).toHaveCount(1);

    await page.getByLabel(/סוג האירוע/).selectOption('wedding');
    await expect(page.getByLabel(/מספר טלפון נוסף/)).toBeVisible();
    await expect(page.getByLabel('הקלדת שם מלא לחתימה')).toHaveCount(2);
  });
});

