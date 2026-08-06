import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^lucide-react$/,
        replacement: fileURLToPath(new URL('./src/lucide-react-runtime.tsx', import.meta.url))
      }
    ]
  },
  build: {
    rollupOptions: {
      output: {
        // פיצול ספריות צד-שלישי לצ'אנקים נפרדים (טעינה ו-caching טובים יותר).
        // צורת-פונקציה (נדרשת מ-Vite 8 / Rollup 4): סדר הבדיקות חשוב —
        // lucide-react מכיל "react" ולכן חייב להיבדק לפניו.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router') || id.includes('scheduler')) {
            return 'react';
          }
        }
      }
    }
  }
});
