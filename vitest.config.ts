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
        // שכבת הקטלוג: כיסוי מלא לקווים/פונקציות; ענפי ברירת-מחדל הגנתיים (?? / נירמול סיומת).
        'src/lib/packages.ts': { ...FULL, branches: 92 },
        'src/i18n/content.ts': FULL,
        // vitest 4 משתמש ב-AST-aware remapping מדויק יותר: שני ענפי typeof הגנתיים
        // ב-useEffect (meta.title/description שתמיד מחרוזות) נספרים כעת כלא-מכוסים.
        'src/i18n/i18n.tsx': { ...FULL, branches: 92 },
        'src/auth/roles.ts': FULL,
        'src/auth/guards.tsx': FULL,
        // ספק האימות: קווים/פונקציות מלאים; ענף מירוץ-unmount (active=false) הגנתי.
        'src/auth/AuthProvider.tsx': { ...FULL, branches: 95 },
        'src/pages/LoginPage.tsx': FULL,
        'src/pages/RegisterPage.tsx': FULL,
        // עמודים: כיסוי קווים/פונקציות מלא; שאריות ענפים = fallbacks של נתונים חסרים.
        'src/pages/AccountPage.tsx': { ...FULL, branches: 85 },
        'src/pages/AdminPage.tsx': { ...FULL, branches: 92 },
        'src/pages/HomePage.tsx': { ...FULL, branches: 90 },
        // רכיבי UI: ננעלו ל-100% קווים/פונקציות לאחר הרחבת הבדיקות; ענפים הגנתיים בלבד.
        'src/components/OrderDetailModal.tsx': { ...FULL, branches: 95 },
        'src/components/PackageManager.tsx': { statements: 98, functions: 97, lines: 98, branches: 88 },
        'src/components/SiteLayout.tsx': { ...FULL, branches: 90 },
        'src/components/AccessibilityWidget.tsx': { ...FULL, branches: 90 },
        'src/components/AuthModal.tsx': { ...FULL, branches: 95 },
        // ספים ל-UI שננעלו אחרי הרחבת הבדיקות (מרווח קטן לשונות סביבה); הענפים הנותרים הגנתיים.
        // כוילו מחדש ל-vitest 4 (מדידת v8 מדויקת יותר; אותם 222 טסטים, ללא רגרסיה בקוד).
        'src/App.tsx': { lines: 90, functions: 72, branches: 83, statements: 87 }
      }
    }
  }
});
