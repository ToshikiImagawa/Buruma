import type {
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

export interface AdvancedOperationsRepository {
  merge(options: MergeOptions): Promise<MergeResult>
  mergeAbort(worktreePath: string): Promise<void>
  mergeStatus(worktreePath: string): Promise<MergeStatus>
  rebase(options: RebaseOptions): Promise<RebaseResult>
  rebaseInteractive(options: InteractiveRebaseOptions): Promise<RebaseResult>
  rebaseAbort(worktreePath: string): Promise<void>
  rebaseContinue(worktreePath: string): Promise<RebaseResult>
  getRebaseCommits(worktreePath: string, onto: string): Promise<RebaseStep[]>
  stashSave(options: StashSaveOptions): Promise<void>
  stashList(worktreePath: string): Promise<StashEntry[]>
  stashPop(worktreePath: string, index: number): Promise<void>
  stashApply(worktreePath: string, index: number): Promise<void>
  stashDrop(worktreePath: string, index: number): Promise<void>
  stashClear(worktreePath: string): Promise<void>
  cherryPick(options: CherryPickOptions): Promise<CherryPickResult>
  cherryPickAbort(worktreePath: string): Promise<void>
  conflictList(worktreePath: string): Promise<ConflictFile[]>
  conflictFileContent(worktreePath: string, filePath: string): Promise<ThreeWayContent>
  conflictResolve(options: ConflictResolveOptions): Promise<void>
  conflictResolveAll(options: ConflictResolveAllOptions): Promise<void>
  conflictMarkResolved(worktreePath: string, filePath: string): Promise<void>
  tagList(worktreePath: string): Promise<TagInfo[]>
  tagCreate(options: TagCreateOptions): Promise<void>
  tagDelete(worktreePath: string, tagName: string): Promise<void>
}
