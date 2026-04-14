import React from 'react'
import { act, render, waitFor } from '@testing-library/react'
import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { describe, expect, it, vi } from 'vitest'
import { useObservable } from '../use-observable'

describe('useObservable', () => {
  it('初期値が返される', () => {
    const subject = new Subject<number>()

    let result: number | null = null
    const Child = () => {
      result = useObservable(subject.asObservable(), 42)
      return <div>{result}</div>
    }

    render(<Child />)
    expect(result).toBe(42)
  })

  it('Observable の next 値で state が更新される', async () => {
    const subject = new Subject<string>()

    let result: string | null = null
    const Child = () => {
      result = useObservable(subject.asObservable(), 'initial')
      return <div>{result}</div>
    }

    render(<Child />)
    expect(result).toBe('initial')

    act(() => {
      subject.next('updated')
    })

    await waitFor(() => {
      expect(result).toBe('updated')
    })
  })

  it('BehaviorSubject の場合、subscribe 直後に現在値が反映される', async () => {
    const subject = new BehaviorSubject<string>('current')

    let result: string | null = null
    const Child = () => {
      result = useObservable(subject.asObservable(), 'initial')
      return <div>{result}</div>
    }

    render(<Child />)

    await waitFor(() => {
      expect(result).toBe('current')
    })
  })

  it('コンポーネントアンマウント時に subscription が解除される', () => {
    const subject = new Subject<number>()
    const unsubscribeSpy = vi.fn()

    const observable = new Observable<number>((subscriber) => {
      const sub = subject.subscribe(subscriber)
      return () => {
        sub.unsubscribe()
        unsubscribeSpy()
      }
    })

    const Child = () => {
      useObservable(observable, 0)
      return <div />
    }

    const { unmount } = render(<Child />)
    expect(unsubscribeSpy).not.toHaveBeenCalled()

    unmount()
    expect(unsubscribeSpy).toHaveBeenCalledTimes(1)
  })

  it('Observable のエラーが throw される（Error Boundary で捕捉可能）', async () => {
    const subject = new Subject<number>()
    const consoleSpy = vi.spyOn(console, 'error')
    consoleSpy.mockImplementation(() => undefined)

    const Child = () => {
      useObservable(subject.asObservable(), 0)
      return <div />
    }

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

    const { getByTestId } = render(
      <ErrorBoundary>
        <Child />
      </ErrorBoundary>,
    )

    act(() => {
      subject.error(new Error('test error'))
    })

    await waitFor(() => {
      expect(getByTestId('error').textContent).toBe('test error')
    })

    consoleSpy.mockRestore()
  })

  it('Observable の complete 後も最後の値が保持される', async () => {
    const subject = new Subject<string>()

    let result: string | null = null
    const Child = () => {
      result = useObservable(subject.asObservable(), 'initial')
      return <div>{result}</div>
    }

    render(<Child />)

    act(() => {
      subject.next('last')
      subject.complete()
    })

    await waitFor(() => {
      expect(result).toBe('last')
    })
  })
})
