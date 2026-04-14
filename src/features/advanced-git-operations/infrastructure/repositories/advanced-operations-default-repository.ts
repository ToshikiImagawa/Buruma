import type {
  BranchList,
  CherryPickOptions,
  CherryPickResult,
  ConflictFile,
  ConflictResolveAllOptions,
  ConflictResolveOptions,
  InteractiveRebaseOptions,
  MergeOptions,
  MergeResult,
  MergeStatus,
  RebaseOptions,
  RebaseResult,
  RebaseStep,
  StashEntry,
  StashSaveOptions,
  TagCreateOptions,
  TagInfo,
  ThreeWayContent,
} from '@domain'
import type { IPCError } from '@lib/ipc'
import type { AdvancedOperationsRepository } from '../../application/repositories/advanced-operations-repository'
import { invokeCommand } from '@lib/invoke/commands'

export class AdvancedOperationsDefaultRepository implements AdvancedOperationsRepository {
  async merge(options: MergeOptions): Promise<MergeResult> {
    const result = await invokeCommand('git_merge', { args: options })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
    return result.data
  }

  async mergeAbort(worktreePath: string): Promise<void> {
    const result = await invokeCommand('git_merge_abort', { args: { worktreePath } })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
  }

  async mergeStatus(worktreePath: string): Promise<MergeStatus> {
    const result = await invokeCommand('git_merge_status', { args: { worktreePath } })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
    return result.data
  }

  async rebase(options: RebaseOptions): Promise<RebaseResult> {
    const result = await invokeCommand('git_rebase', { args: options })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
    return result.data
  }

  async rebaseInteractive(options: InteractiveRebaseOptions): Promise<RebaseResult> {
    const result = await invokeCommand('git_rebase_interactive', { args: options })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
    return result.data
  }

  async rebaseAbort(worktreePath: string): Promise<void> {
    const result = await invokeCommand('git_rebase_abort', { args: { worktreePath } })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
  }

  async rebaseContinue(worktreePath: string): Promise<RebaseResult> {
    const result = await invokeCommand('git_rebase_continue', { args: { worktreePath } })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
    return result.data
  }

  async getRebaseCommits(worktreePath: string, onto: string): Promise<RebaseStep[]> {
    const result = await invokeCommand('git_rebase_get_commits', { args: { worktreePath, onto } })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
    return result.data
  }

  async stashSave(options: StashSaveOptions): Promise<void> {
    const result = await invokeCommand('git_stash_save', { args: options })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
  }

  async stashList(worktreePath: string): Promise<StashEntry[]> {
    const result = await invokeCommand('git_stash_list', { args: { worktreePath } })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
    return result.data
  }

  async stashPop(worktreePath: string, index: number): Promise<void> {
    const result = await invokeCommand('git_stash_pop', { args: { worktreePath, index } })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
  }

  async stashApply(worktreePath: string, index: number): Promise<void> {
    const result = await invokeCommand('git_stash_apply', { args: { worktreePath, index } })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
  }

  async stashDrop(worktreePath: string, index: number): Promise<void> {
    const result = await invokeCommand('git_stash_drop', { args: { worktreePath, index } })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
  }

  async stashClear(worktreePath: string): Promise<void> {
    const result = await invokeCommand('git_stash_clear', { args: { worktreePath } })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
  }

  async cherryPick(options: CherryPickOptions): Promise<CherryPickResult> {
    const result = await invokeCommand('git_cherry_pick', { args: options })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
    return result.data
  }

  async cherryPickAbort(worktreePath: string): Promise<void> {
    const result = await invokeCommand('git_cherry_pick_abort', { args: { worktreePath } })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
  }

  async conflictList(worktreePath: string): Promise<ConflictFile[]> {
    const result = await invokeCommand('git_conflict_list', { args: { worktreePath } })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
    return result.data
  }

  async conflictFileContent(worktreePath: string, filePath: string): Promise<ThreeWayContent> {
    const result = await invokeCommand('git_conflict_file_content', {
      args: { worktreePath, filePath },
    })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
    return result.data
  }

  async conflictResolve(options: ConflictResolveOptions): Promise<void> {
    const result = await invokeCommand('git_conflict_resolve', { args: options })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
  }

  async conflictResolveAll(options: ConflictResolveAllOptions): Promise<void> {
    const result = await invokeCommand('git_conflict_resolve_all', { args: options })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
  }

  async conflictMarkResolved(worktreePath: string, filePath: string): Promise<void> {
    const result = await invokeCommand('git_conflict_mark_resolved', { args: { worktreePath, filePath } })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
  }

  async tagList(worktreePath: string): Promise<TagInfo[]> {
    const result = await invokeCommand('git_tag_list', { args: { worktreePath } })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
    return result.data
  }

  async tagCreate(options: TagCreateOptions): Promise<void> {
    const result = await invokeCommand('git_tag_create', { args: options })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
  }

  async tagDelete(worktreePath: string, tagName: string): Promise<void> {
    const result = await invokeCommand('git_tag_delete', { args: { worktreePath, tagName } })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
  }

  async getBranches(worktreePath: string): Promise<BranchList> {
    const result = await invokeCommand('git_branches', { args: { worktreePath } })
    if (result.success === false) throw new AdvancedOperationsError(result.error)
    return result.data
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
