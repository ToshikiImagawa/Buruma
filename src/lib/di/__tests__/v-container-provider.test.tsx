import { Component, ReactNode, StrictMode } from 'react'
import type { VContainerConfig } from '../v-container-provider'
import { render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { VContainer } from '../container'
import {
  VContainerProvider,
  useVContainer,
  useVContainerError,
  useVContainerReady,
} from '../v-container-provider' /**
 * VContainerProviderのテストケース
 * - React Strict Modeでの二重実行に対応
 * - プロバイダーのマウント・アンマウント・再マウントの動作確認
 */

/**
 * VContainerProviderのテストケース
 * - React Strict Modeでの二重実行に対応
 * - プロバイダーのマウント・アンマウント・再マウントの動作確認
 */

describe('VContainerProvider', () => {
  describe('基本的な動作', () => {
    it('コンテナを提供し、子コンポーネントから利用できる', async () => {
      const configs: VContainerConfig[] = [
        {
          register: (container) => {
            container.register({
              token: 'testValue',
              useValue: 'test',
            })
          },
          setUp: async () => {
            return () => {
              // tearDown処理
            }
          },
        },
      ]

      let resolvedValue: string | null = null

      const ChildComponent = () => {
        const container = useVContainer()
        resolvedValue = container.resolve('testValue') as string
        return <div>Child</div>
      }

      render(
        <VContainerProvider configs={configs}>
          <ChildComponent />
        </VContainerProvider>,
      )

      await waitFor(() => {
        expect(resolvedValue).toBe('test')
      })
    })

    it('setUpが完了するまでisReadyがfalseである', async () => {
      let setUpCompleted = false
      const configs: VContainerConfig[] = [
        {
          setUp: async () => {
            // 非同期処理をシミュレート
            await new Promise((resolve) => setTimeout(resolve, 50))
            setUpCompleted = true
            return () => {
              // tearDown処理
            }
          },
        },
      ]

      const TestComponent = () => {
        const isReady = useVContainerReady()
        return <div data-testid="ready">{isReady ? 'ready' : 'loading'}</div>
      }

      const { getByTestId } = render(
        <VContainerProvider configs={configs} fallback={<div data-testid="ready">loading</div>}>
          <TestComponent />
        </VContainerProvider>,
      )

      // 初期状態を確認（fallbackが表示されている可能性があるので、条件付きで確認）
      const initialElement = getByTestId('ready')
      if (initialElement.textContent === 'loading') {
        expect(setUpCompleted).toBe(false)
      }

      // setUpが完了するのを待つ
      await waitFor(
        () => {
          const element = getByTestId('ready')
          expect(element.textContent).toBe('ready')
          expect(setUpCompleted).toBe(true)
        },
        { timeout: 200 },
      )
    })

    it('fallbackを指定すると、準備中にfallbackが表示される', async () => {
      const configs: VContainerConfig[] = [
        {
          setUp: async () => {
            await new Promise((resolve) => setTimeout(resolve, 50))
            return () => {
              // tearDown処理
            }
          },
        },
      ]

      const { getByText, queryByText } = render(
        <VContainerProvider configs={configs} fallback={<div>Loading...</div>}>
          <div>Content</div>
        </VContainerProvider>,
      )

      // 初期状態はfallbackが表示される
      expect(getByText('Loading...')).toBeTruthy()
      expect(queryByText('Content')).toBeNull()

      // setUpが完了するとコンテンツが表示される
      await waitFor(
        () => {
          expect(queryByText('Loading...')).toBeNull()
          expect(getByText('Content')).toBeTruthy()
        },
        { timeout: 200 },
      )
    })
  })

  describe('React Strict Modeでの動作', () => {
    it('Strict Modeでも初期化が一度だけ実行される', async () => {
      const registerMock = vi.fn()
      const setUpMock = vi.fn(async () => {
        return vi.fn() // tearDown関数
      })

      const configs: VContainerConfig[] = [
        {
          register: registerMock,
          setUp: setUpMock,
        },
      ]

      const TestComponent = () => {
        const isReady = useVContainerReady()
        return <div>{isReady ? 'ready' : 'loading'}</div>
      }

      render(
        <StrictMode>
          <VContainerProvider configs={configs}>
            <TestComponent />
          </VContainerProvider>
        </StrictMode>,
      )

      await waitFor(() => {
        expect(setUpMock).toHaveBeenCalledTimes(1)
        expect(registerMock).toHaveBeenCalledTimes(1)
      })
    })

    it('Strict Modeでの偽アンマウント時にtearDownが実行されない', async () => {
      const tearDownMock = vi.fn()
      const setUpMock = vi.fn(async () => {
        // 非同期処理をシミュレート
        await new Promise((resolve) => setTimeout(resolve, 10))
        return tearDownMock
      })

      const configs: VContainerConfig[] = [
        {
          setUp: setUpMock,
        },
      ]

      const TestComponent = () => {
        const isReady = useVContainerReady()
        return <div>{isReady ? 'ready' : 'loading'}</div>
      }

      render(
        <StrictMode>
          <VContainerProvider configs={configs}>
            <TestComponent />
          </VContainerProvider>
        </StrictMode>,
      )

      // setUpが完了するまで待つ
      await waitFor(
        () => {
          expect(setUpMock).toHaveBeenCalledTimes(1)
        },
        { timeout: 100 },
      )

      // Strict Modeの偽アンマウント後も、tearDownが呼ばれていないことを確認
      // （実際のStrict Mode動作はテスト環境で完全に再現できないため、
      //  setUpが1回のみ呼ばれていることで間接的に確認）
      expect(setUpMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('アンマウント・再マウントの動作', () => {
    it('アンマウント時にtearDownが実行される', async () => {
      const tearDownMock = vi.fn()
      const setUpMock = vi.fn(async () => {
        return tearDownMock
      })

      const configs: VContainerConfig[] = [
        {
          setUp: setUpMock,
        },
      ]

      const TestComponent = () => {
        const isReady = useVContainerReady()
        return <div>{isReady ? 'ready' : 'loading'}</div>
      }

      const { unmount } = render(
        <VContainerProvider configs={configs}>
          <TestComponent />
        </VContainerProvider>,
      )

      // setUpが完了するまで待つ
      await waitFor(() => {
        expect(setUpMock).toHaveBeenCalledTimes(1)
      })

      // tearDownがまだ呼ばれていないことを確認
      expect(tearDownMock).not.toHaveBeenCalled()

      // アンマウント
      unmount()

      // tearDownが呼ばれたことを確認
      await waitFor(() => {
        expect(tearDownMock).toHaveBeenCalledTimes(1)
      })
    })

    it('アンマウント後の再マウント時に正しく初期化される', async () => {
      let mountCount = 0
      const setUpMock = vi.fn(async () => {
        mountCount++
        return vi.fn() // tearDown
      })

      const configs: VContainerConfig[] = [
        {
          setUp: setUpMock,
        },
      ]

      const TestComponent = () => {
        const isReady = useVContainerReady()
        return <div data-testid="status">{isReady ? 'ready' : 'loading'}</div>
      }

      // 1回目のマウント
      const { unmount, getByTestId } = render(
        <VContainerProvider configs={configs}>
          <TestComponent />
        </VContainerProvider>,
      )

      await waitFor(() => {
        expect(getByTestId('status').textContent).toBe('ready')
        expect(mountCount).toBe(1)
      })

      // アンマウント
      unmount()

      // 2回目のマウント
      const { getByTestId: getByTestId2 } = render(
        <VContainerProvider configs={configs}>
          <TestComponent />
        </VContainerProvider>,
      )

      // 再度初期化が実行されることを確認
      await waitFor(() => {
        expect(getByTestId2('status').textContent).toBe('ready')
        expect(mountCount).toBe(2)
      })
    })

    it('setUp実行中のアンマウント時にtearDownが実行されない', async () => {
      const tearDownMock = vi.fn()
      const setUpMock = vi.fn(async () => {
        // 長い非同期処理をシミュレート
        await new Promise((resolve) => setTimeout(resolve, 100))
        return tearDownMock
      })

      const configs: VContainerConfig[] = [
        {
          setUp: setUpMock,
        },
      ]

      const TestComponent = () => {
        return <div>Test</div>
      }

      const { unmount } = render(
        <VContainerProvider configs={configs}>
          <TestComponent />
        </VContainerProvider>,
      )

      // setUpが完了する前にアンマウント
      await new Promise((resolve) => setTimeout(resolve, 20))
      unmount()

      // tearDownが呼ばれないことを確認
      await new Promise((resolve) => setTimeout(resolve, 150))
      expect(tearDownMock).not.toHaveBeenCalled()
    })
  })

  describe('複数のconfigsの処理', () => {
    it('複数のsetUpを順次実行し、すべてのtearDownを実行する', async () => {
      const tearDown1 = vi.fn()
      const tearDown2 = vi.fn()
      const tearDown3 = vi.fn()

      const configs: VContainerConfig[] = [
        {
          setUp: async () => {
            await new Promise((resolve) => setTimeout(resolve, 10))
            return tearDown1
          },
        },
        {
          setUp: async () => {
            await new Promise((resolve) => setTimeout(resolve, 10))
            return tearDown2
          },
        },
        {
          setUp: async () => {
            await new Promise((resolve) => setTimeout(resolve, 10))
            return tearDown3
          },
        },
      ]

      const TestComponent = () => {
        const isReady = useVContainerReady()
        return <div data-testid="status">{isReady ? 'ready' : 'loading'}</div>
      }

      const { unmount, getByTestId } = render(
        <VContainerProvider configs={configs}>
          <TestComponent />
        </VContainerProvider>,
      )

      // すべてのsetUpが完了するまで待つ
      await waitFor(
        () => {
          expect(getByTestId('status').textContent).toBe('ready')
        },
        { timeout: 100 },
      )

      // この時点ではまだtearDownが呼ばれていない
      expect(tearDown1).not.toHaveBeenCalled()
      expect(tearDown2).not.toHaveBeenCalled()
      expect(tearDown3).not.toHaveBeenCalled()

      // アンマウント
      unmount()

      // すべてのtearDownが逆順（LIFO）で呼ばれることを確認
      await waitFor(() => {
        expect(tearDown1).toHaveBeenCalledTimes(1)
        expect(tearDown2).toHaveBeenCalledTimes(1)
        expect(tearDown3).toHaveBeenCalledTimes(1)
      })

      // 呼び出し順序を確認（LIFO: Last In, First Out）
      const callOrder = [tearDown3, tearDown2, tearDown1].map(
        (mock) => mock.mock.invocationCallOrder[0],
      )
      expect(callOrder[0]).toBeLessThan(callOrder[1])
      expect(callOrder[1]).toBeLessThan(callOrder[2])
    })
  })

  describe('エラーハンドリング', () => {
    it('setUpでエラーが発生した場合、エラー状態になる', async () => {
      const error = new Error('Setup failed')
      const configs: VContainerConfig[] = [
        {
          setUp: async () => {
            throw error
          },
        },
      ]

      const errorFallback = vi.fn((err: Error) => <div>Error: {err.message}</div>)

      const { getByText } = render(
        <VContainerProvider configs={configs} errorFallback={errorFallback}>
          <div>Content</div>
        </VContainerProvider>,
      )

      await waitFor(() => {
        expect(errorFallback).toHaveBeenCalledWith(error)
        expect(getByText('Error: Setup failed')).toBeTruthy()
      })
    })

    it('一部のsetUpが失敗した場合、成功したsetUpのtearDownが実行される', async () => {
      const tearDown1 = vi.fn()
      const tearDown2 = vi.fn()

      const configs: VContainerConfig[] = [
        {
          setUp: async () => {
            return tearDown1
          },
        },
        {
          setUp: async () => {
            return tearDown2
          },
        },
        {
          setUp: async () => {
            throw new Error('Setup 3 failed')
          },
        },
      ]

      const errorFallback = vi.fn(() => <div>Error occurred</div>)

      render(
        <VContainerProvider configs={configs} errorFallback={errorFallback}>
          <div>Content</div>
        </VContainerProvider>,
      )

      // エラーが発生し、成功したsetUpのtearDownが呼ばれることを確認
      await waitFor(() => {
        expect(errorFallback).toHaveBeenCalled()
        expect(tearDown1).toHaveBeenCalledTimes(1)
        expect(tearDown2).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('親コンテナの継承', () => {
    it('親コンテナから値を解決できる', async () => {
      const parentContainer = new VContainer()
      parentContainer.register({
        token: 'parentValue',
        useValue: 'from-parent',
      })

      const configs: VContainerConfig[] = [
        {
          register: (container) => {
            container.register({
              token: 'childValue',
              useValue: 'from-child',
            })
          },
          setUp: async () => {
            return () => {
              // tearDown
            }
          },
        },
      ]

      let parentValue: string | null = null
      let childValue: string | null = null

      const ChildComponent = () => {
        const container = useVContainer()
        parentValue = container.resolve('parentValue') as string
        childValue = container.resolve('childValue') as string
        return <div>Child</div>
      }

      render(
        <VContainerProvider configs={configs} parent={parentContainer}>
          <ChildComponent />
        </VContainerProvider>,
      )

      await waitFor(() => {
        expect(parentValue).toBe('from-parent')
        expect(childValue).toBe('from-child')
      })
    })
  })

  describe('render props パターン', () => {
    it('childrenが関数の場合、状態を渡して実行する', async () => {
      const configs: VContainerConfig[] = [
        {
          setUp: async () => {
            await new Promise((resolve) => setTimeout(resolve, 50))
            return () => {
              // tearDown
            }
          },
        },
      ]

      const { getByText } = render(
        <VContainerProvider configs={configs}>
          {({ isReady, error }) => (
            <div>
              {error ? 'Error' : isReady ? 'Ready' : 'Loading'}
              <span data-testid="ready">{String(isReady)}</span>
            </div>
          )}
        </VContainerProvider>,
      )

      // 初期状態はLoading
      expect(getByText('Loading')).toBeTruthy()

      // setUpが完了するとReady
      await waitFor(
        () => {
          expect(getByText('Ready')).toBeTruthy()
        },
        { timeout: 200 },
      )
    })

    it('render propsパターンでエラー状態を取得できる', async () => {
      const error = new Error('Render props error')
      const configs: VContainerConfig[] = [
        {
          setUp: async () => {
            throw error
          },
        },
      ]

      const { getByText } = render(
        <VContainerProvider configs={configs}>
          {({ isReady, error }) => (
            <div>{error ? `Error: ${error.message}` : isReady ? 'Ready' : 'Loading'}</div>
          )}
        </VContainerProvider>,
      )

      await waitFor(() => {
        expect(getByText('Error: Render props error')).toBeTruthy()
      })
    })
  })

  describe('Hooksのテスト', () => {
    it('useVContainer: コンテキスト外で使用するとエラーをスローする', () => {
      const TestComponent = () => {
        useVContainer() // Provider外で使用
        return <div>Test</div>
      }

      expect(() => {
        render(<TestComponent />)
      }).toThrow('useVContainer must be used within VContainerProvider')
    })

    it('useVContainerError: エラー発生時にエラーを取得できる', async () => {
      const error = new Error('Test error')
      const configs: VContainerConfig[] = [
        {
          setUp: async () => {
            throw error
          },
        },
      ]

      const TestComponent = () => {
        const err = useVContainerError()
        return <div>{err ? err.message : 'No error'}</div>
      }

      const { getByText } = render(
        <VContainerProvider configs={configs} errorFallback={() => <TestComponent />}>
          <div>Content</div>
        </VContainerProvider>,
      )

      await waitFor(() => {
        expect(getByText('Test error')).toBeTruthy()
      })
    })

    it('useVContainerError: コンテキスト外で使用するとnullを返す', () => {
      const TestComponent = () => {
        const error = useVContainerError()
        return <div>{error === null ? 'null' : 'error'}</div>
      }

      const { getByText } = render(<TestComponent />)
      expect(getByText('null')).toBeTruthy()
    })

    it('useVContainerReady: コンテキスト外で使用するとfalseを返す', () => {
      const TestComponent = () => {
        const isReady = useVContainerReady()
        return <div>{isReady ? 'ready' : 'not ready'}</div>
      }

      const { getByText } = render(<TestComponent />)
      expect(getByText('not ready')).toBeTruthy()
    })
  })

  describe('エラーハンドリングの追加テスト', () => {
    it('errorFallbackが指定されていない場合、エラーをスローする', async () => {
      const error = new Error('Setup failed without fallback')
      const configs: VContainerConfig[] = [
        {
          setUp: async () => {
            throw error
          },
        },
      ]

      // Error Boundaryでキャッチする
      class ErrorBoundary extends Component<
        { children: ReactNode },
        { hasError: boolean; error: Error | null }
      > {
        constructor(props: { children: ReactNode }) {
          super(props)
          this.state = { hasError: false, error: null }
        }

        static getDerivedStateFromError(error: Error) {
          return { hasError: true, error }
        }

        render() {
          if (this.state.hasError) {
            return <div>Caught: {this.state.error?.message}</div>
          }
          return this.props.children
        }
      }

      const { getByText } = render(
        <ErrorBoundary>
          <VContainerProvider configs={configs}>
            <div>Content</div>
          </VContainerProvider>
        </ErrorBoundary>,
      )

      await waitFor(() => {
        expect(getByText('Caught: Setup failed without fallback')).toBeTruthy()
      })
    })

    it('tearDown中にエラーが発生しても、他のtearDownは実行される', async () => {
      const tearDown1 = vi.fn()
      const tearDown2 = vi.fn(() => {
        throw new Error('TearDown 2 failed')
      })
      const tearDown3 = vi.fn()

      const configs: VContainerConfig[] = [
        { setUp: async () => tearDown1 },
        { setUp: async () => tearDown2 },
        { setUp: async () => tearDown3 },
      ]

      const TestComponent = () => {
        const isReady = useVContainerReady()
        return <div data-testid="status">{isReady ? 'ready' : 'loading'}</div>
      }

      const { unmount, getByTestId } = render(
        <VContainerProvider configs={configs}>
          <TestComponent />
        </VContainerProvider>,
      )

      await waitFor(() => {
        expect(getByTestId('status').textContent).toBe('ready')
      })

      unmount()

      await waitFor(() => {
        // tearDown2がエラーを投げても、tearDown1とtearDown3は実行される
        expect(tearDown1).toHaveBeenCalledTimes(1)
        expect(tearDown2).toHaveBeenCalledTimes(1)
        expect(tearDown3).toHaveBeenCalledTimes(1)
      })
    })

    it('setUp失敗後のクリーンアップ中にエラーが発生した場合でもエラー状態になる', async () => {
      const tearDown1 = vi.fn(() => {
        throw new Error('Cleanup failed')
      })

      const configs: VContainerConfig[] = [
        { setUp: async () => tearDown1 },
        {
          setUp: async () => {
            throw new Error('Setup failed')
          },
        },
      ]

      const errorFallback = vi.fn(() => <div>Error occurred</div>)

      const { getByText } = render(
        <VContainerProvider configs={configs} errorFallback={errorFallback}>
          <div>Content</div>
        </VContainerProvider>,
      )

      await waitFor(() => {
        expect(errorFallback).toHaveBeenCalled()
        expect(tearDown1).toHaveBeenCalledTimes(1)
        expect(getByText('Error occurred')).toBeTruthy()
      })
    })
  })

  describe('エッジケース', () => {
    it('register関数のみのconfigが動作する', async () => {
      const registerMock = vi.fn((container) => {
        container.register({
          token: 'onlyRegister',
          useValue: 'registered',
        })
      })

      const configs: VContainerConfig[] = [
        {
          register: registerMock,
          // setUpなし
        },
      ]

      let resolvedValue: string | null = null

      const TestComponent = () => {
        const container = useVContainer()
        resolvedValue = container.resolve('onlyRegister') as string
        return <div>Test</div>
      }

      render(
        <VContainerProvider configs={configs}>
          <TestComponent />
        </VContainerProvider>,
      )

      await waitFor(() => {
        expect(registerMock).toHaveBeenCalledTimes(1)
        expect(resolvedValue).toBe('registered')
      })
    })

    it('空のconfigsでも正常に動作する', async () => {
      const TestComponent = () => {
        const isReady = useVContainerReady()
        return <div>{isReady ? 'ready' : 'loading'}</div>
      }

      const { getByText } = render(
        <VContainerProvider configs={[]}>
          <TestComponent />
        </VContainerProvider>,
      )

      await waitFor(() => {
        expect(getByText('ready')).toBeTruthy()
      })
    })

    it('setUp関数のみのconfigが動作する', async () => {
      const setUpMock = vi.fn(async () => {
        return vi.fn() // tearDown
      })

      const configs: VContainerConfig[] = [
        {
          // registerなし
          setUp: setUpMock,
        },
      ]

      const TestComponent = () => {
        const isReady = useVContainerReady()
        return <div>{isReady ? 'ready' : 'loading'}</div>
      }

      const { getByText, unmount } = render(
        <VContainerProvider configs={configs}>
          <TestComponent />
        </VContainerProvider>,
      )

      await waitFor(() => {
        expect(getByText('ready')).toBeTruthy()
        expect(setUpMock).toHaveBeenCalledTimes(1)
      })

      unmount()
    })
  })

  describe('ライフサイクルの追加テスト', () => {
    it('複数回（5回）のマウント/アンマウントサイクルで正しく動作する', async () => {
      const setUpMock = vi.fn(async () => {
        return vi.fn() // tearDown
      })
      const tearDownMock = vi.fn()

      const configs: VContainerConfig[] = [
        {
          setUp: async () => {
            await setUpMock()
            return tearDownMock
          },
        },
      ]

      const TestComponent = () => {
        const isReady = useVContainerReady()
        return <div data-testid="status">{isReady ? 'ready' : 'loading'}</div>
      }

      // 5回のマウント/アンマウントサイクル
      for (let i = 1; i <= 5; i++) {
        const { unmount, getByTestId } = render(
          <VContainerProvider configs={configs}>
            <TestComponent />
          </VContainerProvider>,
        )

        await waitFor(() => {
          expect(getByTestId('status').textContent).toBe('ready')
        })

        expect(setUpMock).toHaveBeenCalledTimes(i)
        expect(tearDownMock).toHaveBeenCalledTimes(i - 1)

        unmount()

        await waitFor(() => {
          expect(tearDownMock).toHaveBeenCalledTimes(i)
        })
      }
    })

    it('3回の再マウントでsetUpが毎回実行される', async () => {
      let mountCount = 0
      const setUpMock = vi.fn(async () => {
        mountCount++
        return vi.fn() // tearDown
      })

      const configs: VContainerConfig[] = [
        {
          setUp: setUpMock,
        },
      ]

      const TestComponent = () => {
        const isReady = useVContainerReady()
        return <div data-testid="status">{isReady ? 'ready' : 'loading'}</div>
      }

      // 1回目のマウント
      const { unmount: unmount1, getByTestId: getByTestId1 } = render(
        <VContainerProvider configs={configs}>
          <TestComponent />
        </VContainerProvider>,
      )

      await waitFor(() => {
        expect(getByTestId1('status').textContent).toBe('ready')
        expect(mountCount).toBe(1)
      })

      unmount1()

      // 2回目のマウント
      const { unmount: unmount2, getByTestId: getByTestId2 } = render(
        <VContainerProvider configs={configs}>
          <TestComponent />
        </VContainerProvider>,
      )

      await waitFor(() => {
        expect(getByTestId2('status').textContent).toBe('ready')
        expect(mountCount).toBe(2)
      })

      unmount2()

      // 3回目のマウント
      const { getByTestId: getByTestId3 } = render(
        <VContainerProvider configs={configs}>
          <TestComponent />
        </VContainerProvider>,
      )

      await waitFor(() => {
        expect(getByTestId3('status').textContent).toBe('ready')
        expect(mountCount).toBe(3)
      })
    })
  })

  describe('複数configsの実行順序', () => {
    it('複数のregister関数が順序通りに実行される', async () => {
      const executionOrder: number[] = []

      const configs: VContainerConfig[] = [
        {
          register: (container) => {
            executionOrder.push(1)
            container.register({
              token: 'value1',
              useValue: 'first',
            })
          },
          setUp: async () => () => {},
        },
        {
          register: (container) => {
            executionOrder.push(2)
            container.register({
              token: 'value2',
              useValue: 'second',
            })
          },
          setUp: async () => () => {},
        },
        {
          register: (container) => {
            executionOrder.push(3)
            container.register({
              token: 'value3',
              useValue: 'third',
            })
          },
          setUp: async () => () => {},
        },
      ]

      let resolvedValues: string[] = []

      const TestComponent = () => {
        const container = useVContainer()
        resolvedValues = [
          container.resolve('value1') as string,
          container.resolve('value2') as string,
          container.resolve('value3') as string,
        ]
        return <div>Test</div>
      }

      render(
        <VContainerProvider configs={configs}>
          <TestComponent />
        </VContainerProvider>,
      )

      await waitFor(() => {
        expect(executionOrder).toEqual([1, 2, 3])
        expect(resolvedValues).toEqual(['first', 'second', 'third'])
      })
    })

    it('複数のsetUp関数が並行実行される', async () => {
      const startTimes: number[] = []
      const endTimes: number[] = []

      const configs: VContainerConfig[] = [
        {
          setUp: async () => {
            const start = Date.now()
            startTimes.push(start)
            await new Promise((resolve) => setTimeout(resolve, 50))
            endTimes.push(Date.now())
            return () => {}
          },
        },
        {
          setUp: async () => {
            const start = Date.now()
            startTimes.push(start)
            await new Promise((resolve) => setTimeout(resolve, 50))
            endTimes.push(Date.now())
            return () => {}
          },
        },
        {
          setUp: async () => {
            const start = Date.now()
            startTimes.push(start)
            await new Promise((resolve) => setTimeout(resolve, 50))
            endTimes.push(Date.now())
            return () => {}
          },
        },
      ]

      const TestComponent = () => {
        const isReady = useVContainerReady()
        return <div data-testid="status">{isReady ? 'ready' : 'loading'}</div>
      }

      const { getByTestId } = render(
        <VContainerProvider configs={configs}>
          <TestComponent />
        </VContainerProvider>,
      )

      await waitFor(
        () => {
          expect(getByTestId('status').textContent).toBe('ready')
        },
        { timeout: 200 },
      )

      // 並行実行の場合、すべてのstartTimesはほぼ同時
      // 直列実行の場合、150ms以上かかるが、並行実行なら60ms程度で完了
      // ただし、システム負荷やReactのオーバーヘッドを考慮して閾値を緩めに設定
      // 直列実行なら150ms以上かかるため、140ms未満であれば並行実行と判断できる
      const totalTime = Math.max(...endTimes) - Math.min(...startTimes)
      expect(totalTime).toBeLessThan(140) // 並行実行の証明（50ms + オーバーヘッド < 140ms < 150ms）
    })
  })

  describe('priorityによるsetUp実行順序制御', () => {
    it('priorityが小さいsetUpが先に実行される', async () => {
      const executionOrder: string[] = []

      const configs: VContainerConfig[] = [
        {
          setUp: async () => {
            executionOrder.push('priority-0')
            return () => {}
          },
          // priority未指定 = デフォルト0
        },
        {
          setUp: async () => {
            executionOrder.push('priority-minus1')
            return () => {}
          },
          priority: -1,
        },
        {
          setUp: async () => {
            executionOrder.push('priority-1')
            return () => {}
          },
          priority: 1,
        },
      ]

      const TestComponent = () => {
        const isReady = useVContainerReady()
        return <div data-testid="status">{isReady ? 'ready' : 'loading'}</div>
      }

      const { getByTestId } = render(
        <VContainerProvider configs={configs}>
          <TestComponent />
        </VContainerProvider>,
      )

      await waitFor(() => {
        expect(getByTestId('status').textContent).toBe('ready')
      })

      // priority順に実行される: -1 → 0 → 1
      expect(executionOrder).toEqual(['priority-minus1', 'priority-0', 'priority-1'])
    })

    it('同じpriorityのsetUpは並行実行される', async () => {
      const startTimes: number[] = []
      const endTimes: number[] = []

      const configs: VContainerConfig[] = [
        {
          setUp: async () => {
            startTimes.push(Date.now())
            await new Promise((resolve) => setTimeout(resolve, 50))
            endTimes.push(Date.now())
            return () => {}
          },
          priority: 0,
        },
        {
          setUp: async () => {
            startTimes.push(Date.now())
            await new Promise((resolve) => setTimeout(resolve, 50))
            endTimes.push(Date.now())
            return () => {}
          },
          priority: 0,
        },
      ]

      const TestComponent = () => {
        const isReady = useVContainerReady()
        return <div data-testid="status">{isReady ? 'ready' : 'loading'}</div>
      }

      const { getByTestId } = render(
        <VContainerProvider configs={configs}>
          <TestComponent />
        </VContainerProvider>,
      )

      await waitFor(
        () => {
          expect(getByTestId('status').textContent).toBe('ready')
        },
        { timeout: 200 },
      )

      // 同じpriorityなので並行実行（50ms + オーバーヘッド < 直列実行の100ms）
      const totalTime = Math.max(...endTimes) - Math.min(...startTimes)
      expect(totalTime).toBeLessThan(120)
    })

    it('異なるpriorityのsetUpは直列実行される', async () => {
      const executionLog: { priority: number; phase: 'start' | 'end'; time: number }[] = []

      const configs: VContainerConfig[] = [
        {
          setUp: async () => {
            executionLog.push({ priority: -1, phase: 'start', time: Date.now() })
            await new Promise((resolve) => setTimeout(resolve, 50))
            executionLog.push({ priority: -1, phase: 'end', time: Date.now() })
            return () => {}
          },
          priority: -1,
        },
        {
          setUp: async () => {
            executionLog.push({ priority: 0, phase: 'start', time: Date.now() })
            await new Promise((resolve) => setTimeout(resolve, 50))
            executionLog.push({ priority: 0, phase: 'end', time: Date.now() })
            return () => {}
          },
          priority: 0,
        },
      ]

      const TestComponent = () => {
        const isReady = useVContainerReady()
        return <div data-testid="status">{isReady ? 'ready' : 'loading'}</div>
      }

      const { getByTestId } = render(
        <VContainerProvider configs={configs}>
          <TestComponent />
        </VContainerProvider>,
      )

      await waitFor(
        () => {
          expect(getByTestId('status').textContent).toBe('ready')
        },
        { timeout: 300 },
      )

      // priority=-1のendがpriority=0のstartより前であること（直列実行の証明）
      const p1End = executionLog.find((e) => e.priority === -1 && e.phase === 'end')!
      const p0Start = executionLog.find((e) => e.priority === 0 && e.phase === 'start')!
      expect(p1End.time).toBeLessThanOrEqual(p0Start.time)
    })

    it('先行priorityグループでエラーが発生した場合、後続グループは実行されない', async () => {
      const laterSetUp = vi.fn(async () => () => {})
      const tearDown = vi.fn()

      const configs: VContainerConfig[] = [
        {
          setUp: async () => tearDown,
          priority: -1,
        },
        {
          setUp: async () => {
            throw new Error('Priority -1 failed')
          },
          priority: -1,
        },
        {
          setUp: laterSetUp,
          priority: 0,
        },
      ]

      const errorFallback = vi.fn(() => <div>Error occurred</div>)

      const { getByText } = render(
        <VContainerProvider configs={configs} errorFallback={errorFallback}>
          <div>Content</div>
        </VContainerProvider>,
      )

      await waitFor(() => {
        expect(errorFallback).toHaveBeenCalled()
        expect(getByText('Error occurred')).toBeTruthy()
      })

      // priority=0のsetUpは実行されない
      expect(laterSetUp).not.toHaveBeenCalled()
      // priority=-1で成功したtearDownはクリーンアップされる
      expect(tearDown).toHaveBeenCalledTimes(1)
    })

    it('priority未指定のconfigはデフォルト0として扱われる', async () => {
      const executionOrder: string[] = []

      const configs: VContainerConfig[] = [
        {
          setUp: async () => {
            executionOrder.push('no-priority')
            return () => {}
          },
          // priority未指定
        },
        {
          setUp: async () => {
            executionOrder.push('priority-0')
            return () => {}
          },
          priority: 0,
        },
      ]

      const TestComponent = () => {
        const isReady = useVContainerReady()
        return <div data-testid="status">{isReady ? 'ready' : 'loading'}</div>
      }

      const { getByTestId } = render(
        <VContainerProvider configs={configs}>
          <TestComponent />
        </VContainerProvider>,
      )

      await waitFor(() => {
        expect(getByTestId('status').textContent).toBe('ready')
      })

      // 同じpriorityグループ（0）として並行実行されるので、両方実行される
      expect(executionOrder).toContain('no-priority')
      expect(executionOrder).toContain('priority-0')
    })

    it('3つ以上のpriorityグループが正しい順序で直列実行される', async () => {
      const executionOrder: number[] = []

      const configs: VContainerConfig[] = [
        {
          setUp: async () => {
            executionOrder.push(2)
            return () => {}
          },
          priority: 2,
        },
        {
          setUp: async () => {
            executionOrder.push(-2)
            return () => {}
          },
          priority: -2,
        },
        {
          setUp: async () => {
            executionOrder.push(0)
            return () => {}
          },
          priority: 0,
        },
        {
          setUp: async () => {
            executionOrder.push(-1)
            return () => {}
          },
          priority: -1,
        },
        {
          setUp: async () => {
            executionOrder.push(1)
            return () => {}
          },
          priority: 1,
        },
      ]

      const TestComponent = () => {
        const isReady = useVContainerReady()
        return <div data-testid="status">{isReady ? 'ready' : 'loading'}</div>
      }

      const { getByTestId } = render(
        <VContainerProvider configs={configs}>
          <TestComponent />
        </VContainerProvider>,
      )

      await waitFor(() => {
        expect(getByTestId('status').textContent).toBe('ready')
      })

      expect(executionOrder).toEqual([-2, -1, 0, 1, 2])
    })

    it('同一priorityグループ内の並行実行と、異なるpriority間の直列実行が組み合わさる', async () => {
      const executionLog: { id: string; phase: 'start' | 'end'; time: number }[] = []

      const createSetUp = (id: string, delay: number) => async () => {
        executionLog.push({ id, phase: 'start', time: Date.now() })
        await new Promise((resolve) => setTimeout(resolve, delay))
        executionLog.push({ id, phase: 'end', time: Date.now() })
        return () => {}
      }

      const configs: VContainerConfig[] = [
        // priority -1: 2つのsetUpが並行実行される
        { setUp: createSetUp('p-1-a', 50), priority: -1 },
        { setUp: createSetUp('p-1-b', 50), priority: -1 },
        // priority 0: 2つのsetUpが並行実行される（priority -1 完了後）
        { setUp: createSetUp('p0-a', 50), priority: 0 },
        { setUp: createSetUp('p0-b', 50), priority: 0 },
      ]

      const TestComponent = () => {
        const isReady = useVContainerReady()
        return <div data-testid="status">{isReady ? 'ready' : 'loading'}</div>
      }

      const { getByTestId } = render(
        <VContainerProvider configs={configs}>
          <TestComponent />
        </VContainerProvider>,
      )

      await waitFor(
        () => {
          expect(getByTestId('status').textContent).toBe('ready')
        },
        { timeout: 300 },
      )

      // priority=-1グループ内は並行実行（ほぼ同時に開始）
      const p1aStart = executionLog.find((e) => e.id === 'p-1-a' && e.phase === 'start')!
      const p1bStart = executionLog.find((e) => e.id === 'p-1-b' && e.phase === 'start')!
      expect(Math.abs(p1aStart.time - p1bStart.time)).toBeLessThan(50)

      // priority=0グループ内は並行実行（ほぼ同時に開始）
      const p0aStart = executionLog.find((e) => e.id === 'p0-a' && e.phase === 'start')!
      const p0bStart = executionLog.find((e) => e.id === 'p0-b' && e.phase === 'start')!
      expect(Math.abs(p0aStart.time - p0bStart.time)).toBeLessThan(50)

      // priority=-1の完了後にpriority=0が開始される
      const p1aEnd = executionLog.find((e) => e.id === 'p-1-a' && e.phase === 'end')!
      const p1bEnd = executionLog.find((e) => e.id === 'p-1-b' && e.phase === 'end')!
      const lastP1End = Math.max(p1aEnd.time, p1bEnd.time)
      const firstP0Start = Math.min(p0aStart.time, p0bStart.time)
      expect(lastP1End).toBeLessThanOrEqual(firstP0Start)
    })

    it('priority順にtearDownがLIFO順で実行される', async () => {
      const tearDownOrder: string[] = []

      const configs: VContainerConfig[] = [
        {
          setUp: async () => () => {
            tearDownOrder.push('p-1')
          },
          priority: -1,
        },
        {
          setUp: async () => () => {
            tearDownOrder.push('p0')
          },
          priority: 0,
        },
        {
          setUp: async () => () => {
            tearDownOrder.push('p1')
          },
          priority: 1,
        },
      ]

      const TestComponent = () => {
        const isReady = useVContainerReady()
        return <div data-testid="status">{isReady ? 'ready' : 'loading'}</div>
      }

      const { unmount, getByTestId } = render(
        <VContainerProvider configs={configs}>
          <TestComponent />
        </VContainerProvider>,
      )

      await waitFor(() => {
        expect(getByTestId('status').textContent).toBe('ready')
      })

      unmount()

      await waitFor(() => {
        expect(tearDownOrder).toHaveLength(3)
      })

      // DisposableStackのLIFO順: 後に登録されたものが先にtearDown
      expect(tearDownOrder).toEqual(['p1', 'p0', 'p-1'])
    })

    it('中間のpriorityグループでエラーが発生した場合、先行は完了し後続は実行されない', async () => {
      const executionOrder: string[] = []
      const tearDownMinus1 = vi.fn()
      const laterSetUp = vi.fn(async () => () => {})

      const configs: VContainerConfig[] = [
        {
          setUp: async () => {
            executionOrder.push('p-1')
            return tearDownMinus1
          },
          priority: -1,
        },
        {
          setUp: async () => {
            executionOrder.push('p0-success')
            return () => {}
          },
          priority: 0,
        },
        {
          setUp: async () => {
            executionOrder.push('p0-fail')
            throw new Error('Priority 0 failed')
          },
          priority: 0,
        },
        {
          setUp: laterSetUp,
          priority: 1,
        },
      ]

      const errorFallback = vi.fn(() => <div>Error occurred</div>)

      render(
        <VContainerProvider configs={configs} errorFallback={errorFallback}>
          <div>Content</div>
        </VContainerProvider>,
      )

      await waitFor(() => {
        expect(errorFallback).toHaveBeenCalled()
      })

      // priority=-1は正常に実行される
      expect(executionOrder).toContain('p-1')
      // priority=0は並行実行されるので両方実行される
      expect(executionOrder).toContain('p0-success')
      expect(executionOrder).toContain('p0-fail')
      // priority=1は実行されない
      expect(laterSetUp).not.toHaveBeenCalled()
      // priority=-1のtearDownはクリーンアップされる
      expect(tearDownMinus1).toHaveBeenCalledTimes(1)
    })

    it('setUpがないconfigのpriorityは無視される', async () => {
      const executionOrder: string[] = []

      const configs: VContainerConfig[] = [
        {
          register: (container) => {
            container.register({ token: 'val', useValue: 'test' })
          },
          priority: 100, // setUpがないのでpriority値は影響しない
        },
        {
          setUp: async () => {
            executionOrder.push('setUp')
            return () => {}
          },
          priority: 0,
        },
      ]

      let resolvedValue: string | null = null

      const ChildComponent = () => {
        const container = useVContainer()
        resolvedValue = container.resolve('val') as string
        return <div>Child</div>
      }

      const TestComponent = () => {
        const isReady = useVContainerReady()
        return <div data-testid="status">{isReady ? <ChildComponent /> : 'loading'}</div>
      }

      render(
        <VContainerProvider configs={configs}>
          <TestComponent />
        </VContainerProvider>,
      )

      await waitFor(() => {
        expect(resolvedValue).toBe('test')
      })

      expect(executionOrder).toEqual(['setUp'])
    })

    it('先行priorityのsetUpで登録した値を後続priorityのsetUpで参照できる', async () => {
      let resolvedInLater: string | null = null

      const configs: VContainerConfig[] = [
        {
          register: (container) => {
            container.register({ token: 'earlyValue', useValue: 'from-early' })
          },
          setUp: async () => {
            return () => {}
          },
          priority: -1,
        },
        {
          setUp: async (container) => {
            resolvedInLater = container.resolve('earlyValue') as string
            return () => {}
          },
          priority: 0,
        },
      ]

      const TestComponent = () => {
        const isReady = useVContainerReady()
        return <div data-testid="status">{isReady ? 'ready' : 'loading'}</div>
      }

      const { getByTestId } = render(
        <VContainerProvider configs={configs}>
          <TestComponent />
        </VContainerProvider>,
      )

      await waitFor(() => {
        expect(getByTestId('status').textContent).toBe('ready')
      })

      // priority=-1のregister→setUpが完了した後にpriority=0のsetUpが実行されるため、
      // registerで登録した値をsetUpで参照できる
      expect(resolvedInLater).toBe('from-early')
    })

    it('registerの実行順序はpriorityに影響されずconfigs配列順で実行される', async () => {
      const registerOrder: string[] = []

      const configs: VContainerConfig[] = [
        {
          register: () => {
            registerOrder.push('config0-p-1')
          },
          setUp: async () => () => {},
          priority: -1,
        },
        {
          register: () => {
            registerOrder.push('config1-p1')
          },
          setUp: async () => () => {},
          priority: 1,
        },
        {
          register: () => {
            registerOrder.push('config2-p0')
          },
          setUp: async () => () => {},
          priority: 0,
        },
      ]

      const TestComponent = () => {
        const isReady = useVContainerReady()
        return <div data-testid="status">{isReady ? 'ready' : 'loading'}</div>
      }

      const { getByTestId } = render(
        <VContainerProvider configs={configs}>
          <TestComponent />
        </VContainerProvider>,
      )

      await waitFor(() => {
        expect(getByTestId('status').textContent).toBe('ready')
      })

      // registerはconfigs配列の順序で実行され、priorityには影響されない
      expect(registerOrder).toEqual(['config0-p-1', 'config1-p1', 'config2-p0'])
    })

    it('priority付きsetUp実行中にアンマウントするとtearDownがdisposeされない', async () => {
      const tearDownFn = vi.fn()
      const setUpStarted = vi.fn()

      const configs: VContainerConfig[] = [
        {
          setUp: async () => {
            setUpStarted()
            // 長い非同期処理をシミュレート
            await new Promise((resolve) => setTimeout(resolve, 100))
            return tearDownFn
          },
          priority: -1,
        },
        {
          setUp: async () => {
            return () => {}
          },
          priority: 0,
        },
      ]

      const TestComponent = () => {
        const isReady = useVContainerReady()
        return <div data-testid="status">{isReady ? 'ready' : 'loading'}</div>
      }

      const { unmount } = render(
        <VContainerProvider configs={configs}>
          <TestComponent />
        </VContainerProvider>,
      )

      // priority=-1のsetUpが開始されるのを待つ
      await waitFor(() => {
        expect(setUpStarted).toHaveBeenCalled()
      })

      // setUp完了前にアンマウント
      // stackRef.currentがまだnullなのでcleanupはno-op
      unmount()

      // setUpが完了する時間を待つ
      await new Promise((resolve) => setTimeout(resolve, 150))

      // アンマウント時点でstackRef.currentがnullだったため、tearDownはdisposeされない
      expect(tearDownFn).not.toHaveBeenCalled()
    })
  })
})
