/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#fcb900', // Brand Yellow
          hover: '#e5a800',
          glow: '#fdd757',
          light: '#fde047'
        },
        secondary: {
          DEFAULT: '#ffffff', // White for high contrast accents
          hover: '#f3f4f6',
          light: '#e5e7eb'
        },
        accent: {
          DEFAULT: '#fcb900', // Reusing Yellow as main accent
          hover: '#e5a800',
          light: '#fde047'
        },
        success: {
          DEFAULT: '#10b981', // Emerald
          hover: '#059669'
        },
        warning: {
          DEFAULT: '#f59e0b', // Amber
          hover: '#d97706'
        },
        dark: {
          900: '#0a0a0f', // Deepest dark
          800: '#151521', // Card bg
          700: '#1f1f2e', // Border/Hover
          600: '#2a2a3a'
        },
        surface: '#151521',
        glow: {
          blue: '#3b82f6',
          purple: '#8b5cf6',
          pink: '#ec4899',
          cyan: '#06b6d4'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
