import type { Theme } from '@shared/domain'
import type { SupplierUseCase } from '@shared/lib/usecase/types'
import type { IStoreRepository } from '../repository-interfaces'

export class GetThemeMainUseCase implements SupplierUseCase<Theme> {
  constructor(private readonly store: IStoreRepository) {}

  invoke(): Theme {
    return this.store.getSettings().theme
  }
}
