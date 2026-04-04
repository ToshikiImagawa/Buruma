import type {
  MergeOptions,
  MergeResult,
  MergeStatus,
  RebaseOptions,
  InteractiveRebaseOptions,
  RebaseResult,
  RebaseStep,
  StashSaveOptions,
  StashEntry,
  CherryPickOptions,
  CherryPickResult,
  ConflictFile,
  ThreeWayContent,
  ConflictResolveOptions,
  ConflictResolveAllOptions,
  TagInfo,
  TagCreateOptions,
} from '@domain'
import type { IPCError } from '@lib/ipc'
import type { AdvancedOperationsRepository } from '../../application/repositories/advanced-operations-repository'

export class AdvancedOperationsDefaultRepository implements AdvancedOperationsRepository {
  async merge(options: MergeOptions): Promise<MergeResult> {
    const result = await window.electronAPI.git.merge(options)
    if (result.success === false) throw new AdvancedOperationsError(result.error)
    return result.data
  }

  async mergeAbort(worktreePath: string): Promise<void> {
    const result = await window.electronAPI.git.mergeAbort({ worktreePath })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
  }

  async mergeStatus(worktreePath: string): Promise<MergeStatus> {
    const result = await window.electronAPI.git.mergeStatus({ worktreePath })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
    return result.data
  }

  async rebase(options: RebaseOptions): Promise<RebaseResult> {
    const result = await window.electronAPI.git.rebase(options)
    if (result.success === false) throw new AdvancedOperationsError(result.error)
    return result.data
  }

  async rebaseInteractive(options: InteractiveRebaseOptions): Promise<RebaseResult> {
    const result = await window.electronAPI.git.rebaseInteractive(options)
    if (result.success === false) throw new AdvancedOperationsError(result.error)
    return result.data
  }

  async rebaseAbort(worktreePath: string): Promise<void> {
    const result = await window.electronAPI.git.rebaseAbort({ worktreePath })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
  }

  async rebaseContinue(worktreePath: string): Promise<RebaseResult> {
    const result = await window.electronAPI.git.rebaseContinue({ worktreePath })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
    return result.data
  }

  async getRebaseCommits(worktreePath: string, onto: string): Promise<RebaseStep[]> {
    const result = await window.electronAPI.git.rebaseGetCommits({ worktreePath, onto })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
    return result.data
  }

  async stashSave(options: StashSaveOptions): Promise<void> {
    const result = await window.electronAPI.git.stashSave(options)
    if (result.success === false) throw new AdvancedOperationsError(result.error)
  }

  async stashList(worktreePath: string): Promise<StashEntry[]> {
    const result = await window.electronAPI.git.stashList({ worktreePath })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
    return result.data
  }

  async stashPop(worktreePath: string, index: number): Promise<void> {
    const result = await window.electronAPI.git.stashPop({ worktreePath, index })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
  }

  async stashApply(worktreePath: string, index: number): Promise<void> {
    const result = await window.electronAPI.git.stashApply({ worktreePath, index })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
  }

  async stashDrop(worktreePath: string, index: number): Promise<void> {
    const result = await window.electronAPI.git.stashDrop({ worktreePath, index })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
  }

  async stashClear(worktreePath: string): Promise<void> {
    const result = await window.electronAPI.git.stashClear({ worktreePath })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
  }

  async cherryPick(options: CherryPickOptions): Promise<CherryPickResult> {
    const result = await window.electronAPI.git.cherryPick(options)
    if (result.success === false) throw new AdvancedOperationsError(result.error)
    return result.data
  }

  async cherryPickAbort(worktreePath: string): Promise<void> {
    const result = await window.electronAPI.git.cherryPickAbort({ worktreePath })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
  }

  async conflictList(worktreePath: string): Promise<ConflictFile[]> {
    const result = await window.electronAPI.git.conflictList({ worktreePath })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
    return result.data
  }

  async conflictFileContent(worktreePath: string, filePath: string): Promise<ThreeWayContent> {
    const result = await window.electronAPI.git.conflictFileContent({ worktreePath, filePath })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
    return result.data
  }

  async conflictResolve(options: ConflictResolveOptions): Promise<void> {
    const result = await window.electronAPI.git.conflictResolve(options)
    if (result.success === false) throw new AdvancedOperationsError(result.error)
  }

  async conflictResolveAll(options: ConflictResolveAllOptions): Promise<void> {
    const result = await window.electronAPI.git.conflictResolveAll(options)
    if (result.success === false) throw new AdvancedOperationsError(result.error)
  }

  async conflictMarkResolved(worktreePath: string, filePath: string): Promise<void> {
    const result = await window.electronAPI.git.conflictMarkResolved({ worktreePath, filePath })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
  }

  async tagList(worktreePath: string): Promise<TagInfo[]> {
    const result = await window.electronAPI.git.tagList({ worktreePath })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
    return result.data
  }

  async tagCreate(options: TagCreateOptions): Promise<void> {
    const result = await window.electronAPI.git.tagCreate(options)
    if (result.success === false) throw new AdvancedOperationsError(result.error)
  }

  async tagDelete(worktreePath: string, tagName: string): Promise<void> {
    const result = await window.electronAPI.git.tagDelete({ worktreePath, tagName })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
  }
}

export class AdvancedOperationsError extends Error {
  readonly code: string

  constructor(public readonly error: IPCError) {
    super(error.message)
    this.name = 'AdvancedOperationsError'
    this.code = error.code
  }
}
