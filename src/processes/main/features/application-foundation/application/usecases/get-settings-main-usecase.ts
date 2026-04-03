import type { AppSettings } from '@domain'
import type { SupplierUseCase } from '@lib/usecase/types'
import type { StoreRepository } from '../repositories/types'

export class GetSettingsMainUseCase implements SupplierUseCase<AppSettings> {
  constructor(private readonly store: StoreRepository) {}

  invoke(): AppSettings {
    return this.store.getSettings()
  }
}
