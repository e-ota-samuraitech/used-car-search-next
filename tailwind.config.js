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
        accent: '#2563eb',
        up: '#16a34a',
        down: '#dc2626',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', 'sans-serif'],
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
