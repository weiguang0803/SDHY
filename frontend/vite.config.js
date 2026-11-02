import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    host: true,
    allowedHosts: true, // 允许所有外部主机（包含 ngrok 域名）
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8888', // 将 /api 代理转发到本地 8888 后端端口
        changeOrigin: true,
        ws: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:8888', // 将 /uploads 静态资源代理转发到本地 8888 后端端口
        changeOrigin: true,
      }
    }
  }
})
