/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Rich forest greens — brand primary
        forest: {
          950: '#061409',
          900: '#0D2818',
          800: '#143D25',
          700: '#1B4332',
          600: '#2D6A4F',
          500: '#40916C',
          400: '#52B788',
          300: '#74C69D',
          200: '#95D5B2',
          100: '#D8F3DC',
          50:  '#F0FFF4',
        },
        // Warm cream / off-white backgrounds
        cream: {
          50:  '#FDFDFC',
          100: '#F8F3E8',
          200: '#EAE1D2',
          300: '#DCCEB5',
          400: '#C7B492',
        },
        // Green-tinted slate text
        bark: {
          900: '#0A1F14',
          800: '#1A3025',
          700: '#243B2E',
          600: '#3D5A47',
          500: '#5C7A65',
          400: '#879E8D',
          300: '#B4C4B9',
          200: '#DCE6DF',
          100: '#F0F5F1',
        },
        // Semantic role colors
        farmer:   '#2D6A4F',
        vendor:   '#2563EB',
        supplier: '#EA580C',
      },
      fontFamily: {
        display: ['"Fraunces"', 'system-ui', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card:  '20px',
        pill:  '999px',
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        card:  '0 2px 12px rgba(27,67,50,0.08), 0 1px 3px rgba(27,67,50,0.04)',
        float: '0 8px 40px rgba(27,67,50,0.16), 0 2px 8px rgba(27,67,50,0.08)',
        glow:  '0 0 30px rgba(64,145,108,0.25)',
        'nav': '0 8px 32px rgba(13,40,24,0.25), 0 2px 8px rgba(13,40,24,0.15)',
        'inner-sm': 'inset 0 1px 3px rgba(0,0,0,0.08)',
      },
      animation: {
        'fade-in':      'fadeIn 0.4s ease both',
        'fade-up':      'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'slide-up':     'slideUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'slide-down':   'slideDown 0.3s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':     'scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
        'pop':          'pop 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        'shimmer':      'shimmer 2s linear infinite',
        'float':        'float 6s ease-in-out infinite',
        'pulse-soft':   'pulseSoft 3s ease-in-out infinite',
        'spin-slow':    'spin 8s linear infinite',
        'ken-burns':    'kenBurns 20s ease-out forwards',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        fadeUp:    { '0%': { opacity: 0, transform: 'translateY(20px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        slideUp:   { '0%': { transform: 'translateY(28px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        slideDown: { '0%': { transform: 'translateY(-16px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        scaleIn:   { '0%': { transform: 'scale(0.88)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } },
        pop:       { '0%': { transform: 'scale(0.94)' }, '60%': { transform: 'scale(1.04)' }, '100%': { transform: 'scale(1)' } },
        shimmer:   { '0%': { backgroundPosition: '-200% center' }, '100%': { backgroundPosition: '200% center' } },
        float:     { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-12px)' } },
        pulseSoft: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
        kenBurns:  { '0%': { transform: 'scale(1)' }, '100%': { transform: 'scale(1.05)' } },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':  'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-green':      'radial-gradient(at 40% 20%, #2D6A4F33 0px, transparent 50%), radial-gradient(at 80% 0%, #1B433220 0px, transparent 50%), radial-gradient(at 0% 50%, #40916C15 0px, transparent 50%)',
      },
    },
  },
  plugins: [],
}
