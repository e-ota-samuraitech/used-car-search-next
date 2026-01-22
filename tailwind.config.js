/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        muted: '#6b7280',
        soft: '#f9fafb',
        accent: '#0d9488', // teal-600 に変更（readdy風）
        up: '#16a34a',
        down: '#dc2626',
      },
      fontFamily: {
        sans: ['Noto Sans JP', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Hiragino Sans', 'Yu Gothic', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,.06)',
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
}
