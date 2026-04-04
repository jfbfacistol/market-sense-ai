import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Bridge for testing (n8n "Listen for test event")
      '/webhook-test': {
        target: 'http://localhost:5678',
        changeOrigin: true,
      },
      // Bridge for production (n8n "Published" mode)
      '/webhook': { // <-- ADD THIS NEW BRIDGE
        target: 'http://localhost:5678',
        changeOrigin: true,
      }
    }
  }
})