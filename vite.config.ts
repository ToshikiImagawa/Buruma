import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config + https://v2.tauri.app/start/frontend/vite/
export default defineConfig({
  plugins: [react()],

  // Tauri CLI は色付き出力を独自に扱うため、Vite のクリア画面を無効化する
  clearScreen: false,

  server: {
    // Tauri 推奨ポート。他ツール (default Vite の 5173 など) と衝突しにくい
    port: 1420,
    strictPort: true,
    host: false,
    // src-tauri/ 内の変更は Rust 側でウォッチするので Vite の HMR から除外
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },

  // Tauri の環境変数を Vite 経由で公開する (VITE_* および TAURI_ENV_*)
  envPrefix: ['VITE_', 'TAURI_ENV_*'],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@domain': path.resolve(__dirname, './src/domain'),
      '@lib': path.resolve(__dirname, './src/lib'),
    },
  },

  optimizeDeps: {
    include: ['monaco-editor', '@monaco-editor/react'],
  },

  worker: {
    format: 'es',
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Tauri ターゲットに合わせて ES2021 にする (Safari 15 相当)
    target: 'es2021',
    // Tauri リリースビルドでは minify を esbuild に統一
    minify: 'esbuild',
    sourcemap: true,
  },
})
