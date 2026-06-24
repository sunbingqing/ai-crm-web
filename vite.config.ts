/*
 * @Author: sunbingqing
 * @Date: 2026-05-20 15:42:53
 * @LastEditors: sunbingqing
 * @LastEditTime: 2026-06-24 10:58:58
 * @Description: 
 * @Copyright: ©2021 杭州杰竞科技有限公司 版权所有
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'https://dev-oncall-backend.xiaomai5.com',
        changeOrigin: true,
      },
    },
  },
})
