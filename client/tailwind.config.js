/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Foundation — clean white system with strong contrast
        bg: {
          DEFAULT: '#f7f8fb',
          raised: '#ffffff',
          higher: '#f2f4f8',
          card:   '#ffffff',
          border: '#e2e8f0',
          hover:  '#eef2f7',
        },
        ink: {
          50:  '#0f172a',
          200: '#1f2a44',
          400: '#5b6b86',
          500: '#8a9ab3',
          600: '#cbd5e1',
        },
        // Fresh climate accent
        accent: {
          50:  '#eff6ff',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        // Semantic status
        heat:    { soft: '#fff1f2', mid: '#fb7185', bright: '#ef4444' },
        flood:   { soft: '#eff6ff', mid: '#38bdf8', bright: '#0ea5e9' },
        ndvi:    { soft: '#f0fdf4', mid: '#22c55e', bright: '#16a34a' },
        success: '#10b981',
        warn:    '#f59e0b',
        danger:  '#ef4444',
      },
      fontFamily: {
        sans:    ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'ui-sans-serif', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      boxShadow: {
        glow:        '0 0 0 1px rgba(14,165,233,0.22), 0 18px 40px -18px rgba(14,165,233,0.25)',
        soft:        '0 1px 0 0 rgba(255,255,255,0.85) inset, 0 10px 26px -18px rgba(15,23,42,0.14)',
        lift:        '0 22px 55px -26px rgba(15,23,42,0.16), 0 1px 0 0 rgba(255,255,255,0.75) inset',
        'inner-line':'inset 0 0 0 1px rgba(148,163,184,0.14)',
      },
      backgroundImage: {
        'grid-faint': "linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px)",
      },
      animation: {
        'fade-in':    'fadeIn 220ms ease both',
        'slide-up':   'slideUp 300ms cubic-bezier(.2,.7,.2,1) both',
        'slide-in-r': 'slideInRight 280ms cubic-bezier(.2,.7,.2,1) both',
        'pulse-dot':  'pulseDot 1.8s ease-in-out infinite',
        'shimmer':    'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp:   { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        slideInRight: { '0%': { opacity: 0, transform: 'translateX(16px)' }, '100%': { opacity: 1, transform: 'translateX(0)' } },
        pulseDot:  { '0%,100%': { opacity: 1, transform: 'scale(1)' }, '50%': { opacity: 0.5, transform: 'scale(0.85)' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
};
