import { expect, test } from '@playwright/test';

test.describe('branded promo film', () => {
  test('is placed immediately after packages and serves a valid local MP4', async ({ page, request }) => {
    await page.goto('/');

    const packages = page.locator('#packages');
    const promo = page.locator('[data-ld-promo-video]');
    const video = promo.locator('video');

    await expect(packages).toBeVisible();
    await expect(promo).toBeVisible();
    expect(await packages.evaluate((element) => element.nextElementSibling?.getAttribute('data-ld-promo-video'))).toBe('true');

    await expect(video).toHaveAttribute('src', '/media/ld-event-design-promo.mp4');
    await expect(video).toHaveAttribute('controls', '');
    await expect(video).toHaveAttribute('playsinline', '');
    await expect(video).toHaveAttribute('aria-label', /LD Event Design|סרטון תדמית/);

    const videoResponse = await request.get('/media/ld-event-design-promo.mp4');
    expect(videoResponse.status()).toBe(200);
    expect(videoResponse.headers()['content-type']).toContain('video/mp4');
    expect(Number(videoResponse.headers()['content-length'] ?? 0)).toBeGreaterThan(100_000);
  });
});

test.describe('product card geometry', () => {
  test('quantity controls line up across each two-card mobile row', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Mobile two-column layout check');

    await page.goto('/');
    const productSection = page.locator('#products');
    await expect(productSection).toBeVisible();

    const categories = productSection.locator('section[id^="product-category-"]');
    const categoryCount = await categories.count();
    expect(categoryCount).toBeGreaterThan(0);

    for (let categoryIndex = 0; categoryIndex < categoryCount; categoryIndex += 1) {
      const cards = categories.nth(categoryIndex).locator('article');
      const cardCount = await cards.count();

      for (let cardIndex = 0; cardIndex + 1 < cardCount; cardIndex += 2) {
        const firstQuantity = cards.nth(cardIndex).getByRole('group').first();
        const secondQuantity = cards.nth(cardIndex + 1).getByRole('group').first();
        const firstBox = await firstQuantity.boundingBox();
        const secondBox = await secondQuantity.boundingBox();

        expect(firstBox, `Missing quantity control in card ${cardIndex}`).not.toBeNull();
        expect(secondBox, `Missing quantity control in card ${cardIndex + 1}`).not.toBeNull();
        expect(Math.abs(firstBox!.y - secondBox!.y), `Quantity controls are misaligned in category ${categoryIndex}`).toBeLessThanOrEqual(2);
      }
    }
  });
});
