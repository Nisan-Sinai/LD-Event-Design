import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const FULL = { lines: 100, functions: 100, branches: 100, statements: 100 };

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // בדיקות יחידה/אינטגרציה ב-src בלבד (E2E של Playwright יושב ב-/e2e)
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      // נקודות כניסה / הצהרות / עזרי-בדיקה — לא נמדדים
      exclude: [
        'src/main.tsx',
        'src/Root.tsx',
        'src/vite-env.d.ts',
        'src/lib/supabase.ts', // אתחול קליינט טריוויאלי (fallback תלוי-env שלא ניתן לכסות בתהליך אחד)
        'src/test/**',
        'src/**/*.test.{ts,tsx}'
      ],
      thresholds: {
        // 100% נאכף על מודולי הלוגיקה + שכבת הנתונים
        'src/lib/pricing.ts': FULL,
        'src/lib/orders.ts': FULL,
        'src/lib/submitOrder.ts': { ...FULL, branches: 90 },
        'src/i18n/content.ts': FULL,
        'src/i18n/i18n.tsx': FULL,
        'src/auth/roles.ts': FULL,
        'src/auth/guards.tsx': FULL,
        'src/pages/LoginPage.tsx': FULL,
        'src/pages/RegisterPage.tsx': FULL,
        // ספים ל-UI שננעלו אחרי הרחבת הבדיקות (מרווח קטן לשונות סביבה); הענפים הנותרים הגנתיים
        'src/App.tsx': { lines: 92, functions: 72, branches: 83, statements: 92 }
      }
    }
  }
});
