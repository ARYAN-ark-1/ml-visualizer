import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // base: "/ml-visualizer/",
  plugins: [react()],
  build: {
    target: "esnext",
    minify: "esbuild", // Fast minification
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          viz: ['d3', 'chart.js', 'react-chartjs-2'],
          ui: ['react-icons']
        }
      }
    }
  }
})
