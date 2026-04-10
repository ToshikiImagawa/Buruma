import type { CommitSummary, DiffDisplayMode, FileDiff } from '@domain'
import type { BaseService } from '@lib/service'
import type { Observable } from 'rxjs'

/** リポジトリ閲覧の状態管理サービス IF */
export interface RepositoryViewerService extends BaseService {
  readonly selectedCommitHash$: Observable<string | null>
  readonly commits$: Observable<CommitSummary[]>
  readonly hasMoreCommits$: Observable<boolean>
  readonly selectedFilePath$: Observable<string | null>
  readonly selectedFileStaged$: Observable<boolean>
  readonly diffs$: Observable<FileDiff[]>
  readonly diffDisplayMode$: Observable<DiffDisplayMode>
  readonly logSearch$: Observable<string>
  readonly branchSearch$: Observable<string>

  selectCommit(hash: string | null): void
  setCommits(commits: CommitSummary[], hasMore: boolean): void
  appendCommits(commits: CommitSummary[], hasMore: boolean): void
  selectFile(filePath: string | null, staged?: boolean): void
  setDiffs(diffs: FileDiff[]): void
  setDiffDisplayMode(mode: DiffDisplayMode): void
  setLogSearch(search: string): void
  setBranchSearch(search: string): void
}
