import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render } from '@testing-library/react'
import { ErrorNotificationToast } from './ErrorNotificationToast'
import * as useErrorNotificationViewModelModule from '../use-error-notification-viewmodel'
import { toast } from 'sonner'

vi.mock('../use-error-notification-viewmodel')
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
  },
}))

describe('ErrorNotificationToast', () => {
  const mockDismiss = vi.fn()
  const mockRetry = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('通知がない場合、何も表示しない', () => {
    vi.spyOn(
      useErrorNotificationViewModelModule,
      'useErrorNotificationViewModel',
    ).mockReturnValue({
      notifications: [],
      dismiss: mockDismiss,
      retry: mockRetry,
    })

    const { container } = render(<ErrorNotificationToast />)
    expect(container.firstChild).toBeNull()
  })

  it('error 通知が追加されたとき、toast.error が呼ばれる', () => {
    const mockNotifications = [
      {
        id: '1',
        severity: 'error' as const,
        title: 'エラー',
        message: 'エラーメッセージ',
        detail: undefined as string | undefined,
        retryable: false,
        timestamp: '2026-03-26T00:00:00Z',
      },
    ]

    vi.spyOn(
      useErrorNotificationViewModelModule,
      'useErrorNotificationViewModel',
    ).mockReturnValue({
      notifications: mockNotifications,
      dismiss: mockDismiss,
      retry: mockRetry,
    })

    render(<ErrorNotificationToast />)

    expect(toast.error).toHaveBeenCalled()
  })

  it('warning 通知が追加されたとき、toast.warning が呼ばれる', () => {
    const mockNotifications = [
      {
        id: '2',
        severity: 'warning' as const,
        title: '警告',
        message: '警告メッセージ',
        detail: undefined as string | undefined,
        retryable: false,
        timestamp: '2026-03-26T00:00:00Z',
      },
    ]

    vi.spyOn(
      useErrorNotificationViewModelModule,
      'useErrorNotificationViewModel',
    ).mockReturnValue({
      notifications: mockNotifications,
      dismiss: mockDismiss,
      retry: mockRetry,
    })

    render(<ErrorNotificationToast />)

    expect(toast.warning).toHaveBeenCalled()
  })

  it('info 通知が追加されたとき、toast.info が呼ばれる', () => {
    const mockNotifications = [
      {
        id: '3',
        severity: 'info' as const,
        title: '情報',
        message: '情報メッセージ',
        detail: undefined as string | undefined,
        retryable: false,
        timestamp: '2026-03-26T00:00:00Z',
      },
    ]

    vi.spyOn(
      useErrorNotificationViewModelModule,
      'useErrorNotificationViewModel',
    ).mockReturnValue({
      notifications: mockNotifications,
      dismiss: mockDismiss,
      retry: mockRetry,
    })

    render(<ErrorNotificationToast />)

    expect(toast.info).toHaveBeenCalled()
  })

  it('error 通知の duration は Infinity になる', () => {
    const mockNotifications = [
      {
        id: '4',
        severity: 'error' as const,
        title: 'エラー',
        message: 'エラーメッセージ',
        detail: undefined as string | undefined,
        retryable: false,
        timestamp: '2026-03-26T00:00:00Z',
      },
    ]

    vi.spyOn(
      useErrorNotificationViewModelModule,
      'useErrorNotificationViewModel',
    ).mockReturnValue({
      notifications: mockNotifications,
      dismiss: mockDismiss,
      retry: mockRetry,
    })

    render(<ErrorNotificationToast />)

    const mockError = toast.error as Mock
    const callArgs = mockError.mock.calls[0]
    expect(callArgs[1].duration).toBe(Infinity)
  })

  it('info 通知の duration は 5000ms になる', () => {
    const mockNotifications = [
      {
        id: '5',
        severity: 'info' as const,
        title: '情報',
        message: '情報メッセージ',
        detail: undefined as string | undefined,
        retryable: false,
        timestamp: '2026-03-26T00:00:00Z',
      },
    ]

    vi.spyOn(
      useErrorNotificationViewModelModule,
      'useErrorNotificationViewModel',
    ).mockReturnValue({
      notifications: mockNotifications,
      dismiss: mockDismiss,
      retry: mockRetry,
    })

    render(<ErrorNotificationToast />)

    const mockInfo = toast.info as Mock
    const callArgs = mockInfo.mock.calls[0]
    expect(callArgs[1].duration).toBe(5000)
  })
})
