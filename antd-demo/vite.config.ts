import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // 把体积大且更新少的库拆成独立文件，利用浏览器缓存
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react'
            if (id.includes('@ant-design/icons')) return 'icons'
            if (id.includes('node_modules/antd/') || id.includes('@ant-design/cssinjs') || id.includes('rc-')) return 'antd'
            return 'vendor'
          }
        },
      },
    },
  },
})
