import type { AppSettings } from '@shared/domain'
import type { SupplierUseCase } from '@shared/lib/usecase/types'
import type { IStoreRepository } from '../repository-interfaces'

export class GetSettingsMainUseCase implements SupplierUseCase<AppSettings> {
  constructor(private readonly store: IStoreRepository) {}

  invoke(): AppSettings {
    return this.store.getSettings()
  }
}
