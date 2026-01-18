export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Teal (replaces default blue)
        blue: {
          50: '#e0f2f4',
          100: '#b3e0e5',
          200: '#80cdd6',
          300: '#4dbac7',
          400: '#26aabc',
          500: '#1f6b7a', // primary
          600: '#1b5f6d',
          700: '#164d58',
          800: '#123b44',
          900: '#0e2930',
        },
        // AI Accent Purple
        purple: {
          50: '#ede9fe',
          100: '#ddd6fe',
          200: '#c4b5fd',
          300: '#a78bfa',
          400: '#8b5cf6', // ai-accent
          500: '#7c3aed',
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3b0764',
        },
        // Green stays as is
        green: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
