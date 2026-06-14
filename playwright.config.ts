import { defineConfig, devices } from '@playwright/test';

// E2E לזרימות הציבוריות (אורח). מריץ את שרת הפיתוח אוטומטית.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    // מרווח לקראת קומפילציה ראשונית של Vite בשרת קר (הרצה מקבילית מלאה)
    navigationTimeout: 60000,
    actionTimeout: 15000
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
});
