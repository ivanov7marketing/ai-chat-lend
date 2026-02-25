/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');

module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',

    // если фронт потом вынесешь в /frontend
    './frontend/index.html',
    './frontend/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // DESIGN.md: Primary = green family, акцент #22c55e (green-500)
        primary: {
          50: colors.green[50],
          100: colors.green[100],
          200: colors.green[200],
          300: colors.green[300],
          400: colors.green[400],
          500: colors.green[500],
          600: colors.green[600],
          700: colors.green[700],
        },

        // DESIGN.md: Secondary = blue, акцент #3b82f6 (blue-500)
        secondary: {
          50: colors.blue[50],
          100: colors.blue[100],
          200: colors.blue[200],
          300: colors.blue[300],
          400: colors.blue[400],
          500: colors.blue[500],
          600: colors.blue[600],
          700: colors.blue[700],
        },

        // DESIGN.md: фон/карточки (семантические алиасы)
        page: '#f9fafb',
        surface: '#ffffff',
      },

      fontFamily: {
        // DESIGN.md: Inter
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      borderRadius: {
        // DESIGN.md: pill buttons, rounded-2xl cards, rounded-xl inputs
        pill: '9999px',
        card: '1rem',  // эквивалент rounded-2xl
        input: '0.75rem', // эквивалент rounded-xl
      },

      boxShadow: {
        // DESIGN.md: мягкие тени, базово shadow-sm
        card: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },

      spacing: {
        // семантика под “щедрые отступы” без ломания стандартной шкалы
        'layout-x': '1.5rem', // 24px
        'layout-y': '1.5rem', // 24px
        'section-y': '4rem',  // 64px
      },
    },
  },
  plugins: [],
};
