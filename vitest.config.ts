import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

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
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      // Only test sources/type declarations are excluded. All production code is measured.
      exclude: [
        'src/**/*.d.ts',
        'src/test/**',
        'src/**/*.test.{ts,tsx}'
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100
      }
    }
  }
});
