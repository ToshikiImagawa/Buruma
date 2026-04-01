import type { CommitSummary, DiffDisplayMode, FileDiff } from '@shared/domain'
import type { Observable } from 'rxjs'
import type { RepositoryViewerService } from './repository-viewer-service-interface'
import { BehaviorSubject } from 'rxjs'

export class RepositoryViewerDefaultService implements RepositoryViewerService {
  private readonly _selectedCommitHash$ = new BehaviorSubject<string | null>(null)
  private readonly _commits$ = new BehaviorSubject<CommitSummary[]>([])
  private readonly _hasMoreCommits$ = new BehaviorSubject<boolean>(false)
  private readonly _selectedFilePath$ = new BehaviorSubject<string | null>(null)
  private readonly _selectedFileStaged$ = new BehaviorSubject<boolean>(false)
  private readonly _diffs$ = new BehaviorSubject<FileDiff[]>([])
  private readonly _diffDisplayMode$ = new BehaviorSubject<DiffDisplayMode>('inline')
  private readonly _logSearch$ = new BehaviorSubject<string>('')
  private readonly _branchSearch$ = new BehaviorSubject<string>('')

  readonly selectedCommitHash$: Observable<string | null> = this._selectedCommitHash$.asObservable()
  readonly commits$: Observable<CommitSummary[]> = this._commits$.asObservable()
  readonly hasMoreCommits$: Observable<boolean> = this._hasMoreCommits$.asObservable()
  readonly selectedFilePath$: Observable<string | null> = this._selectedFilePath$.asObservable()
  readonly selectedFileStaged$: Observable<boolean> = this._selectedFileStaged$.asObservable()
  readonly diffs$: Observable<FileDiff[]> = this._diffs$.asObservable()
  readonly diffDisplayMode$: Observable<DiffDisplayMode> = this._diffDisplayMode$.asObservable()
  readonly logSearch$: Observable<string> = this._logSearch$.asObservable()
  readonly branchSearch$: Observable<string> = this._branchSearch$.asObservable()

  setUp(): void {
    // 初期状態はコンストラクタで設定済み
  }

  tearDown(): void {
    this._selectedCommitHash$.complete()
    this._commits$.complete()
    this._hasMoreCommits$.complete()
    this._selectedFilePath$.complete()
    this._selectedFileStaged$.complete()
    this._diffs$.complete()
    this._diffDisplayMode$.complete()
    this._logSearch$.complete()
    this._branchSearch$.complete()
  }

  selectCommit(hash: string | null): void {
    this._selectedCommitHash$.next(hash)
  }

  setCommits(commits: CommitSummary[], hasMore: boolean): void {
    this._commits$.next(commits)
    this._hasMoreCommits$.next(hasMore)
  }

  appendCommits(commits: CommitSummary[], hasMore: boolean): void {
    const current = this._commits$.getValue()
    this._commits$.next([...current, ...commits])
    this._hasMoreCommits$.next(hasMore)
  }

  selectFile(filePath: string | null, staged = false): void {
    this._selectedFilePath$.next(filePath)
    this._selectedFileStaged$.next(staged)
  }

  setDiffs(diffs: FileDiff[]): void {
    this._diffs$.next(diffs)
  }

  setDiffDisplayMode(mode: DiffDisplayMode): void {
    this._diffDisplayMode$.next(mode)
  }

  setLogSearch(search: string): void {
    this._logSearch$.next(search)
  }

  setBranchSearch(search: string): void {
    this._branchSearch$.next(search)
  }
}
