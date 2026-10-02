/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f4f7fb',
          100: '#e7eef7',
          200: '#cbd9ea',
          300: '#9fb6d4',
          400: '#6b8cbb',
          500: '#466a9c',
          600: '#34517f',
          700: '#2a4067',
          800: '#1e2f4d',
          900: '#0f172a',
          950: '#080d1a',
        },
        sky: {
          50: '#eef9ff',
          100: '#d9f1ff',
          200: '#bce7ff',
          300: '#8ed8ff',
          400: '#5ac2ff',
          500: '#38a8f0',
          600: '#1d8bd6',
          700: '#1970b0',
          800: '#1a5d91',
          900: '#1b4d77',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(28px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s ease-out both',
        'fade-in': 'fade-in 0.6s ease-out both',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite',
        'scale-in': 'scale-in 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};
