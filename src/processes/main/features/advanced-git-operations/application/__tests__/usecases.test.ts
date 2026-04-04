import type {
  CherryPickResult,
  ConflictFile,
  MergeResult,
  MergeStatus,
  RebaseResult,
  RebaseStep,
  StashEntry,
  TagInfo,
  ThreeWayContent,
} from '@domain'
import type { GitAdvancedRepository } from '../repositories/git-advanced-repository'
import { describe, expect, it, vi } from 'vitest'
import { CherryPickAbortUseCase } from '../usecases/cherry-pick-abort-usecase'
import { CherryPickUseCase } from '../usecases/cherry-pick-usecase'
import { ConflictFileContentUseCase } from '../usecases/conflict-file-content-usecase'
import { ConflictListUseCase } from '../usecases/conflict-list-usecase'
import { ConflictMarkResolvedUseCase } from '../usecases/conflict-mark-resolved-usecase'
import { ConflictResolveAllUseCase } from '../usecases/conflict-resolve-all-usecase'
import { ConflictResolveUseCase } from '../usecases/conflict-resolve-usecase'
import { GetRebaseCommitsUseCase } from '../usecases/get-rebase-commits-usecase'
import { MergeAbortUseCase } from '../usecases/merge-abort-usecase'
import { MergeStatusUseCase } from '../usecases/merge-status-usecase'
import { MergeUseCase } from '../usecases/merge-usecase'
import { RebaseAbortUseCase } from '../usecases/rebase-abort-usecase'
import { RebaseContinueUseCase } from '../usecases/rebase-continue-usecase'
import { RebaseInteractiveUseCase } from '../usecases/rebase-interactive-usecase'
import { RebaseUseCase } from '../usecases/rebase-usecase'
import { StashApplyUseCase } from '../usecases/stash-apply-usecase'
import { StashClearUseCase } from '../usecases/stash-clear-usecase'
import { StashDropUseCase } from '../usecases/stash-drop-usecase'
import { StashListUseCase } from '../usecases/stash-list-usecase'
import { StashPopUseCase } from '../usecases/stash-pop-usecase'
import { StashSaveUseCase } from '../usecases/stash-save-usecase'
import { TagCreateUseCase } from '../usecases/tag-create-usecase'
import { TagDeleteUseCase } from '../usecases/tag-delete-usecase'
import { TagListUseCase } from '../usecases/tag-list-usecase'

