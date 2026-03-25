import type { VContainerConfig } from '../v-container-provider'
import { render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createToken } from '../container'
import { VContainerProvider, useResolve } from '../v-container-provider'

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

    const Child = () => {
      useResolve(token)
      return <div />
    }

    expect(() => {
      render(
        <VContainerProvider configs={configs}>
          <Child />
        </VContainerProvider>,
      )
    }).toThrow()
  })

  it('VContainerProvider 外で使用するとエラーがスローされる', () => {
    const token = createToken<string>('test.useResolve.outside')

    const Child = () => {
      useResolve(token)
      return <div />
    }

    expect(() => {
      render(<Child />)
    }).toThrow('useVContainer must be used within VContainerProvider')
  })
})
