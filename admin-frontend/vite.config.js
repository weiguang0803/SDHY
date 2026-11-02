import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8888', // 代理转发到后端 8888 端口
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:8888', // 代理静态文件到后端 8888 端口
        changeOrigin: true,
      }
    }
  }
})
