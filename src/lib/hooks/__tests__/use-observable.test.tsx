import { render, waitFor, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BehaviorSubject, Observable, Subject } from 'rxjs'
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

  it('Observable のエラーが console.error に出力される', async () => {
    const subject = new Subject<number>()
    const consoleSpy = vi.spyOn(console, 'error')
    consoleSpy.mockImplementation(() => undefined)

    const Child = () => {
      useObservable(subject.asObservable(), 0)
      return <div />
    }

    render(<Child />)

    act(() => {
      subject.error(new Error('test error'))
    })

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('[useObservable] Error:', expect.any(Error))
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
