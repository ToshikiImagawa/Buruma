import type { Theme } from '@shared/domain'
import type { SupplierUseCase } from '@shared/lib/usecase/types'
import type { StoreRepository } from '../repositories/types'

export class GetThemeMainUseCase implements SupplierUseCase<Theme> {
  constructor(private readonly store: StoreRepository) {}

  invoke(): Theme {
    return this.store.getSettings().theme
  }
}
