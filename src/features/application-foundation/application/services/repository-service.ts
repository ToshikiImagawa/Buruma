import type { RecentRepository, RepositoryInfo } from '@domain'
import type { RepositoryService } from './repository-service-interface'
import { BehaviorSubject, Observable } from 'rxjs'

export class RepositoryDefaultService implements RepositoryService {
  private readonly _currentRepository$ = new BehaviorSubject<RepositoryInfo | null>(null)
  private readonly _recentRepositories$ = new BehaviorSubject<RecentRepository[]>([])

  readonly currentRepository$: Observable<RepositoryInfo | null>
  readonly recentRepositories$: Observable<RecentRepository[]>

  constructor() {
    this.currentRepository$ = this._currentRepository$.asObservable()
    this.recentRepositories$ = this._recentRepositories$.asObservable()
  }

  setUp(repos: RecentRepository[]): void {
    this._recentRepositories$.next(repos)
  }

  setCurrentRepository(repo: RepositoryInfo | null): void {
    this._currentRepository$.next(repo)
  }

  updateRecentRepositories(repos: RecentRepository[]): void {
    this._recentRepositories$.next(repos)
  }

  tearDown(): void {
    this._currentRepository$.complete()
    this._recentRepositories$.complete()
  }
}
