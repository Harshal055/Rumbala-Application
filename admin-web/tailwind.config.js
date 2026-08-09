/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0B0D14',
        foreground: '#F8FAFC',
        card: {
          DEFAULT: 'rgba(20, 24, 39, 0.7)',
          foreground: '#F8FAFC',
          border: 'rgba(255, 255, 255, 0.08)'
        },
        primary: {
          DEFAULT: '#FF6B35',
          foreground: '#FFFFFF',
          hover: '#FF8A50',
          glow: 'rgba(255, 107, 53, 0.35)'
        },
        secondary: {
          DEFAULT: '#7928CA',
          foreground: '#FFFFFF',
          glow: 'rgba(121, 40, 202, 0.35)'
        },
        accent: {
          cyan: '#00DFD8',
          pink: '#FF007A',
          amber: '#F59E0B',
          emerald: '#10B981',
          rose: '#F43F5E'
        },
        muted: {
          DEFAULT: '#1E293B',
          foreground: '#94A3B8'
        },
        border: 'rgba(255, 255, 255, 0.08)'
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
        xl: '20px',
        '2xl': '32px'
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-glow': '0 0 30px rgba(255, 107, 53, 0.15)',
        'neon-orange': '0 0 20px rgba(255, 107, 53, 0.4)',
        'neon-purple': '0 0 20px rgba(121, 40, 202, 0.4)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
