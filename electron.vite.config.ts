import { defineConfig } from 'electron-vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: []
  },
  preload: {
    plugins: []
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve(__dirname, './src/renderer'),
        '@renderer': resolve(__dirname, './src/renderer')
      }
    },
    build: {
      rollupOptions: {
        external: ['electron', 'fs', 'path']
      }
    },
    plugins: [react()],
    css: {
      postcss: resolve(__dirname, 'postcss.config.js')
    }
  }
})
