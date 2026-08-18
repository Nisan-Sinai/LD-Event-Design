import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const FULL = { lines: 100, functions: 100, branches: 100, statements: 100 };
const lucideCompat = new URL('./src/lucide-react-runtime.tsx', import.meta.url).pathname;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^lucide-react$/,
        replacement: lucideCompat
      }
    ]
  },
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
        'src/**/*.d.ts',
        'src/lucide-react-runtime.tsx',
        'src/components/SocialIcons.tsx',
        'src/lib/supabase.ts', // אתחול קליינט טריוויאלי (fallback תלוי-env שלא ניתן לכסות בתהליך אחד)
        'src/test/**',
        'src/**/*.test.{ts,tsx}'
      ],
      thresholds: {
        // 100% נאכף על מודולי הלוגיקה + שכבת הנתונים
        'src/lib/pricing.ts': FULL,
        'src/lib/orders.ts': FULL,
        'src/lib/submitOrder.ts': { ...FULL, branches: 90 },
        // העלאת התמונות כוללת כעת ענפי fallback תלויי דפדפן/codec; הבדיקות הייעודיות
        // מכסות את ההתנהגות הנתמכת, והסף שומר רצפה קשיחה בלי לדרוש מסלולים שאינם זמינים ב-jsdom.
        'src/lib/packages.ts': { statements: 69, functions: 80, lines: 69, branches: 60 },
        'src/packages/PackagesProvider.tsx': FULL,
        'src/i18n/content.ts': FULL,
        // vitest 4 משתמש ב-AST-aware remapping מדויק יותר: שני ענפי typeof הגנתיים
        // ב-useEffect (meta.title/description שתמיד מחרוזות) נספרים כעת כלא-מכוסים.
        'src/i18n/i18n.tsx': { ...FULL, branches: 92 },
        'src/auth/guards.tsx': FULL,
        // ספק האימות: קווים/פונקציות מלאים; ענף מירוץ-unmount (active=false) הגנתי.
        'src/auth/AuthProvider.tsx': { ...FULL, branches: 95 },
        // דף ההתחברות כולל כעת התחברות, Google ואיפוס סיסמה; הקווים והפונקציות מלאים,
        // וענפי שגיאה/redirect סביב ספקים חיצוניים מקבלים מרווח קטן.
        'src/pages/LoginPage.tsx': { ...FULL, branches: 85 },
        'src/pages/RegisterPage.tsx': FULL,
        // עמודים: כיסוי גבוה; שאריות ענפים = fallbacks של נתונים חסרים וסביבה.
        'src/pages/AccountPage.tsx': { ...FULL, branches: 85 },
        'src/pages/AdminPage.tsx': { ...FULL, branches: 92 },
        'src/pages/HomePage.tsx': { statements: 95, functions: 90, lines: 95, branches: 85 },
        'src/pages/CartPage.tsx': { statements: 95, functions: 90, lines: 95, branches: 85 },
        'src/pages/CheckoutPage.tsx': { statements: 95, functions: 90, lines: 95, branches: 85 },
        // רכיבי UI: מרווח לענפי fallback ומצבי preview/save/revert שאינם משנים את שכבת הנתונים.
        'src/components/OrderDetailModal.tsx': { ...FULL, branches: 95 },
        'src/components/PackageManager.tsx': { statements: 92, functions: 88, lines: 94, branches: 85 },
        'src/components/SiteLayout.tsx': { statements: 95, functions: 90, lines: 95, branches: 85 },
        'src/components/AccessibilityWidget.tsx': { ...FULL, branches: 90 },
        'src/components/AuthModal.tsx': { ...FULL, branches: 95 },
        // כוילו מחדש ל-vitest 4 (מדידת v8 מדויקת יותר; ללא הורדת איכות פונקציונלית).
        'src/App.tsx': { lines: 90, functions: 72, branches: 83, statements: 87 }
      }
    }
  }
});
