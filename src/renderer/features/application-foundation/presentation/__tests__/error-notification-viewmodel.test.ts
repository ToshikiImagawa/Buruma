import type { ErrorNotification } from '@shared/domain'
import type { DismissErrorUseCase, GetErrorNotificationsUseCase, RetryErrorUseCase } from '../../di-tokens'
import { BehaviorSubject } from 'rxjs'
import { describe, expect, it, vi } from 'vitest'
import { ErrorNotificationDefaultViewModel } from '../error-notification-viewmodel'

function createMocks() {
  const notificationsSubject = new BehaviorSubject<ErrorNotification[]>([])

  const getNotificationsUseCase: GetErrorNotificationsUseCase = {
    store: notificationsSubject.asObservable(),
  }
  const dismissUseCase: DismissErrorUseCase = { invoke: vi.fn() }
  const retryUseCase: RetryErrorUseCase = { invoke: vi.fn() }

  const vm = new ErrorNotificationDefaultViewModel(getNotificationsUseCase, dismissUseCase, retryUseCase)

  return { vm, dismissUseCase, retryUseCase, notificationsSubject }
}

describe('ErrorNotificationViewModel', () => {
  it('notifications$ が UseCase の store を返す', () => {
    const { vm, notificationsSubject } = createMocks()
    const values: ErrorNotification[][] = []
    vm.notifications$.subscribe((v) => values.push(v))

    const notification: ErrorNotification = {
      id: 'err-1',
      message: 'test error',
      severity: 'error',
      timestamp: '2026-01-01T00:00:00Z',
    }
    notificationsSubject.next([notification])

    expect(values).toHaveLength(2)
    expect(values[1]).toHaveLength(1)
    expect(values[1][0].id).toBe('err-1')
  })

  it('dismiss が UseCase を呼ぶ', () => {
    const { vm, dismissUseCase } = createMocks()
    vm.dismiss('err-1')
    expect(dismissUseCase.invoke).toHaveBeenCalledWith('err-1')
  })

  it('retry が UseCase を呼ぶ', () => {
    const { vm, retryUseCase } = createMocks()
    vm.retry('err-2')
    expect(retryUseCase.invoke).toHaveBeenCalledWith('err-2')
  })
})
