/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        artvolt: {
          black: '#000000',
          white: '#FFFFFF',
          'pale-pink': '#f78da7',
          'vivid-red': '#cf2e2e',
          'luminous-orange': '#ff6900',
          'vivid-cyan-blue': '#0693e3',
          'vivid-green-cyan': '#00d084',
          'vivid-purple': '#9b51e0',
          'cyan-bluish-gray': '#abb8c3',
          gray: {
            50: '#fafafa',
            100: '#f5f5f5',
            200: '#e5e5e5',
            300: '#d4d4d4',
            400: '#a3a3a3',
            500: '#737373',
            600: '#525252',
            700: '#404040',
            800: '#262626',
            900: '#171717',
          }
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Crimson Pro', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'gradient-cyan-purple': 'linear-gradient(135deg, rgba(6,147,227,1) 0%, rgb(155,81,224) 100%)',
        'gradient-green-cyan': 'linear-gradient(135deg, rgb(122,220,180) 0%, rgb(0,208,130) 100%)',
        'gradient-amber-orange': 'linear-gradient(135deg, rgba(252,185,0,1) 0%, rgba(255,105,0,1) 100%)',
        'gradient-orange-red': 'linear-gradient(135deg, rgba(255,105,0,1) 0%, rgb(207,46,46) 100%)',
      },
      animation: {
        'scan': 'scan 2s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        scan: {
          '0%': { top: '0%' },
          '100%': { top: '100%' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
