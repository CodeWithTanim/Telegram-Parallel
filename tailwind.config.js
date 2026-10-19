/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        telegram: {
          blue: '#24A1DE',
          cyan: '#00D2FF',
          dark: '#07090e',
          surface: '#0d121d',
          card: 'rgba(255, 255, 255, 0.04)'
        },
        aurora: {
          cyan: '#06B6D4',
          blue: '#3B82F6',
          indigo: '#6366F1',
          purple: '#8B5CF6',
          pink: '#EC4899',
          amber: '#F59E0B'
        }
      },
      backgroundImage: {
        'gradient-aurora': 'linear-gradient(135deg, #06B6D4 0%, #24A1DE 50%, #6366F1 100%)',
        'gradient-accent': 'linear-gradient(135deg, #24A1DE 0%, #8B5CF6 100%)',
        'gradient-glow': 'linear-gradient(135deg, #00D2FF 0%, #24A1DE 50%, #8B5CF6 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #F43F5E 0%, #FB923C 100%)',
        'gradient-card':
          'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)'
      },
      backdropBlur: {
        xs: '2px',
        xl: '24px',
        '2xl': '36px'
      }
    }
  },
  plugins: []
}
