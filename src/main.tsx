import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { invoke } from '@tauri-apps/api/core'
import App from './App'
import './index.css'
import { installElectronShim } from '@/shared/lib/invoke'

// Phase IA: Webview 起動直後に Electron 互換 shim を window.electronAPI に注入する。
// Tauri ランタイム (`__TAURI_INTERNALS__`) が存在しない環境 (vitest jsdom 等) では no-op。
// 既存 14 caller が `window.electronAPI.*` を呼び出すコードを触らずに invoke 経由へ
// ルーティング可能にする暫定レイヤー。Phase IH で削除予定。
installElectronShim()

// Phase IA: Rust ↔ Webview 間の IPC 疎通確認。`ping` は Rust 側で
// "{msg} world from tauri" を返す唯一の実装済みコマンド。他のコマンドは未実装なので
// shim 経由で呼び出すと IPCResult failure になる。
if (import.meta.env.DEV) {
  invoke<string>('ping', { msg: 'hello' })
    .then((r) => console.info('[tauri] ping:', r))
    .catch((e) => console.warn('[tauri] ping failed:', e))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
