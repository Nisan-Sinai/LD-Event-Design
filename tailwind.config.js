/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // הקוד משתמש ב-w-5.5 / w-4.5 שאינם חלק מברירת המחדל של Tailwind
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
      },
      fontFamily: {
        sans: ['Heebo', 'system-ui', 'sans-serif'],
        serif: ['"Frank Ruhl Libre"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
