import { describe, expect, it, vi } from 'vitest'
import { DisposableStack, createDisposableStack } from '../disposable-stack'

describe('DisposableStack', () => {
  describe('use', () => {
    it('Disposableオブジェクトを追加し、dispose時に実行される', () => {
      const stack = new DisposableStack()
      const disposable: Disposable = {
        [Symbol.dispose]: vi.fn(),
      }

      const result = stack.use(disposable)

      expect(result).toBe(disposable)
      expect(disposable[Symbol.dispose]).not.toHaveBeenCalled()

      stack.dispose()

      expect(disposable[Symbol.dispose]).toHaveBeenCalledTimes(1)
    })

    it('複数のDisposableがLIFO順でdisposeされる', () => {
      const stack = new DisposableStack()
      const order: string[] = []

      const disposable1: Disposable = {
        [Symbol.dispose]: () => order.push('disposable1'),
      }
      const disposable2: Disposable = {
        [Symbol.dispose]: () => order.push('disposable2'),
      }

      stack.use(disposable1)
      stack.use(disposable2)

      stack.dispose()

      expect(order).toEqual(['disposable2', 'disposable1'])
    })
  })

  describe('defer', () => {
    it('関数を登録し、dispose時に実行される', () => {
      const stack = new DisposableStack()
      const callback = vi.fn()

      stack.defer(callback)

      expect(callback).not.toHaveBeenCalled()

      stack.dispose()

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('複数の関数がLIFO順で実行される', () => {
      const stack = new DisposableStack()
      const order: number[] = []

      stack.defer(() => order.push(1))
      stack.defer(() => order.push(2))
      stack.defer(() => order.push(3))

      stack.dispose()

      expect(order).toEqual([3, 2, 1])
    })
  })

  describe('dispose', () => {
    it('disposed状態が正しく更新される', () => {
      const stack = new DisposableStack()

      expect(stack.disposed).toBe(false)

      stack.dispose()

      expect(stack.disposed).toBe(true)
    })

    it('二重disposeしても安全', () => {
      const stack = new DisposableStack()
      const disposable: Disposable = {
        [Symbol.dispose]: vi.fn(),
      }
      stack.use(disposable)

      stack.dispose()
      stack.dispose()

      expect(disposable[Symbol.dispose]).toHaveBeenCalledTimes(1)
    })

    it('成功時はsuccessがtrue、errorsが空', () => {
      const stack = new DisposableStack()
      stack.use({ [Symbol.dispose]: () => {} })

      const result = stack.dispose()

      expect(result.success).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('エラーが発生しても他のDisposableはdisposeされる', () => {
      const stack = new DisposableStack()
      const dispose1 = vi.fn()
      const dispose2 = vi.fn(() => {
        throw new Error('Test error')
      })
      const dispose3 = vi.fn()

      stack.use({ [Symbol.dispose]: dispose1 })
      stack.use({ [Symbol.dispose]: dispose2 })
      stack.use({ [Symbol.dispose]: dispose3 })

      const result = stack.dispose()

      expect(dispose1).toHaveBeenCalledTimes(1)
      expect(dispose2).toHaveBeenCalledTimes(1)
      expect(dispose3).toHaveBeenCalledTimes(1)
      expect(result.success).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toBe('Test error')
    })

    it('複数のエラーがすべて収集される', () => {
      const stack = new DisposableStack()

      stack.use({
        [Symbol.dispose]: () => {
          throw new Error('Error 1')
        },
      })
      stack.use({
        [Symbol.dispose]: () => {
          throw new Error('Error 2')
        },
      })
      stack.use({
        [Symbol.dispose]: () => {
          throw new Error('Error 3')
        },
      })

      const result = stack.dispose()

      expect(result.success).toBe(false)
      expect(result.errors).toHaveLength(3)
      expect(result.errors.map((e) => e.message)).toEqual(['Error 3', 'Error 2', 'Error 1'])
    })

    it('非Errorオブジェクトもエラーとして収集される', () => {
      const stack = new DisposableStack()

      stack.use({
        [Symbol.dispose]: () => {
          throw 'string error'
        },
      })

      const result = stack.dispose()

      expect(result.success).toBe(false)
      expect(result.errors[0].message).toBe('string error')
    })
  })

  describe('createDisposableStack', () => {
    it('新しいDisposableStackインスタンスを作成する', () => {
      const stack = createDisposableStack()

      expect(stack).toBeInstanceOf(DisposableStack)
      expect(stack.disposed).toBe(false)
    })
  })

  describe('統合シナリオ', () => {
    it('useとdeferを組み合わせてLIFO順で実行される', () => {
      const stack = new DisposableStack()
      const order: string[] = []

      const disposable: Disposable = {
        [Symbol.dispose]: () => order.push('use'),
      }

      stack.use(disposable)
      stack.defer(() => order.push('defer'))

      stack.dispose()

      expect(order).toEqual(['defer', 'use'])
    })
  })
})
