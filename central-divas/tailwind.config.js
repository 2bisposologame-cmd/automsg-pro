/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        divas: {
          pink: '#F8B4C4',
          pinkDark: '#E89AAE',
          nude: '#F5E6D3',
          nudeDark: '#E8D4BE',
          gold: '#D4AF37',
          goldLight: '#F0D77C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};