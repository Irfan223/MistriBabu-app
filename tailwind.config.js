/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Matches the navy blue (#063b86) used in the Quick Mistri "Q" logo mark.
        brand: {
          50: '#eef3fa',
          100: '#dbe6f5',
          200: '#b8cceb',
          300: '#8aabdc',
          400: '#4a76b9',
          500: '#1c4f96',
          600: '#063b86',
          700: '#052f6b',
          800: '#052750',
          900: '#041d3b',
          950: '#02132a',
        },
      },
    },
  },
  plugins: [],
};
