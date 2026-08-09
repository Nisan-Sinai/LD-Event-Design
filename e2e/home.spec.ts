import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('ld-event-design-lead-popup-dismissed', '1');
    window.localStorage.clear();
  });
});

test.describe('Luxury quote storefront (guest)', () => {
  test('adds a package, opens the slide-in cart and continues to signed checkout', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: /LD Event Design/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'האירוע שלכם. האמנות שלנו.' })).toBeVisible();

    await page.getByRole('button', { name: /הוספה לסל: חבילת עיצוב חתונה - Classic S/ }).click();
    await expect(page.getByRole('link', { name: /עגלת קניות: 1/ })).toBeVisible();

    await page.getByRole('link', { name: /עגלת קניות: 1/ }).click();
    const drawer = page.getByRole('dialog', { name: 'סל הצעת מחיר' });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText('חבילת עיצוב חתונה - Classic S')).toBeVisible();
    await expect(drawer.getByText(/לא משלמים כרגע/)).toBeVisible();

    await drawer.getByRole('link', { name: 'המשך להשלמת בחירת ההזמנה' }).click();
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByRole('heading', { name: 'שליחת בחירת ההזמנה' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'שליחת ההזמנה (ללא תשלום כרגע)' })).toBeVisible();
  });

  test('keeps minimum and delivery messaging out of the homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/לא משלמים כרגע/).first()).toBeVisible();
    await expect(page.getByText('קומפוזיציית פרחים ונרות לשולחן').first()).toBeVisible();
    await expect(page.getByText('חבילת עיצוב חתונה - Classic S')).toBeVisible();

    await expect(page.getByText(/מינימום להזמנה/)).toHaveCount(0);
    await expect(page.getByText(/הובלה.*500/)).toHaveCount(0);
    await expect(page.getByText(/מינימום הזמנה.*2,500/)).toHaveCount(0);
  });

  test('stores free-text event colors plus a custom request', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('צבעי האקססוריז, הפרחים או הבלונים').fill('פרחים לבנים, אקססוריז זהב ובלונים ורודים');
    await page.getByLabel(/יש משהו ספציפי/).fill('קיר צילום פרחוני');

    const preferences = await page.evaluate(() => JSON.parse(window.localStorage.getItem('ld-event-design-design-v1') ?? '{}'));
    expect(preferences).toMatchObject({
      customColors: 'פרחים לבנים, אקססוריז זהב ובלונים ורודים',
      customRequest: 'קיר צילום פרחוני'
    });
    await expect(page.getByLabel('סרטון עיצוב אירוע עם סידורי פרחים')).toBeVisible();
  });

  test('keeps coupon rejection generic and blocks checkout below ₪2,900 only in the cart', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /הוספה לסל: קומפוזיציית פרחים ונרות לשולחן/ }).first().click();
    await page.getByRole('link', { name: /עגלת קניות: 1/ }).click();

    const drawer = page.getByRole('dialog', { name: 'סל הצעת מחיר' });
    await expect(drawer.getByText(/מינימום להזמנה הינו ₪2,900/)).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'יש להגיע למינימום כדי להמשיך' })).toBeDisabled();

    await drawer.getByLabel('יש לכם קוד קופון?').fill('קוד שגוי');
    await drawer.getByRole('button', { name: 'הפעלה' }).click();
    await expect(drawer.getByRole('alert')).toHaveText('הקוד אינו תקין.');
    await expect(drawer.getByRole('status')).toHaveCount(0);
    await expect(drawer.getByText(/הקוד (?:הנכון|התקין) הוא/)).toHaveCount(0);
  });

  for (const width of [360, 390, 430]) {
    test(`keeps the luxury hero and two-column product grid aligned at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');

      await expect(page.getByRole('heading', { name: 'האירוע שלכם. האמנות שלנו.' })).toBeVisible();
      await expect(page.getByRole('link', { name: /הרכבת חבילה אישית/ })).toBeVisible();

      const heroLayout = await page.locator('section').first().evaluate((hero) => {
        const rect = hero.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          viewport: document.documentElement.clientWidth,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
        };
      });
      expect(heroLayout.left).toBeGreaterThanOrEqual(-1);
      expect(heroLayout.right).toBeLessThanOrEqual(heroLayout.viewport + 1);
      expect(heroLayout.overflow).toBeLessThanOrEqual(1);

      await page.locator('#products').scrollIntoViewIfNeeded();
      const productLayout = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll<HTMLElement>('#products article')).slice(0, 4);
        const rects = cards.map((card) => card.getBoundingClientRect());
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          widths: rects.map((rect) => rect.width),
          tops: rects.map((rect) => rect.top),
          lefts: rects.map((rect) => rect.left)
        };
      });

      expect(productLayout.overflow).toBeLessThanOrEqual(1);
      expect(productLayout.widths).toHaveLength(4);
      expect(Math.abs(productLayout.widths[0] - productLayout.widths[1])).toBeLessThanOrEqual(1);
      expect(Math.abs(productLayout.widths[2] - productLayout.widths[3])).toBeLessThanOrEqual(1);
      expect(Math.abs(productLayout.tops[0] - productLayout.tops[1])).toBeLessThanOrEqual(1);
      expect(Math.abs(productLayout.tops[2] - productLayout.tops[3])).toBeLessThanOrEqual(1);
      expect(productLayout.lefts[0]).not.toBe(productLayout.lefts[1]);
    });
  }

  test('resets route navigation to the top and honors cross-page section links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'האירוע שלכם. האמנות שלנו.' })).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200);

    await page.getByRole('link', { name: 'כניסת מנהלת' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(2);

    await page.goto('/cart');
    await page.getByRole('link', { name: 'חזרה לחנות' }).click();
    await expect(page).toHaveURL(/\/#packages$/);
    await expect.poll(() => page.locator('#packages').evaluate((element) => element.getBoundingClientRect().top)).toBeLessThan(190);
    const packagesTop = await page.locator('#packages').evaluate((element) => element.getBoundingClientRect().top);
    expect(packagesTop).toBeGreaterThanOrEqual(0);
  });

  test('switches language to English and back', async ({ page }) => {
    await page.goto('/');
    const header = page.getByRole('banner');
    await header.getByRole('button', { name: 'EN' }).click();
    await expect(header.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(header.getByRole('link', { name: /Shopping cart: 0/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Your celebration. Our art.' })).toBeVisible();
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
