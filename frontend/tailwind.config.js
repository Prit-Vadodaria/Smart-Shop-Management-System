/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          500: '#a855f7',
          600: '#9333ea',
          900: '#581c87',
        },
        dark: {
          800: '#2e1065',
          900: '#1e0a3c',
        }
      }
    },
  },
  plugins: [],
}
