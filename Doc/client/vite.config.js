import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '^/doctor(/.*)?$': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        ws: true,
        rewrite: (path) => (path === '/doctor' ? '/doctor/' : path),
      },
      '^/admin(/.*)?$': {
        target: 'http://localhost:5175',
        changeOrigin: true,
        ws: true,
        rewrite: (path) => (path === '/admin' ? '/admin/' : path),
      },
    },
  },
})