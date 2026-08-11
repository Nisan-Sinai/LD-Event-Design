import { expect, test } from '@playwright/test';

test('promo video appears after packages and serves a real mp4', async ({ page, request }) => {
  await page.goto('/');

  const packages = page.locator('#packages');
  const promo = page.locator('[data-ld-promo-video]');
  await expect(packages).toBeVisible();
  await expect(promo).toBeVisible();

  const isImmediatelyAfter = await packages.evaluate((element) =>
    element.nextElementSibling?.hasAttribute('data-ld-promo-video') ?? false
  );
  expect(isImmediatelyAfter).toBe(true);

  const video = promo.locator('video');
  await expect(video).toHaveAttribute('src', '/media/ld-event-design-promo.mp4');
  await expect(video).toHaveAttribute('controls', '');

  const response = await request.get('/media/ld-event-design-promo.mp4');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('video/mp4');
  expect((await response.body()).byteLength).toBeGreaterThan(100_000);
});

test('product quantity rows stay aligned on mobile', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile alignment regression');
  await page.goto('/');

  const cards = page.locator('#products article');
  await expect(cards.first()).toBeVisible();

  const rows = cards.locator('text=כמות').first();
  await expect(rows).toBeVisible();

  const positions = await cards.evaluateAll((articles) =>
    articles.slice(0, 2).map((article) => {
      const label = Array.from(article.querySelectorAll('*')).find((node) => node.textContent?.trim() === 'כמות');
      return label?.getBoundingClientRect().top ?? -1;
    })
  );

  expect(positions.length).toBe(2);
  expect(Math.abs(positions[0] - positions[1])).toBeLessThanOrEqual(4);
});
