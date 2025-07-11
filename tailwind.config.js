/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
      '7xl': '4.5rem',
      '8xl': '6rem',
      '9xl': '8rem',
    },
    extend: {
      colors: {
        graycustom: 'var(--graycustom)', // #f5f5f5
        primary: 'var(--primary)', // #5c2334
        secondary: 'var(--secondary)', // #e7302a
        background: 'var(--background)', // #ffffff (light), #0a0a0a (dark)
        foreground: 'var(--foreground)', // #171717 (light), #ededed (dark)
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      padding: {
        custom: '1.5rem',
      },
      margin: {
        custom: '2rem',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};