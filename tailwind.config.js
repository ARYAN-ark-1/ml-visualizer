module.exports = {
  darkMode: 'class', // enables class-based dark mode
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        light: {
          background: '#f5f5f5', // dull white/light grey
          surface: '#ffffff',    // pure white
          text: '#333333',       // dark grey (for readability)
          accent: '#bbbbbb',     // medium grey as accent (instead of purple)
        },
        dark: {
          background: '#121212', // almost black
          surface: '#1e1e1e',    // dark grey
          text: '#e0e0e0',       // light grey text
          accent: '#666666',     // medium-dark grey accent
        },
      },
    },
  },
  plugins: [],
}
