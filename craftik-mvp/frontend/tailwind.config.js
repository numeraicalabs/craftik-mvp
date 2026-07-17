/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Craftik brand — safety orange + night blue + accents
        orange: {
          DEFAULT: '#FF6B1A',
          dark: '#E5560A',
          light: '#FF9A5C',
          soft: '#FFEDE0',
        },
        night: {
          DEFAULT: '#0F2A43',
          2: '#16395C',
          3: '#2A4664',
        },
        concrete: '#F4F5F7',
        ink: '#1B2733',
        muted: '#5C6B7A',
        verified: '#1DB954',
        signal: '#FFC400',
        line: '#E3E7EC',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Archivo', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 30px rgba(15,42,67,0.10)',
        cta: '0 6px 18px rgba(255,107,26,0.35)',
      },
    },
  },
  plugins: [],
};
