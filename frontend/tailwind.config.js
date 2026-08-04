/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette — matches the InventoryPro design spec exactly
        background: '#0F172A',
        card: '#1E293B',
        primary: '#3B82F6',
        text: '#E5E7EB',
        profit: '#22C55E',
        loss: '#EF4444',
        border: '#334155',
        muted: '#94A3B8'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
