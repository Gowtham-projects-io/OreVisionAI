import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base URL: '/' for local dev, '/OreVisionAI/' for GitHub Pages
const base = process.env.GITHUB_ACTIONS ? '/OreVisionAI/' : '/'

export default defineConfig({
  plugins: [react()],
  base,
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