function createMockRepository(overrides: Partial<GitAdvancedRepository> = {}): GitAdvancedRepository {
  return {
    merge: vi.fn().mockResolvedValue({ status: 'success', mergeCommit: 'abc123' } satisfies MergeResult),
    mergeAbort: vi.fn().mockResolvedValue(undefined),
    mergeStatus: vi.fn().mockResolvedValue({ isMerging: false } satisfies MergeStatus),
    rebase: vi.fn().mockResolvedValue({ status: 'success' } satisfies RebaseResult),
    rebaseInteractive: vi.fn().mockResolvedValue({ status: 'success' } satisfies RebaseResult),
    rebaseAbort: vi.fn().mockResolvedValue(undefined),
    rebaseContinue: vi.fn().mockResolvedValue({ status: 'success' } satisfies RebaseResult),
    getRebaseCommits: vi
      .fn()
      .mockResolvedValue([{ hash: 'abc', message: 'test', action: 'pick', order: 0 } satisfies RebaseStep]),
    stashSave: vi.fn().mockResolvedValue(undefined),
    stashList: vi.fn().mockResolvedValue([
      {
        index: 0,
        message: 'test',
        date: '2026-04-04',
        branch: 'main',
        hash: 'abc',
      } satisfies StashEntry,
    ]),
    stashPop: vi.fn().mockResolvedValue(undefined),
    stashApply: vi.fn().mockResolvedValue(undefined),
    stashDrop: vi.fn().mockResolvedValue(undefined),
    stashClear: vi.fn().mockResolvedValue(undefined),
    cherryPick: vi.fn().mockResolvedValue({
      status: 'success',
      appliedCommits: ['abc'],
    } satisfies CherryPickResult),
    cherryPickAbort: vi.fn().mockResolvedValue(undefined),
    conflictList: vi.fn().mockResolvedValue([
      {
        filePath: 'file.ts',
        status: 'conflicted',
        conflictType: 'content',
      } satisfies ConflictFile,
    ]),
    conflictFileContent: vi.fn().mockResolvedValue({
      base: 'b',
      ours: 'o',
      theirs: 't',
      merged: 'm',
    } satisfies ThreeWayContent),
    conflictResolve: vi.fn().mockResolvedValue(undefined),
    conflictResolveAll: vi.fn().mockResolvedValue(undefined),
    conflictMarkResolved: vi.fn().mockResolvedValue(undefined),
    tagList: vi.fn().mockResolvedValue([
      {
        name: 'v1.0',
        hash: 'abc',
        date: '2026-04-04',
        type: 'lightweight',
      } satisfies TagInfo,
    ]),
    tagCreate: vi.fn().mockResolvedValue(undefined),
    tagDelete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe('マージ', () => {
  describe('MergeUseCase', () => {
    it('repository.merge を呼び出して結果を返す', async () => {
      const expected: MergeResult = { status: 'success', mergeCommit: 'abc123' }
      const repo = createMockRepository({ merge: vi.fn().mockResolvedValue(expected) })
      const useCase = new MergeUseCase(repo)
      const result = await useCase.invoke({
        worktreePath: '/path',
        branch: 'feature/test',
      })
      expect(result).toEqual(expected)
      expect(repo.merge).toHaveBeenCalledWith({
        worktreePath: '/path',
        branch: 'feature/test',
      })
    })
  })

  describe('MergeAbortUseCase', () => {
    it('repository.mergeAbort を呼び出す', () => {
      const repo = createMockRepository()
      const useCase = new MergeAbortUseCase(repo)
      useCase.invoke('/path')
      expect(repo.mergeAbort).toHaveBeenCalledWith('/path')
    })
  })

  describe('MergeStatusUseCase', () => {
    it('repository.mergeStatus を呼び出して結果を返す', async () => {
      const expected: MergeStatus = { isMerging: false }
      const repo = createMockRepository({ mergeStatus: vi.fn().mockResolvedValue(expected) })
      const useCase = new MergeStatusUseCase(repo)
      const result = await useCase.invoke('/path')
      expect(result).toEqual(expected)
      expect(repo.mergeStatus).toHaveBeenCalledWith('/path')
    })
  })
})

describe('コンフリクト解決', () => {
  describe('ConflictListUseCase', () => {
    it('repository.conflictList を呼び出して結果を返す', async () => {
      const expected: ConflictFile[] = [{ filePath: 'file.ts', status: 'conflicted', conflictType: 'content' }]
      const repo = createMockRepository({ conflictList: vi.fn().mockResolvedValue(expected) })
      const useCase = new ConflictListUseCase(repo)
      const result = await useCase.invoke('/path')
      expect(result).toEqual(expected)
      expect(repo.conflictList).toHaveBeenCalledWith('/path')
    })
  })

  describe('ConflictFileContentUseCase', () => {
    it('repository.conflictFileContent を呼び出して結果を返す', async () => {
      const expected: ThreeWayContent = { base: 'b', ours: 'o', theirs: 't', merged: 'm' }
      const repo = createMockRepository({
        conflictFileContent: vi.fn().mockResolvedValue(expected),
      })
      const useCase = new ConflictFileContentUseCase(repo)
      const result = await useCase.invoke({ worktreePath: '/path', filePath: 'file.ts' })
      expect(result).toEqual(expected)
      expect(repo.conflictFileContent).toHaveBeenCalledWith('/path', 'file.ts')
    })
  })

  describe('ConflictResolveUseCase', () => {
    it('repository.conflictResolve を呼び出す', () => {
      const repo = createMockRepository()
      const useCase = new ConflictResolveUseCase(repo)
      useCase.invoke({ worktreePath: '/path', filePath: 'file.ts', resolution: 'ours' })
      expect(repo.conflictResolve).toHaveBeenCalledWith({
        worktreePath: '/path',
        filePath: 'file.ts',
        resolution: 'ours',
      })
    })
  })

  describe('ConflictResolveAllUseCase', () => {
    it('repository.conflictResolveAll を呼び出す', () => {
      const repo = createMockRepository()
      const useCase = new ConflictResolveAllUseCase(repo)
      useCase.invoke({ worktreePath: '/path', resolution: 'ours' })
      expect(repo.conflictResolveAll).toHaveBeenCalledWith({
        worktreePath: '/path',
        resolution: 'ours',
      })
    })
  })

  describe('ConflictMarkResolvedUseCase', () => {
    it('repository.conflictMarkResolved を呼び出す', () => {
      const repo = createMockRepository()
      const useCase = new ConflictMarkResolvedUseCase(repo)
      useCase.invoke({ worktreePath: '/path', filePath: 'file.ts' })
      expect(repo.conflictMarkResolved).toHaveBeenCalledWith('/path', 'file.ts')
    })
  })
})

describe('リベース', () => {
  describe('RebaseUseCase', () => {
    it('repository.rebase を呼び出して結果を返す', async () => {
      const expected: RebaseResult = { status: 'success' }
      const repo = createMockRepository({ rebase: vi.fn().mockResolvedValue(expected) })
      const useCase = new RebaseUseCase(repo)
      const result = await useCase.invoke({ worktreePath: '/path', onto: 'main' })
      expect(result).toEqual(expected)
      expect(repo.rebase).toHaveBeenCalledWith({ worktreePath: '/path', onto: 'main' })
    })
  })

  describe('RebaseInteractiveUseCase', () => {
    it('repository.rebaseInteractive を呼び出して結果を返す', async () => {
      const expected: RebaseResult = { status: 'success' }
      const repo = createMockRepository({
        rebaseInteractive: vi.fn().mockResolvedValue(expected),
      })
      const useCase = new RebaseInteractiveUseCase(repo)
      const result = await useCase.invoke({
        worktreePath: '/path',
        onto: 'main',
        steps: [{ hash: 'abc', message: 'test', action: 'pick', order: 0 }],
      })
      expect(result).toEqual(expected)
      expect(repo.rebaseInteractive).toHaveBeenCalledWith({
        worktreePath: '/path',
        onto: 'main',
        steps: [{ hash: 'abc', message: 'test', action: 'pick', order: 0 }],
      })
    })
  })

  describe('RebaseAbortUseCase', () => {
    it('repository.rebaseAbort を呼び出す', () => {
      const repo = createMockRepository()
      const useCase = new RebaseAbortUseCase(repo)
      useCase.invoke('/path')
      expect(repo.rebaseAbort).toHaveBeenCalledWith('/path')
    })
  })

  describe('RebaseContinueUseCase', () => {
    it('repository.rebaseContinue を呼び出して結果を返す', async () => {
      const expected: RebaseResult = { status: 'success' }
      const repo = createMockRepository({
        rebaseContinue: vi.fn().mockResolvedValue(expected),
      })
      const useCase = new RebaseContinueUseCase(repo)
      const result = await useCase.invoke('/path')
      expect(result).toEqual(expected)
      expect(repo.rebaseContinue).toHaveBeenCalledWith('/path')
    })
  })

  describe('GetRebaseCommitsUseCase', () => {
    it('repository.getRebaseCommits を呼び出して結果を返す', async () => {
      const expected: RebaseStep[] = [{ hash: 'abc', message: 'test', action: 'pick', order: 0 }]
      const repo = createMockRepository({
        getRebaseCommits: vi.fn().mockResolvedValue(expected),
      })
      const useCase = new GetRebaseCommitsUseCase(repo)
      const result = await useCase.invoke({ worktreePath: '/path', onto: 'main' })
      expect(result).toEqual(expected)
      expect(repo.getRebaseCommits).toHaveBeenCalledWith('/path', 'main')
    })
  })
})

describe('スタッシュ', () => {
  describe('StashSaveUseCase', () => {
    it('repository.stashSave を呼び出す', () => {
      const repo = createMockRepository()
      const useCase = new StashSaveUseCase(repo)
      useCase.invoke({ worktreePath: '/path', message: 'WIP' })
      expect(repo.stashSave).toHaveBeenCalledWith({ worktreePath: '/path', message: 'WIP' })
    })
  })

  describe('StashListUseCase', () => {
    it('repository.stashList を呼び出して結果を返す', async () => {
      const expected: StashEntry[] = [{ index: 0, message: 'test', date: '2026-04-04', branch: 'main', hash: 'abc' }]
      const repo = createMockRepository({ stashList: vi.fn().mockResolvedValue(expected) })
      const useCase = new StashListUseCase(repo)
      const result = await useCase.invoke('/path')
      expect(result).toEqual(expected)
      expect(repo.stashList).toHaveBeenCalledWith('/path')
    })
  })

  describe('StashPopUseCase', () => {
    it('repository.stashPop を呼び出す', () => {
      const repo = createMockRepository()
      const useCase = new StashPopUseCase(repo)
      useCase.invoke({ worktreePath: '/path', index: 0 })
      expect(repo.stashPop).toHaveBeenCalledWith('/path', 0)
    })
  })

  describe('StashApplyUseCase', () => {
    it('repository.stashApply を呼び出す', () => {
      const repo = createMockRepository()
      const useCase = new StashApplyUseCase(repo)
      useCase.invoke({ worktreePath: '/path', index: 1 })
      expect(repo.stashApply).toHaveBeenCalledWith('/path', 1)
    })
  })

  describe('StashDropUseCase', () => {
    it('repository.stashDrop を呼び出す', () => {
      const repo = createMockRepository()
      const useCase = new StashDropUseCase(repo)
      useCase.invoke({ worktreePath: '/path', index: 2 })
      expect(repo.stashDrop).toHaveBeenCalledWith('/path', 2)
    })
  })

  describe('StashClearUseCase', () => {
    it('repository.stashClear を呼び出す', () => {
      const repo = createMockRepository()
      const useCase = new StashClearUseCase(repo)
      useCase.invoke('/path')
      expect(repo.stashClear).toHaveBeenCalledWith('/path')
    })
  })
})

describe('チェリーピック', () => {
  describe('CherryPickUseCase', () => {
    it('repository.cherryPick を呼び出して結果を返す', async () => {
      const expected: CherryPickResult = { status: 'success', appliedCommits: ['abc'] }
      const repo = createMockRepository({ cherryPick: vi.fn().mockResolvedValue(expected) })
      const useCase = new CherryPickUseCase(repo)
      const result = await useCase.invoke({ worktreePath: '/path', commits: ['abc'] })
      expect(result).toEqual(expected)
      expect(repo.cherryPick).toHaveBeenCalledWith({ worktreePath: '/path', commits: ['abc'] })
    })
  })

  describe('CherryPickAbortUseCase', () => {
    it('repository.cherryPickAbort を呼び出す', () => {
      const repo = createMockRepository()
      const useCase = new CherryPickAbortUseCase(repo)
      useCase.invoke('/path')
      expect(repo.cherryPickAbort).toHaveBeenCalledWith('/path')
    })
  })
})

describe('タグ', () => {
  describe('TagListUseCase', () => {
    it('repository.tagList を呼び出して結果を返す', async () => {
      const expected: TagInfo[] = [{ name: 'v1.0', hash: 'abc', date: '2026-04-04', type: 'lightweight' }]
      const repo = createMockRepository({ tagList: vi.fn().mockResolvedValue(expected) })
      const useCase = new TagListUseCase(repo)
      const result = await useCase.invoke('/path')
      expect(result).toEqual(expected)
      expect(repo.tagList).toHaveBeenCalledWith('/path')
    })
  })

  describe('TagCreateUseCase', () => {
    it('repository.tagCreate を呼び出す', () => {
      const repo = createMockRepository()
      const useCase = new TagCreateUseCase(repo)
      useCase.invoke({ worktreePath: '/path', name: 'v1.0' })
      expect(repo.tagCreate).toHaveBeenCalledWith({ worktreePath: '/path', name: 'v1.0' })
    })
  })

  describe('TagDeleteUseCase', () => {
    it('repository.tagDelete を呼び出す', () => {
      const repo = createMockRepository()
      const useCase = new TagDeleteUseCase(repo)
      useCase.invoke({ worktreePath: '/path', tagName: 'v1.0' })
      expect(repo.tagDelete).toHaveBeenCalledWith('/path', 'v1.0')
    })
  })
})
