import { firstValueFrom } from 'rxjs'
import { describe, expect, it } from 'vitest'
import { GitOperationsDefaultService } from '../services/git-operations-service'

describe('GitOperationsDefaultService', () => {
  it('初期状態で loading が false', async () => {
    const service = new GitOperationsDefaultService()
    service.setUp()
    expect(await firstValueFrom(service.loading$)).toBe(false)
    service.tearDown()
  })

  it('初期状態で lastError が null', async () => {
    const service = new GitOperationsDefaultService()
    service.setUp()
    expect(await firstValueFrom(service.lastError$)).toBeNull()
    service.tearDown()
  })

  it('setLoading で loading$ が更新される', async () => {
    const service = new GitOperationsDefaultService()
    service.setUp()
    service.setLoading(true)
    expect(await firstValueFrom(service.loading$)).toBe(true)
    service.setLoading(false)
    expect(await firstValueFrom(service.loading$)).toBe(false)
    service.tearDown()
  })

  it('setError で lastError$ が更新される', async () => {
    const service = new GitOperationsDefaultService()
    service.setUp()
    const error = { code: 'TEST', message: 'test error' }
    service.setError(error)
    expect(await firstValueFrom(service.lastError$)).toEqual(error)
    service.tearDown()
  })

  it('clearError で lastError$ が null になる', async () => {
    const service = new GitOperationsDefaultService()
    service.setUp()
    service.setError({ code: 'TEST', message: 'test error' })
    service.clearError()
    expect(await firstValueFrom(service.lastError$)).toBeNull()
    service.tearDown()
  })
})
