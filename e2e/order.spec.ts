import { test, expect } from '@playwright/test';

test.describe('Order wizard (guest)', () => {
  test('guest builds an order through all three steps', async ({ page }) => {
    await page.goto('/order');

    // שלב 1 — פרטי קשר
    await page.getByLabel(/שם בעל האירוע/).fill('ישראל ישראלי');
    await page.getByLabel(/שם בעלת האירוע/).fill('דנה ישראלי');
    await page.getByLabel(/טלפון בעל האירוע/).fill('0501111111');
    await page.getByLabel(/טלפון בעלת האירוע/).fill('0502222222');
    await page.getByLabel(/תאריך האירוע/).fill('2026-09-01');
    await page.getByLabel(/מיקום האירוע/).fill('אולמי היער, חדרה');
    await page.getByLabel(/אימייל/).fill('guest@example.com');
    await page.getByRole('button', { name: /המשך לבחירת חבילת עיצוב/ }).click();

    // שלב 2 — חבילות (אין ברירת מחדל; בוחרים חבילה)
    await expect(page.getByText('מה כלול בחבילה?').first()).toBeVisible();
    await page.getByText('חבילת עיצוב חתונה - Classic S').click();
    await page.getByRole('button', { name: /המשך לתוספות וחתימה/ }).click();

    // שלב 3 — חוזה
    await expect(page.getByText(/תנאי התקשרות/)).toBeVisible();
  });

  test('validation blocks an empty step 1', async ({ page }) => {
    await page.goto('/order');
    await page.getByRole('button', { name: /המשך לבחירת חבילת עיצוב/ }).click();
    await expect(page.getByText('חובה להזין שם בעל האירוע')).toBeVisible();
  });
});
