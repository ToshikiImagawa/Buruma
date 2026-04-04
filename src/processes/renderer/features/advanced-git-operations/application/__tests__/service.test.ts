import { firstValueFrom } from 'rxjs'
import { describe, expect, it } from 'vitest'
import { AdvancedOperationsDefaultService } from '../services/advanced-operations-service'

describe('AdvancedOperationsDefaultService', () => {
  describe('初期状態', () => {
    it('loading$ がデフォルトで false', async () => {
      const service = new AdvancedOperationsDefaultService()
      service.setUp()
      const value = await firstValueFrom(service.loading$)
      expect(value).toBe(false)
      service.tearDown()
    })

    it('lastError$ がデフォルトで null', async () => {
      const service = new AdvancedOperationsDefaultService()
      service.setUp()
      const value = await firstValueFrom(service.lastError$)
      expect(value).toBeNull()
      service.tearDown()
    })

    it('operationProgress$ がデフォルトで null', async () => {
      const service = new AdvancedOperationsDefaultService()
      service.setUp()
      const value = await firstValueFrom(service.operationProgress$)
      expect(value).toBeNull()
      service.tearDown()
    })

    it('currentOperation$ がデフォルトで null', async () => {
      const service = new AdvancedOperationsDefaultService()
      service.setUp()
      const value = await firstValueFrom(service.currentOperation$)
      expect(value).toBeNull()
      service.tearDown()
    })
  })

  describe('setLoading', () => {
    it('setLoading(true) で loading$ が true になる', async () => {
      const service = new AdvancedOperationsDefaultService()
      service.setUp()
      service.setLoading(true)
      const value = await firstValueFrom(service.loading$)
      expect(value).toBe(true)
      service.tearDown()
    })

    it('setLoading(false) で loading$ が false に戻る', async () => {
      const service = new AdvancedOperationsDefaultService()
      service.setUp()
      service.setLoading(true)
      service.setLoading(false)
      const value = await firstValueFrom(service.loading$)
      expect(value).toBe(false)
      service.tearDown()
    })
  })

  describe('setError / clearError', () => {
    it('setError で lastError$ が更新される', async () => {
      const service = new AdvancedOperationsDefaultService()
      service.setUp()
      const error = { code: 'TEST', message: 'test error' }
      service.setError(error)
      const value = await firstValueFrom(service.lastError$)
      expect(value).toEqual(error)
      service.tearDown()
    })

    it('clearError で lastError$ が null になる', async () => {
      const service = new AdvancedOperationsDefaultService()
      service.setUp()
      service.setError({ code: 'TEST', message: 'test error' })
      service.clearError()
      const value = await firstValueFrom(service.lastError$)
      expect(value).toBeNull()
      service.tearDown()
    })
  })

  describe('setOperationProgress', () => {
    it('operationProgress$ が更新される', async () => {
      const service = new AdvancedOperationsDefaultService()
      service.setUp()
      const progress = {
        operationType: 'merge' as const,
        status: 'in-progress' as const,
        message: 'Merging...',
        currentStep: 1,
        totalSteps: 3,
      }
      service.setOperationProgress(progress)
      const value = await firstValueFrom(service.operationProgress$)
      expect(value).toEqual(progress)
      service.tearDown()
    })

    it('null を設定すると operationProgress$ が null になる', async () => {
      const service = new AdvancedOperationsDefaultService()
      service.setUp()
      service.setOperationProgress({
        operationType: 'rebase',
        status: 'completed',
        message: 'Done',
      })
      service.setOperationProgress(null)
      const value = await firstValueFrom(service.operationProgress$)
      expect(value).toBeNull()
      service.tearDown()
    })
  })

  describe('setCurrentOperation', () => {
    it('currentOperation$ が更新される', async () => {
      const service = new AdvancedOperationsDefaultService()
      service.setUp()
      service.setCurrentOperation('merge')
      const value = await firstValueFrom(service.currentOperation$)
      expect(value).toBe('merge')
      service.tearDown()
    })

    it('null を設定すると currentOperation$ が null になる', async () => {
      const service = new AdvancedOperationsDefaultService()
      service.setUp()
      service.setCurrentOperation('rebase')
      service.setCurrentOperation(null)
      const value = await firstValueFrom(service.currentOperation$)
      expect(value).toBeNull()
      service.tearDown()
    })
  })

  describe('tearDown', () => {
    it('tearDown 後に全ての BehaviorSubject が complete する', async () => {
      const service = new AdvancedOperationsDefaultService()
      service.setUp()

      const completions: string[] = []
      service.loading$.subscribe({ complete: () => completions.push('loading$') })
      service.lastError$.subscribe({ complete: () => completions.push('lastError$') })
      service.operationProgress$.subscribe({
        complete: () => completions.push('operationProgress$'),
      })
      service.currentOperation$.subscribe({
        complete: () => completions.push('currentOperation$'),
      })

      service.tearDown()

      expect(completions).toContain('loading$')
      expect(completions).toContain('lastError$')
      expect(completions).toContain('operationProgress$')
      expect(completions).toContain('currentOperation$')
    })
  })
})
