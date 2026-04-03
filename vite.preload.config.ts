import path from 'node:path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    alias: {
      '@domain': path.resolve(__dirname, './src/domain'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@preload': path.resolve(__dirname, './src/processes/preload'),
    },
  },
})
