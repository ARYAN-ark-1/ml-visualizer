module.exports = {
  darkMode: 'class', // enables class-based dark mode
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-app)',
        surface: 'var(--bg-surface)',
        border: 'var(--border-color)',

        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',

        accent: {
          DEFAULT: 'var(--accent-primary)',
          hover: 'var(--accent-hover)',
          highlight: 'var(--accent-highlight)',
        },

        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
      },
    },
  },
  plugins: [],
}
