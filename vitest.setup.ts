import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// jsdom には ResizeObserver / IntersectionObserver が存在しないため、
// react-resizable-panels 等のコンポーネントで参照される際のクラッシュを防ぐ
class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

class IntersectionObserverMock {
  root: Element | Document | null = null
  rootMargin = ''
  thresholds: ReadonlyArray<number> = []
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn((): IntersectionObserverEntry[] => [])
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock)
vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)

// Phase IA: jsdom には Tauri ランタイム (`__TAURI_INTERNALS__`) が存在しないため
// 明示的に undefined で stub する。これにより `installElectronShim()` が no-op となり、
// 既存テストの `Object.defineProperty(window, 'electronAPI', ...)` モックと干渉しない。
vi.stubGlobal('__TAURI_INTERNALS__', undefined)
