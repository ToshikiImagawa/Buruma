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
  root = null
  rootMargin = ''
  thresholds: ReadonlyArray<number> = []
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn(() => [])
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock)
vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
