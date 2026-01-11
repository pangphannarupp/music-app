/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Battambang', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: 'var(--color-primary)',
      },
    },
  },
  plugins: [],
}
