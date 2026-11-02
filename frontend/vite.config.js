import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    // Proxy API requests to our backend during development
    // Instead of calling http://localhost:5000/api/jobs,
    // we can just call /api/jobs from the frontend.
    // Vite will automatically forward /api/* to the backend.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
