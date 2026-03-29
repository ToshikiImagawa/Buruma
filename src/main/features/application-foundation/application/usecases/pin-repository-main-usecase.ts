import type { ConsumerUseCase } from '@shared/lib/usecase/types'
import type { IStoreRepository } from '../repository-interfaces'

export class PinRepositoryMainUseCase implements ConsumerUseCase<{ path: string; pinned: boolean }> {
  constructor(private readonly store: IStoreRepository) {}

  invoke(arg: { path: string; pinned: boolean }): void {
    const recent = this.store.getRecentRepositories()
    const updated = recent.map((r) => (r.path === arg.path ? { ...r, pinned: arg.pinned } : r))
    this.store.setRecentRepositories(updated)
  }
}
