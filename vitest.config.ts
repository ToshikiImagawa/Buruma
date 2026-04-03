import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['src/**/__tests__/**/*.{test,spec}.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@domain': path.resolve(__dirname, './src/domain'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@main': path.resolve(__dirname, './src/processes/main'),
      '@renderer': path.resolve(__dirname, './src/processes/renderer'),
      '@preload': path.resolve(__dirname, './src/processes/preload'),
    },
  },
})
