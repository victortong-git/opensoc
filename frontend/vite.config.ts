import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://backend:3001',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'http://backend:3001',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/ws': {
        target: 'http://backend:3001',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  },
  envPrefix: 'VITE_',
  build: {
    // Ensure proper source maps for development
    sourcemap: true
  }
})