/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      animation: {
        shimmer: 'shimmer 3s ease-in-out infinite',
        'bar-in': 'bar-in 0.6s ease-out forwards',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.7' },
        },
        'bar-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: 'var(--bar-opacity, 1)', transform: 'translateY(0)' },
        },
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          '"Fira Sans"',
          '"Droid Sans"',
          '"Helvetica Neue"',
          'sans-serif',
        ],
      },
      colors: {
        primary: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
      },
    },
  },
  plugins: [],
};
