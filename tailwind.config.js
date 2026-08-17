/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#6C48F5',
          dark: '#111827',
          gray: '#6B7280',
          lightgray: '#F3F4F6',
          bgLeft: '#FCFCFD',
          bgRight: '#F0EFFF'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
