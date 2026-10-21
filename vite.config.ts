import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 프론트에서 /api로 요청하면 → 백엔드 http://localhost:9010 전달됨
      '/api': {
        target: 'http://localhost:9010',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
});