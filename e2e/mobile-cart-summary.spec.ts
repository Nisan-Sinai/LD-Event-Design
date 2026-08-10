import { expect, test } from '@playwright/test';

test('keeps floating controls clear of the sticky cart summary on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.addInitScript(() => {
    window.sessionStorage.setItem('ld-event-design-lead-popup-dismissed', '1');
    window.localStorage.clear();
  });

  await page.goto('/');
  await page.getByRole('button', { name: /הוספה לסל: חבילת עיצוב חתונה - Classic S/ }).click();

  const layout = await page.evaluate(() => {
    const cart = Array.from(document.querySelectorAll<HTMLElement>('div.fixed.bottom-4'))
      .find((element) => element.querySelector('a[href="/cart"]'));
    const whatsapp = document.querySelector<HTMLElement>('a[href^="https://wa.me/"][class*="fixed"]');
    const accessibility = document.querySelector<HTMLElement>('button[aria-label="פתיחת תפריט נגישות"]');
    const main = document.getElementById('main');

    if (!cart || !whatsapp || !accessibility || !main) return null;

    const cartRect = cart.getBoundingClientRect();
    const whatsappRect = whatsapp.getBoundingClientRect();
    const accessibilityRect = accessibility.getBoundingClientRect();

    return {
      cartTop: cartRect.top,
      cartBottom: cartRect.bottom,
      whatsappBottom: whatsappRect.bottom,
      accessibilityBottom: accessibilityRect.bottom,
      mainPaddingBottom: Number.parseFloat(getComputedStyle(main).paddingBottom),
      viewportHeight: window.innerHeight
    };
  });

  expect(layout).not.toBeNull();
  expect(layout!.whatsappBottom).toBeLessThanOrEqual(layout!.cartTop - 4);
  expect(layout!.accessibilityBottom).toBeLessThanOrEqual(layout!.cartTop - 4);
  expect(layout!.mainPaddingBottom).toBeGreaterThanOrEqual(90);
  expect(layout!.cartBottom).toBeLessThan(layout!.viewportHeight);
});
