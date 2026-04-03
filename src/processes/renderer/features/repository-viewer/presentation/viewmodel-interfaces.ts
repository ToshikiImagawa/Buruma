import type {
  BranchList,
  CommitDetail,
  CommitSummary,
  DiffDisplayMode,
  FileDiff,
  FileTreeNode,
  GitStatus,
} from '@domain'
import type { Observable } from 'rxjs'

export interface StatusViewModel {
  readonly status$: Observable<GitStatus | null>
  readonly loading$: Observable<boolean>
  loadStatus(worktreePath: string): void
  selectFile(filePath: string, staged: boolean): void
}

export interface CommitLogViewModel {
  readonly commits$: Observable<CommitSummary[]>
  readonly hasMore$: Observable<boolean>
  readonly loading$: Observable<boolean>
  readonly selectedCommit$: Observable<CommitDetail | null>
  loadCommits(worktreePath: string): void
  loadMore(worktreePath: string): void
  selectCommit(worktreePath: string, hash: string): void
  setSearch(search: string): void
}

export interface DiffViewViewModel {
  readonly diffs$: Observable<FileDiff[]>
  readonly displayMode$: Observable<DiffDisplayMode>
  readonly loading$: Observable<boolean>
  loadDiff(worktreePath: string, filePath: string, staged: boolean): void
  loadCommitDiff(worktreePath: string, hash: string, filePath?: string): void
  setDisplayMode(mode: DiffDisplayMode): void
}

export interface BranchListViewModel {
  readonly branches$: Observable<BranchList | null>
  readonly loading$: Observable<boolean>
  readonly search$: Observable<string>
  loadBranches(worktreePath: string): void
  setSearch(search: string): void
}

export interface FileTreeViewModel {
  readonly tree$: Observable<FileTreeNode | null>
  readonly loading$: Observable<boolean>
  loadTree(worktreePath: string): void
  selectFile(filePath: string): void
}
