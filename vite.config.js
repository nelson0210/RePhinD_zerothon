import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '172.31.128.49',
      '.replit.dev',
      'ad35d09e-bf7f-417b-9e9e-6efc35582963-00-h2hdt3w658bh.spock.replit.dev'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})