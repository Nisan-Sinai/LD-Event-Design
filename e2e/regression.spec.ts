import { test, expect, type Page } from '@playwright/test';

async function fillStep1(page: Page) {
  await page.getByLabel(/שם בעל האירוע/).fill('ישראל ישראלי');
  await page.getByLabel(/שם בעלת האירוע/).fill('דנה ישראלי');
  await page.getByLabel(/טלפון בעל האירוע/).fill('0501111111');
  await page.getByLabel(/טלפון בעלת האירוע/).fill('0502222222');
  await page.getByLabel(/תאריך האירוע/).fill('2026-09-01');
  await page.getByLabel(/מיקום האירוע/).fill('אולמי היער, חדרה');
  await page.getByLabel(/אימייל/).fill('guest@example.com');
}

test.describe('Regression — guest flows', () => {
  test('referral "venue" + name flows into the contract', async ({ page }) => {
    await page.goto('/order');
    await fillStep1(page);
    await page.getByLabel('איך הגעת אלינו?').selectOption('venue');
    await page.getByLabel('שם האולם').fill('אולם הבדיקה');
    await page.getByRole('button', { name: /המשך לבחירת חבילת עיצוב/ }).click();
    await page.getByText('חבילת עיצוב חתונה - Classic S').click();
    await page.getByRole('button', { name: /המשך לתוספות וחתימה/ }).click();
    await expect(page.getByText('הגעת אלינו דרך:')).toBeVisible();
    await expect(page.getByText(/אולם הבדיקה/)).toBeVisible();
  });

  test('step 1 back-to-home returns to the homepage', async ({ page }) => {
    await page.goto('/order');
    await page.getByRole('link', { name: 'חזרה לדף הבית' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1, name: /LD Event Design/ })).toBeVisible();
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
