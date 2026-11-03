/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fintech: {
          dark: '#0B0E14',
          card: '#121721',
          border: '#1E2638',
          accent: '#2563EB',
          bullish: '#10B981',
          bearish: '#EF4444',
          warning: '#F59E0B',
          muted: '#8892B0',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
