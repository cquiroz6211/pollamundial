/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-outfit)', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
          gold: '#eab308',
          'gold-dark': '#ca8a04',
          emerald: '#10b981',
        },
        sports: {
          bg: '#080e14',
          card: '#0f1722',
          cardHover: '#172232',
          border: '#1f2e41',
          accent: '#10b981',
          textMuted: '#94a3b8',
          textLight: '#f8fafc',
        }
      },
      boxShadow: {
        'glow-green': '0 0 15px rgba(16, 185, 129, 0.15)',
        'glow-gold': '0 0 15px rgba(234, 179, 8, 0.15)',
      }
    },
  },
  plugins: [],
}
