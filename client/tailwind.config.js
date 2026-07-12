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
          DEFAULT: '#714B67', // Odoo Signature Deep Plum
          hover: '#875A7B',   // Lavender accent
          light: '#F3EDF2'
        },
        secondary: {
          DEFAULT: '#875A7B'
        },
        background: {
          page: '#F8F9FA',
          panel: '#FFFFFF',
          muted: '#EEEEEE'
        },
        border: {
          DEFAULT: '#DEE2E6',
          dark: '#CED4DA'
        },
        text: {
          primary: '#212529',
          secondary: '#6C757D',
          muted: '#ADB5BD'
        },
        status: {
          red: '#F06050',     // Retired, Cancelled, Suspended
          orange: '#F4A460',  // In Shop, Off Duty
          yellow: '#F7CD1F',  // Draft, Pending
          blue: '#6CC1ED',    // On Trip, Dispatched
          purple: '#814968',  // Custom states
          green: '#30C381',   // Available, Completed
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      borderRadius: {
        sm: '0.25rem', // Odoo characteristic rounded-sm buttons
      }
    },
  },
  plugins: [],
}
