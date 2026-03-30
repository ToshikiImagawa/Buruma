import type { RecentRepository, RepositoryInfo } from '@shared/domain'
import type { Observable } from 'rxjs'
import type {
  GetCurrentRepositoryUseCase,
  GetRecentRepositoriesUseCase,
  OpenRepositoryByPathUseCase,
  OpenRepositoryUseCase,
  PinRepositoryUseCase,
  RemoveRecentRepositoryUseCase,
} from '../di-tokens'
import type { IRepositorySelectorViewModel } from './viewmodel-interfaces'

export class RepositorySelectorViewModel implements IRepositorySelectorViewModel {
  constructor(
    private readonly openRepoUseCase: OpenRepositoryUseCase,
    private readonly openByPathUseCase: OpenRepositoryByPathUseCase,
    private readonly getRecentUseCase: GetRecentRepositoriesUseCase,
    private readonly removeRecentUseCase: RemoveRecentRepositoryUseCase,
    private readonly pinUseCase: PinRepositoryUseCase,
    private readonly getCurrentRepoUseCase: GetCurrentRepositoryUseCase,
  ) {}

  get recentRepositories$(): Observable<RecentRepository[]> {
    return this.getRecentUseCase.store
  }

  get currentRepository$(): Observable<RepositoryInfo | null> {
    return this.getCurrentRepoUseCase.store
  }

  openWithDialog(): void {
    this.openRepoUseCase.invoke()
  }

  openByPath(path: string): void {
    this.openByPathUseCase.invoke(path)
  }

  removeRecent(path: string): void {
    this.removeRecentUseCase.invoke(path)
  }

  pin(path: string, pinned: boolean): void {
    this.pinUseCase.invoke({ path, pinned })
  }
}
