import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    proxy: {
       '/api': {
         target: 'https://kyl.aitshub.com.ng',
         changeOrigin: true,
         secure: false,
         rewrite: (path) => path.replace(/^\/api/, '/api/v1'),
         ws: true,
         followRedirects: true
       }
    }
  }
})
