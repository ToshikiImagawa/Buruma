import type { ConflictResolveResult } from '@domain'
import type { ClaudeService, ConflictResolvingProgress } from '../../application/services/claude-service-interface'
import type { ResolveConflictRendererUseCase } from '../../di-tokens'
import { BehaviorSubject, firstValueFrom } from 'rxjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ClaudeConflictDefaultViewModel } from '../claude-conflict-viewmodel'

function createMockUseCase(): ResolveConflictRendererUseCase {
  return { invoke: vi.fn() }
}

function createMockService(): ClaudeService & {
  _isResolvingConflict$: BehaviorSubject<boolean>
  _conflictResult$: BehaviorSubject<ConflictResolveResult | null>
  _resolvingProgress$: BehaviorSubject<ConflictResolvingProgress | null>
} {
  const _isResolvingConflict$ = new BehaviorSubject<boolean>(false)
  const _conflictResult$ = new BehaviorSubject<ConflictResolveResult | null>(null)
  const _resolvingProgress$ = new BehaviorSubject<ConflictResolvingProgress | null>(null)

  return {
    currentSession$: new BehaviorSubject(null),
    outputs$: new BehaviorSubject([]),
    status$: new BehaviorSubject('idle' as const),
    authStatus$: new BehaviorSubject(null),
    isAuthChecking$: new BehaviorSubject(false),
    isLoggingIn$: new BehaviorSubject(false),
    reviewComments$: new BehaviorSubject([]),
    reviewSummary$: new BehaviorSubject(''),
    isReviewing$: new BehaviorSubject(false),
    explanation$: new BehaviorSubject(''),
    isExplaining$: new BehaviorSubject(false),
    isResolvingConflict$: _isResolvingConflict$.asObservable(),
    conflictResult$: _conflictResult$,
    resolvingProgress$: _resolvingProgress$.asObservable(),
    _isResolvingConflict$,
    _conflictResult$,
    _resolvingProgress$,
    setUp: vi.fn(),
    tearDown: vi.fn(),
    updateSession: vi.fn(),
    appendOutput: vi.fn(),
    clearOutputs: vi.fn(),
    setAuthStatus: vi.fn(),
    setAuthChecking: vi.fn(),
    setLoggingIn: vi.fn(),
    setReviewResult: vi.fn(),
    setReviewing: vi.fn(),
    setExplainResult: vi.fn(),
    setExplaining: vi.fn(),
    setResolvingConflict: vi.fn().mockImplementation((v: boolean) => _isResolvingConflict$.next(v)),
    setConflictResult: vi.fn().mockImplementation((v: ConflictResolveResult | null) => _conflictResult$.next(v)),
    setResolvingProgress: vi
      .fn()
      .mockImplementation((v: ConflictResolvingProgress | null) => _resolvingProgress$.next(v)),
  }
}

const threeWayContent = {
  base: 'base',
  ours: 'ours',
  theirs: 'theirs',
  merged: '',
}

