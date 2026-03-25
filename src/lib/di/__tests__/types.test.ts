import { describe, expect, it } from 'vitest'
import { LazyValue } from '../types'

/**
 * LazyValueのテストケース
 */

describe('LazyValue', () => {
  it('getValue()で値を取得できる', () => {
    const lazy = new LazyValue(() => 42)
    expect(lazy.getValue()).toBe(42)
  })

  it('getValue()で値がキャッシュされる', () => {
    let callCount = 0
    const lazy = new LazyValue(() => {
      callCount++
      return 42
    })

    lazy.getValue()
    lazy.getValue()

    expect(callCount).toBe(1)
  })

  describe('分割代入でのメソッド利用', () => {
    it('分割代入したgetValueメソッドが正しく動作する', () => {
      const lazy = new LazyValue(() => 42)
      const { getValue } = lazy

      expect(getValue()).toBe(42)
    })

    it('分割代入したgetValueメソッドでキャッシュが機能する', () => {
      let callCount = 0
      const lazy = new LazyValue(() => {
        callCount++
        return 42
      })
      const { getValue } = lazy

      getValue()
      getValue()

      expect(callCount).toBe(1)
    })
  })
})
