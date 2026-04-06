/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 20px 80px rgba(14, 165, 233, 0.18)',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui'],
        body: ['"Manrope"', 'ui-sans-serif', 'system-ui'],
      },
      backgroundImage: {
        grain:
          'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 22%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.07), transparent 18%), linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0))',
      },
    },
  },
  plugins: [],
};
