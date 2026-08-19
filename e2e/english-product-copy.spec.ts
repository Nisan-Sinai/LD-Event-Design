import { test, expect } from '@playwright/test';

test.describe('English storefront product copy', () => {
  test('shows full product titles and subtitles on narrow mobile cards without overlap', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 900 });
    await page.addInitScript(() => {
      window.localStorage.setItem('ld-lang', 'en');
    });

    await page.goto('/');

    const titleText = 'Medium Floral Arrangement in a Decorative Vessel';
    const subtitleText = 'A medium, impressive arrangement for the event';
    const card = page.locator('#products article').filter({ hasText: titleText }).first();
    const title = card.getByRole('heading', { name: titleText });
    const subtitle = card.getByText(subtitleText, { exact: true });

    await expect(card).toBeVisible();
    await expect(title).toBeVisible();
    await expect(subtitle).toBeVisible();

    for (const element of [title, subtitle]) {
      const layout = await element.evaluate((node) => {
        const style = window.getComputedStyle(node);
        return {
          overflow: style.overflow,
          webkitLineClamp: style.webkitLineClamp,
          fullyVisible: node.scrollHeight <= node.clientHeight + 1
        };
      });

      expect(layout.overflow).toBe('visible');
      expect(layout.webkitLineClamp).not.toBe('2');
      expect(layout.fullyVisible).toBe(true);
    }

    const [titleBox, subtitleBox] = await Promise.all([
      title.boundingBox(),
      subtitle.boundingBox()
    ]);

    expect(titleBox).not.toBeNull();
    expect(subtitleBox).not.toBeNull();
    expect(titleBox!.y + titleBox!.height).toBeLessThanOrEqual(subtitleBox!.y + 1);
  });
});
