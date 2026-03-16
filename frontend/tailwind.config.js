/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          900: '#1e3a8a',
          glow: 'rgba(59, 130, 246, 0.5)'
        },
        dark: {
          bg: '#0B0F19',
          card: '#151E32',
          border: '#2A3B5C',
          muted: '#94A3B8'
        }
      },
      animation: {
        'gradient-x': 'gradient-x 15s ease infinite',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 1, boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)' },
          '50%': { opacity: .7, boxShadow: '0 0 25px rgba(59, 130, 246, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}
