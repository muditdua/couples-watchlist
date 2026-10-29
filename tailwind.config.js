/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        night: '#170d1a',   // page background
        plum: '#241529',    // cards
        velvet: '#33203a',  // raised surfaces / borders
        blush: 'rgb(var(--blush) / <alpha-value>)', // primary accent (changeable in Settings)
        ember: '#f4c98b',   // ratings, highlights
        mist: '#b9a6bd',    // secondary text
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Figtree', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