describe('ClaudeConflictDefaultViewModel', () => {
  let useCase: ReturnType<typeof createMockUseCase>
  let service: ReturnType<typeof createMockService>
  let vm: ClaudeConflictDefaultViewModel

  beforeEach(() => {
    vi.clearAllMocks()
    useCase = createMockUseCase()
    service = createMockService()
    vm = new ClaudeConflictDefaultViewModel(useCase, service)
  })

  describe('resolveConflict', () => {
    it('isResolvingConflict を true に設定し、UseCase を呼び出す', () => {
      vm.resolveConflict('/repo', 'file.ts', threeWayContent)

      expect(service.setResolvingConflict).toHaveBeenCalledWith(true)
      expect(service.setResolvingProgress).toHaveBeenCalledWith(null)
      expect(service.setConflictResult).toHaveBeenCalledWith(null)
      expect(useCase.invoke).toHaveBeenCalledWith({
        worktreePath: '/repo',
        filePath: 'file.ts',
        threeWayContent,
      })
    })

    it('結果イベントを受信したら isResolvingConflict を false に設定する', async () => {
      vm.resolveConflict('/repo', 'file.ts', threeWayContent)

      // イベント結果をシミュレート
      const resolvedResult: ConflictResolveResult = {
        worktreePath: '/repo',
        filePath: 'file.ts',
        status: 'resolved',
        mergedContent: 'merged content',
      }
      service._conflictResult$.next(resolvedResult)

      // setResolvingConflict(false) が呼ばれたことを確認
      expect(service.setResolvingConflict).toHaveBeenCalledWith(false)
    })
  })

  describe('resolveAll', () => {
    const files = [
      { filePath: 'a.ts', threeWayContent },
      { filePath: 'b.ts', threeWayContent },
      { filePath: 'c.ts', threeWayContent },
    ]

    it('初期進捗を設定し、最大3並列で UseCase を呼び出す', () => {
      vm.resolveAll('/repo', files)

      expect(service.setResolvingConflict).toHaveBeenCalledWith(true)
      expect(service.setResolvingProgress).toHaveBeenCalledWith({ total: 3, completed: 0, failed: 0 })
      expect(useCase.invoke).toHaveBeenCalledTimes(3)
    })

    it('空のファイルリストの場合は何もしない', () => {
      vm.resolveAll('/repo', [])

      expect(service.setResolvingConflict).not.toHaveBeenCalled()
      expect(useCase.invoke).not.toHaveBeenCalled()
    })

    it('結果イベントごとに進捗を更新する', () => {
      vm.resolveAll('/repo', files)

      // 1件目の解決成功
      service._conflictResult$.next({
        worktreePath: '/repo',
        filePath: 'a.ts',
        status: 'resolved',
        mergedContent: 'content',
      })
      expect(service.setResolvingProgress).toHaveBeenCalledWith({ total: 3, completed: 1, failed: 0 })

      // 2件目の解決失敗
      service._conflictResult$.next({
        worktreePath: '/repo',
        filePath: 'b.ts',
        status: 'failed',
        error: 'AI error',
      })
      expect(service.setResolvingProgress).toHaveBeenCalledWith({ total: 3, completed: 1, failed: 1 })

      // 3件目の解決成功
      service._conflictResult$.next({
        worktreePath: '/repo',
        filePath: 'c.ts',
        status: 'resolved',
        mergedContent: 'content',
      })
      expect(service.setResolvingProgress).toHaveBeenCalledWith({ total: 3, completed: 2, failed: 1 })

      // 全件完了で isResolvingConflict を false に設定
      expect(service.setResolvingConflict).toHaveBeenCalledWith(false)
    })

    it('3並列制限: 4ファイル以上の場合、最初に3件を起動し、1件完了後に次を起動する', () => {
      const fourFiles = [
        { filePath: 'a.ts', threeWayContent },
        { filePath: 'b.ts', threeWayContent },
        { filePath: 'c.ts', threeWayContent },
        { filePath: 'd.ts', threeWayContent },
      ]

      vm.resolveAll('/repo', fourFiles)

      // 最初に3件のみ起動
      expect(useCase.invoke).toHaveBeenCalledTimes(3)

      // 1件目完了
      service._conflictResult$.next({
        worktreePath: '/repo',
        filePath: 'a.ts',
        status: 'resolved',
        mergedContent: 'content',
      })

      // 4件目が起動される
      expect(useCase.invoke).toHaveBeenCalledTimes(4)
    })
  })

  describe('Observable 公開', () => {
    it('isResolvingConflict$ は Service の状態を反映する', async () => {
      const value = await firstValueFrom(vm.isResolvingConflict$)
      expect(value).toBe(false)
    })

    it('conflictResult$ は Service の状態を反映する', async () => {
      const value = await firstValueFrom(vm.conflictResult$)
      expect(value).toBeNull()
    })

    it('resolvingProgress$ は Service の状態を反映する', async () => {
      const value = await firstValueFrom(vm.resolvingProgress$)
      expect(value).toBeNull()
    })
  })
})
