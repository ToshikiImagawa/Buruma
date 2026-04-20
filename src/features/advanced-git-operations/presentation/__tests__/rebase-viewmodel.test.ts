import type { RebaseResult, RebaseStep } from '@domain'
import type {
  GetAdvancedOperationLoadingUseCase,
  GetRebaseCommitsRendererUseCase,
  GetTrackedBranchesRendererUseCase,
  RebaseAbortRendererUseCase,
  RebaseContinueRendererUseCase,
  RebaseInteractiveRendererUseCase,
  RebaseRendererUseCase,
} from '../../di-tokens'
import { BehaviorSubject, firstValueFrom } from 'rxjs'
import { describe, expect, it, vi } from 'vitest'
import { RebaseDefaultViewModel } from '../rebase-viewmodel'

function createMockDeps() {
  const loading$ = new BehaviorSubject(false)
  return {
    rebase: { invoke: vi.fn() } satisfies RebaseRendererUseCase,
    rebaseInteractive: { invoke: vi.fn() } satisfies RebaseInteractiveRendererUseCase,
    rebaseAbort: { invoke: vi.fn() } satisfies RebaseAbortRendererUseCase,
    rebaseContinue: { invoke: vi.fn() } satisfies RebaseContinueRendererUseCase,
    getRebaseCommits: { invoke: vi.fn() } satisfies GetRebaseCommitsRendererUseCase,
    getTrackedBranches: { invoke: vi.fn() } satisfies GetTrackedBranchesRendererUseCase,
    getOperationLoading: { store: loading$.asObservable() } satisfies GetAdvancedOperationLoadingUseCase,
  }
}

function createViewModel(deps = createMockDeps()) {
  return {
    vm: new RebaseDefaultViewModel(
      deps.rebase,
      deps.rebaseInteractive,
      deps.rebaseAbort,
      deps.rebaseContinue,
      deps.getRebaseCommits,
      deps.getTrackedBranches,
      deps.getOperationLoading,
    ),
    deps,
  }
}

describe('RebaseDefaultViewModel', () => {
  describe('初期状態', () => {
    it('rebaseResult$ が null', async () => {
      const { vm } = createViewModel()
      expect(await firstValueFrom(vm.rebaseResult$)).toBeNull()
    })

    it('rebaseCommits$ が空配列', async () => {
      const { vm } = createViewModel()
      expect(await firstValueFrom(vm.rebaseCommits$)).toEqual([])
    })

    it('branches$ が null', async () => {
      const { vm } = createViewModel()
      expect(await firstValueFrom(vm.branches$)).toBeNull()
    })
  })

  describe('clearState', () => {
    it('rebaseResult を null にリセットする', async () => {
      const deps = createMockDeps()
      const result: RebaseResult = { status: 'success' }
      deps.rebase.invoke.mockResolvedValue(result)
      const { vm } = createViewModel(deps)

      vm.rebase({ worktreePath: '/test', onto: 'main' })
      await vi.waitFor(async () => {
        expect(await firstValueFrom(vm.rebaseResult$)).toEqual(result)
      })

      vm.clearState()
      expect(await firstValueFrom(vm.rebaseResult$)).toBeNull()
    })

    it('rebaseCommits を空配列にリセットする', async () => {
      const deps = createMockDeps()
      const commits: RebaseStep[] = [{ hash: 'abc123', message: 'test', action: 'pick', order: 0 }]
      deps.getRebaseCommits.invoke.mockResolvedValue(commits)
      const { vm } = createViewModel(deps)

      vm.getRebaseCommits('/test', 'main')
      await vi.waitFor(async () => {
        expect(await firstValueFrom(vm.rebaseCommits$)).toEqual(commits)
      })

      vm.clearState()
      expect(await firstValueFrom(vm.rebaseCommits$)).toEqual([])
    })

    it('rebaseCommits が既に空の場合は再発行しない', async () => {
      const { vm } = createViewModel()
      const emissions: RebaseStep[][] = []
      const sub = vm.rebaseCommits$.subscribe((v) => emissions.push(v))

      vm.clearState()

      // 初期値の 1 回のみ（clearState で追加の next は発生しない）
      expect(emissions).toHaveLength(1)
      expect(emissions[0]).toEqual([])
      sub.unsubscribe()
    })
  })

  describe('rebaseInteractive', () => {
    it('成功時に rebaseResult$ を更新する', async () => {
      const deps = createMockDeps()
      const result: RebaseResult = { status: 'success' }
      deps.rebaseInteractive.invoke.mockResolvedValue(result)
      const { vm } = createViewModel(deps)

      vm.rebaseInteractive({ worktreePath: '/test', onto: 'main', steps: [] })
      await vi.waitFor(async () => {
        expect(await firstValueFrom(vm.rebaseResult$)).toEqual(result)
      })
    })

    it('upstream 付きで invoke を呼び出す', async () => {
      const deps = createMockDeps()
      deps.rebaseInteractive.invoke.mockResolvedValue({ status: 'success' })
      const { vm } = createViewModel(deps)

      const options = { worktreePath: '/test', onto: 'main', upstream: 'feature', steps: [] }
      vm.rebaseInteractive(options)

      expect(deps.rebaseInteractive.invoke).toHaveBeenCalledWith(options)
    })

    it('エラー時に rebaseResult$ を null にする', async () => {
      const deps = createMockDeps()
      deps.rebaseInteractive.invoke.mockRejectedValue(new Error('fail'))
      const { vm } = createViewModel(deps)

      vm.rebaseInteractive({ worktreePath: '/test', onto: 'main', steps: [] })
      await vi.waitFor(async () => {
        expect(await firstValueFrom(vm.rebaseResult$)).toBeNull()
      })
    })
  })

  describe('getRebaseCommits', () => {
    it('upstream 付きで invoke を呼び出す', () => {
      const deps = createMockDeps()
      deps.getRebaseCommits.invoke.mockResolvedValue([])
      const { vm } = createViewModel(deps)

      vm.getRebaseCommits('/test', 'main', 'feature')
      expect(deps.getRebaseCommits.invoke).toHaveBeenCalledWith({
        worktreePath: '/test',
        onto: 'main',
        upstream: 'feature',
      })
    })

    it('upstream なしで invoke を呼び出す', () => {
      const deps = createMockDeps()
      deps.getRebaseCommits.invoke.mockResolvedValue([])
      const { vm } = createViewModel(deps)

      vm.getRebaseCommits('/test', 'main')
      expect(deps.getRebaseCommits.invoke).toHaveBeenCalledWith({
        worktreePath: '/test',
        onto: 'main',
        upstream: undefined,
      })
    })
  })
})
