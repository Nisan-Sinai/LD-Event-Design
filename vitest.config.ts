import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const FULL = { lines: 100, functions: 100, branches: 100, statements: 100 };

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // מודולי הלוגיקה של האפליקציה (UI נבדק בבדיקות עשן נפרדות)
      include: [
        'src/lib/pricing.ts',
        'src/lib/orders.ts',
        'src/i18n/content.ts',
        'src/i18n/i18n.tsx',
        'src/auth/roles.ts'
      ],
      // אכיפת 100% על כל מודולי הלוגיקה
      thresholds: {
        'src/lib/pricing.ts': FULL,
        'src/lib/orders.ts': FULL,
        'src/i18n/content.ts': FULL,
        'src/i18n/i18n.tsx': FULL,
        'src/auth/roles.ts': FULL
      }
    }
  }
});
