import type { RecentRepository } from '@shared/domain'
import type { SupplierUseCase } from '@shared/lib/usecase/types'
import type { IStoreRepository } from '../repository-interfaces'

export class GetRecentRepositoriesMainUseCase implements SupplierUseCase<RecentRepository[]> {
  constructor(private readonly store: IStoreRepository) {}

  invoke(): RecentRepository[] {
    return this.store.getRecentRepositories()
  }
}
