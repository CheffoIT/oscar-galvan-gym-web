/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gym: {
          black:   '#050505',
          dark:    '#111111',
          card:    '#1a1a2e',
          border:  '#1f1f3a',
          purple:  '#6B21A8',
          purpled: '#3B0764',
          purplel: '#9333EA',
          yellow:  '#EAB308',
          yellowl: '#FEF08A',
          white:   '#F8FAFC',
          gray:    '#A1A1AA',
          grays:   '#52525B',
          red:     '#EF4444',
          green:   '#22C55E',
        }
      },
      fontFamily: {
        display: ['Bebas Neue', 'Impact', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gym-gradient': 'linear-gradient(135deg, #050505 0%, #1a1a2e 50%, #3B0764 100%)',
        'hero-overlay': 'linear-gradient(to bottom, rgba(5,5,5,0.7) 0%, rgba(5,5,5,0.85) 100%)',
        'card-gradient': 'linear-gradient(135deg, #1a1a2e 0%, #111111 100%)',
      },
      boxShadow: {
        'gym':        '0 0 20px rgba(107,33,168,0.3)',
        'gym-hover':  '0 0 30px rgba(107,33,168,0.5)',
        'yellow':     '0 0 20px rgba(234,179,8,0.3)',
        'yellow-hover':'0 0 30px rgba(234,179,8,0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow':       'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          from: { boxShadow: '0 0 10px rgba(107,33,168,0.3)' },
          to:   { boxShadow: '0 0 25px rgba(107,33,168,0.7)' },
        }
      }
    },
  },
  plugins: [],
}
