import type { InjectionToken } from '../types'
import { VContainer, createToken } from '../container'

/**
 * VContainer - トークンキー衝突検出機能のテスト
 *
 * これらのテストは、開発環境での異なるトークンによる同一キーの使用を検出し、
 * 適切なエラーメッセージを表示する機能を検証します。
 *
 * 注意：
 * - 同じトークンの再登録は許可（上書き）
 * - 異なるトークンで同じKeyを使用した場合のみエラー
 */
describe('VContainer - トークンキー衝突検出', () => {
  let originalEnv: string | undefined

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV
    // テスト環境でも衝突検出を有効化（developmentまたはtest）
    process.env.NODE_ENV = 'development'
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  describe('同じトークンの再登録（許可される）', () => {
    test('同じトークンを2回登録してもエラーにならない', () => {
      const container = new VContainer()
      const token = createToken<string>('TestService')

      container.register({ token, useValue: 'first' })

      expect(() => {
        container.register({ token, useValue: 'second' })
      }).not.toThrow()
    })

    test('再登録後は新しい値が有効になる', () => {
      const container = new VContainer()
      const token = createToken<string>('TestService')

      container.register({ token, useValue: 'first' })
      container.register({ token, useValue: 'second' })

      expect(container.resolve(token)).toBe('second')
    })

    test('registerSingletonで同じトークンを再登録しても上書きされる', () => {
      const container = new VContainer()
      const token = createToken<string>('TestService')

      container.registerSingleton(token, () => 'first')

      expect(() => {
        container.registerSingleton(token, () => 'second')
      }).not.toThrow()
    })

    test('registerTransientで同じトークンを再登録しても上書きされる', () => {
      const container = new VContainer()
      const token = createToken<string>('TestService')

      container.registerTransient(token, () => 'first')

      expect(() => {
        container.registerTransient(token, () => 'second')
      }).not.toThrow()
    })
  })

  describe('異なるトークンで同じKeyを使用（エラーになる）', () => {
    test('異なるSymbolトークンで同じKeyを使うとエラー', () => {
      const container = new VContainer()
      // Symbol.for()は同じ文字列で同じSymbolを返すため、
      // 異なるトークンを作るにはローカルSymbolを使う
      const token1 = Symbol('TestService') as InjectionToken<string>
      const token2 = Symbol('TestService') as InjectionToken<string>

      container.register({ token: token1, useValue: 'first' })

      // 注: Symbol.for()を使用するcreateToken()では
      // 同じ文字列は同じSymbolを返すため、このテストケースは
      // ローカルSymbolでのみ発生する
      expect(() => {
        container.register({ token: token2, useValue: 'second' })
      }).toThrow(/Token key collision/)
    })

    test('エラーメッセージにキー名が含まれる', () => {
      const container = new VContainer()
      const token1 = Symbol('CollisionTest') as InjectionToken<string>
      const token2 = Symbol('CollisionTest') as InjectionToken<string>

      container.register({ token: token1, useValue: 'first' })

      expect(() => {
        container.register({ token: token2, useValue: 'second' })
      }).toThrow(/CollisionTest/)
    })
  })

  describe('異なるトークンで異なるKeyを使用（正常動作）', () => {
    test('異なるトークンを登録してもエラーにならない', () => {
      const container = new VContainer()
      const token1 = createToken<string>('Service1')
      const token2 = createToken<string>('Service2')

      expect(() => {
        container.register({ token: token1, useValue: 'first' })
        container.register({ token: token2, useValue: 'second' })
      }).not.toThrow()
    })

    test('名前空間付きトークンで登録', () => {
      const container = new VContainer()
      const token1 = createToken<string>('FeatureA.Repository')
      const token2 = createToken<string>('FeatureB.Repository')

      expect(() => {
        container.register({ token: token1, useValue: 'featureA' })
        container.register({ token: token2, useValue: 'featureB' })
      }).not.toThrow()

      expect(container.resolve(token1)).toBe('featureA')
      expect(container.resolve(token2)).toBe('featureB')
    })
  })

  describe('親コンテナのトークンを子コンテナで上書き', () => {
    test('エラーが発生しない', () => {
      const parent = new VContainer()
      const child = parent.createScope()
      const token = createToken<string>('TestService')

      parent.register({ token, useValue: 'parent' })

      expect(() => {
        child.register({ token, useValue: 'child' })
      }).not.toThrow()
    })

    test('子コンテナで解決すると上書き後の値が取得できる', () => {
      const parent = new VContainer()
      const child = parent.createScope()
      const token = createToken<string>('TestService')

      parent.register({ token, useValue: 'parent' })
      child.register({ token, useValue: 'child' })

      expect(child.resolve(token)).toBe('child')
      expect(parent.resolve(token)).toBe('parent')
    })
  })

  describe('本番環境での動作', () => {
    test('本番環境ではキー衝突チェックが無効', () => {
      process.env.NODE_ENV = 'production'

      // 本番環境用に新しいコンテナを作成（constructorでフラグが設定される）
      const container = new VContainer()
      const token1 = Symbol('TestService') as InjectionToken<string>
      const token2 = Symbol('TestService') as InjectionToken<string>

      container.register({ token: token1, useValue: 'first' })

      // 本番環境ではチェックされないのでエラーにならない
      expect(() => {
        container.register({ token: token2, useValue: 'second' })
      }).not.toThrow()
    })
  })

  describe('clear()後の動作', () => {
    test('clear()後に同じトークンを再登録できる', () => {
      const container = new VContainer()
      const token = createToken<string>('TestService')

      container.register({ token, useValue: 'first' })
      container.clear()

      expect(() => {
        container.register({ token, useValue: 'second' })
      }).not.toThrow()
    })

    test('clear後に再登録した値が取得できる', () => {
      const container = new VContainer()
      const token = createToken<string>('TestService')

      container.register({ token, useValue: 'first' })
      container.clear()
      container.register({ token, useValue: 'second' })

      expect(container.resolve(token)).toBe('second')
    })

    test('clear()後はキー衝突検出もリセットされる', () => {
      const container = new VContainer()
      const token1 = Symbol('TestService') as InjectionToken<string>
      const token2 = Symbol('TestService') as InjectionToken<string>

      container.register({ token: token1, useValue: 'first' })
      container.clear()

      // clearでtokenKeysもリセットされるので、同じKeyでもエラーにならない
      expect(() => {
        container.register({ token: token2, useValue: 'second' })
      }).not.toThrow()
    })
  })
})
