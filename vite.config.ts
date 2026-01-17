import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../internal/ui/dist', // Output directly into the Go source tree for embedding
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api/v1/projects': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // OIDC routes
      '/.well-known': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/authorize': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/oauth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/userinfo': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/keys': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/end_session': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
