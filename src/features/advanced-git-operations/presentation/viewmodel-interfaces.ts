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
import type { Observable } from 'rxjs'

export interface MergeViewModel {
  readonly loading$: Observable<boolean>
  readonly mergeResult$: Observable<MergeResult | null>
  readonly mergeStatus$: Observable<MergeStatus | null>
  merge(options: MergeOptions): void
  mergeAbort(worktreePath: string): void
  getMergeStatus(worktreePath: string): void
}

export interface RebaseViewModel {
  readonly loading$: Observable<boolean>
  readonly rebaseResult$: Observable<RebaseResult | null>
  readonly rebaseCommits$: Observable<RebaseStep[]>
  rebase(options: RebaseOptions): void
  rebaseInteractive(options: InteractiveRebaseOptions): void
  rebaseAbort(worktreePath: string): void
  rebaseContinue(worktreePath: string): void
  getRebaseCommits(worktreePath: string, onto: string): void
}

export interface StashViewModel {
  readonly loading$: Observable<boolean>
  readonly stashes$: Observable<StashEntry[]>
  stashSave(options: StashSaveOptions): void
  stashList(worktreePath: string): void
  stashPop(worktreePath: string, index: number): void
  stashApply(worktreePath: string, index: number): void
  stashDrop(worktreePath: string, index: number): void
  stashClear(worktreePath: string): void
}

export interface CherryPickViewModel {
  readonly loading$: Observable<boolean>
  readonly cherryPickResult$: Observable<CherryPickResult | null>
  cherryPick(options: CherryPickOptions): void
  cherryPickAbort(worktreePath: string): void
}

export interface ConflictViewModel {
  readonly loading$: Observable<boolean>
  readonly conflictFiles$: Observable<ConflictFile[]>
  readonly threeWayContent$: Observable<ThreeWayContent | null>
  conflictList(worktreePath: string): void
  conflictFileContent(worktreePath: string, filePath: string): void
  conflictResolve(options: ConflictResolveOptions): void
  conflictResolveAll(options: ConflictResolveAllOptions): void
  conflictMarkResolved(worktreePath: string, filePath: string): void
}

export interface TagViewModel {
  readonly loading$: Observable<boolean>
  readonly tags$: Observable<TagInfo[]>
  tagList(worktreePath: string): void
  tagCreate(options: TagCreateOptions): void
  tagDelete(worktreePath: string, tagName: string): void
}
