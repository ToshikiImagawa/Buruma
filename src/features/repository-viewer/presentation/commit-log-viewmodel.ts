import type { CommitDetail, CommitSummary } from '@domain'
import type { Observable } from 'rxjs'
import type { RepositoryViewerService } from '../application/services/repository-viewer-service-interface'
import type { GetCommitDetailUseCase, GetLogUseCase } from '../di-tokens'
import type { CommitLogViewModel } from './viewmodel-interfaces'
import { BehaviorSubject } from 'rxjs'

const PAGE_SIZE = 50

export class CommitLogDefaultViewModel implements CommitLogViewModel {
  private readonly _commits$ = new BehaviorSubject<CommitSummary[]>([])
  private readonly _hasMore$ = new BehaviorSubject<boolean>(false)
  private readonly _loading$ = new BehaviorSubject<boolean>(false)
  private readonly _selectedCommit$ = new BehaviorSubject<CommitDetail | null>(null)
  private search = ''

  readonly commits$: Observable<CommitSummary[]> = this._commits$.asObservable()
  readonly hasMore$: Observable<boolean> = this._hasMore$.asObservable()
  readonly loading$: Observable<boolean> = this._loading$.asObservable()
  readonly selectedCommit$: Observable<CommitDetail | null> = this._selectedCommit$.asObservable()

  constructor(
    private readonly getLogUseCase: GetLogUseCase,
    private readonly getCommitDetailUseCase: GetCommitDetailUseCase,
    private readonly service: RepositoryViewerService,
  ) {}

  loadCommits(worktreePath: string): void {
    this._loading$.next(true)
    this.getLogUseCase
      .invoke({ worktreePath, offset: 0, limit: PAGE_SIZE, search: this.search || undefined })
      .then((result) => {
        this._commits$.next(result.commits)
        this._hasMore$.next(result.hasMore)
        this.service.setCommits(result.commits, result.hasMore)
      })
      .catch(() => {
        this._commits$.next([])
        this._hasMore$.next(false)
      })
      .finally(() => {
        this._loading$.next(false)
      })
  }

  loadMore(worktreePath: string): void {
    const currentCommits = this._commits$.getValue()
    this._loading$.next(true)
    this.getLogUseCase
      .invoke({
        worktreePath,
        offset: currentCommits.length,
        limit: PAGE_SIZE,
        search: this.search || undefined,
      })
      .then((result) => {
        const merged = [...currentCommits, ...result.commits]
        this._commits$.next(merged)
        this._hasMore$.next(result.hasMore)
        this.service.appendCommits(result.commits, result.hasMore)
      })
      .catch(() => {})
      .finally(() => {
        this._loading$.next(false)
      })
  }

  selectCommit(worktreePath: string, hash: string): void {
    this.service.selectCommit(hash)
    this.getCommitDetailUseCase
      .invoke({ worktreePath, hash })
      .then((detail) => {
        this._selectedCommit$.next(detail)
      })
      .catch(() => {
        this._selectedCommit$.next(null)
      })
  }

  setSearch(search: string): void {
    this.search = search
    this.service.setLogSearch(search)
  }
}
