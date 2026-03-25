import React from 'react'
import type { VContainerConfig } from '../v-container-provider'
import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createToken } from '../container'
import { VContainerProvider, useResolve } from '../v-container-provider'

afterEach(cleanup)

describe('useResolve', () => {
  it('トークンに登録されたサービスを解決できる', async () => {
    const token = createToken<string>('test.useResolve.value')
    const configs: VContainerConfig[] = [
      {
        register: (container) => {
          container.register({ token, useValue: 'resolved-value' })
        },
        setUp: async () => () => {},
      },
    ]

    let resolved: string | null = null

    const Child = () => {
      resolved = useResolve(token)
      return <div>{resolved}</div>
    }

    render(
      <VContainerProvider configs={configs}>
        <Child />
      </VContainerProvider>,
    )

    await waitFor(() => {
      expect(resolved).toBe('resolved-value')
    })
  })

  it('シングルトン登録されたサービスは同じインスタンスを返す', async () => {
    class MyService {
      value = 'singleton'
    }
    const token = createToken<MyService>('test.useResolve.singleton')
    const configs: VContainerConfig[] = [
      {
        register: (container) => {
          container.registerSingleton(token, MyService)
        },
        setUp: async () => () => {},
      },
    ]

    const instances: MyService[] = []

    const Child = () => {
      const s1 = useResolve(token)
      const s2 = useResolve(token)
      instances.push(s1, s2)
      return <div>{s1.value}</div>
    }

    render(
      <VContainerProvider configs={configs}>
        <Child />
      </VContainerProvider>,
    )

    await waitFor(() => {
      expect(instances.length).toBeGreaterThanOrEqual(2)
      expect(instances[0]).toBe(instances[1])
    })
  })

  it('未登録のトークンでエラーがスローされる', async () => {
    const token = createToken<string>('test.useResolve.unregistered')
    const configs: VContainerConfig[] = [
      {
        register: () => {},
        setUp: async () => () => {},
      },
    ]

    const consoleSpy = vi.spyOn(console, 'error')
    consoleSpy.mockImplementation(() => undefined)

    class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
      state = { error: null as Error | null }
      static getDerivedStateFromError(error: Error) {
        return { error }
      }
      render() {
        if (this.state.error) {
          return <div data-testid="error">{this.state.error.message}</div>
        }
        return this.props.children
      }
    }

    const Child = () => {
      useResolve(token)
      return <div />
    }

    const { getByTestId } = render(
      <ErrorBoundary>
        <VContainerProvider configs={configs}>
          <Child />
        </VContainerProvider>
      </ErrorBoundary>,
    )

    await waitFor(() => {
      expect(getByTestId('error')).toBeTruthy()
    })

    consoleSpy.mockRestore()
  })

  it('VContainerProvider 外で使用するとエラーがスローされる', () => {
    const token = createToken<string>('test.useResolve.outside')

    const consoleSpy = vi.spyOn(console, 'error')
    consoleSpy.mockImplementation(() => undefined)

    class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
      state = { error: null as Error | null }
      static getDerivedStateFromError(error: Error) {
        return { error }
      }
      render() {
        if (this.state.error) {
          return <div data-testid="error">{this.state.error.message}</div>
        }
        return this.props.children
      }
    }

    const Child = () => {
      useResolve(token)
      return <div />
    }

    const { getByTestId } = render(
      <ErrorBoundary>
        <Child />
      </ErrorBoundary>,
    )

    expect(getByTestId('error').textContent).toContain('useVContainer must be used within VContainerProvider')

    consoleSpy.mockRestore()
  })
})
