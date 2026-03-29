import type { ConsumerUseCase } from '@shared/lib/usecase/types'
import type { IStoreRepository } from '../repository-interfaces'

export class RemoveRecentRepositoryMainUseCase implements ConsumerUseCase<string> {
  constructor(private readonly store: IStoreRepository) {}

  invoke(repoPath: string): void {
    const recent = this.store.getRecentRepositories()
    this.store.setRecentRepositories(recent.filter((r) => r.path !== repoPath))
  }
}
