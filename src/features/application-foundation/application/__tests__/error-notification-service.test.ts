import { describe, it, expect } from 'vitest'
import { firstValueFrom } from 'rxjs'
import { ErrorNotificationService } from '../error-notification-service'
import type { ErrorNotification } from '../../domain'

const createNotification = (id: string): ErrorNotification => ({
  id,
  severity: 'error',
  title: `Error ${id}`,
  message: `Message ${id}`,
  retryable: false,
  timestamp: '2026-01-01T00:00:00Z',
})

describe('ErrorNotificationService', () => {
  it('初期値は空配列', async () => {
    const service = new ErrorNotificationService()
    const value = await firstValueFrom(service.notifications$)
    expect(value).toEqual([])
  })

  it('addNotification で通知が追加される', async () => {
    const service = new ErrorNotificationService()
    const notification = createNotification('1')
    service.addNotification(notification)
    const value = await firstValueFrom(service.notifications$)
    expect(value).toEqual([notification])
  })

  it('removeNotification で指定IDの通知が削除される', async () => {
    const service = new ErrorNotificationService()
    service.addNotification(createNotification('1'))
    service.addNotification(createNotification('2'))
    service.removeNotification('1')
    const value = await firstValueFrom(service.notifications$)
    expect(value).toHaveLength(1)
    expect(value[0].id).toBe('2')
  })

  it('clear で全通知が削除される', async () => {
    const service = new ErrorNotificationService()
    service.addNotification(createNotification('1'))
    service.addNotification(createNotification('2'))
    service.clear()
    const value = await firstValueFrom(service.notifications$)
    expect(value).toEqual([])
  })

  it('dispose で BehaviorSubject が complete される', () => {
    const service = new ErrorNotificationService()
    let completed = false
    service.notifications$.subscribe({ complete: () => (completed = true) })
    service.dispose()
    expect(completed).toBe(true)
  })
})
