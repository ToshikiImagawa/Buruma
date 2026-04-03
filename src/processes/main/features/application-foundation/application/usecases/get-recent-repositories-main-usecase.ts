import type { RecentRepository } from '@domain'
import type { SupplierUseCase } from '@lib/usecase/types'
import type { StoreRepository } from '../repositories/types'

export class GetRecentRepositoriesMainUseCase implements SupplierUseCase<RecentRepository[]> {
  constructor(private readonly store: StoreRepository) {}

  invoke(): RecentRepository[] {
    return this.store.getRecentRepositories()
  }
}
