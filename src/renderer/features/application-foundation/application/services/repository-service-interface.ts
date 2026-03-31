import type { RecentRepository, RepositoryInfo } from '@shared/domain'
import type { ParameterizedService } from '@shared/lib/service'
import type { Observable } from 'rxjs'

export interface RepositoryService extends ParameterizedService<RecentRepository[]> {
  readonly currentRepository$: Observable<RepositoryInfo | null>
  readonly recentRepositories$: Observable<RecentRepository[]>
  setCurrentRepository(repo: RepositoryInfo | null): void
  updateRecentRepositories(repos: RecentRepository[]): void
}
