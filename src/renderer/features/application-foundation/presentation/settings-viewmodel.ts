import type { AppSettings, Theme } from '@shared/domain'
import type { Observable } from 'rxjs'
import type { GetSettingsUseCase, UpdateSettingsUseCase } from '../di-tokens'
import type { ISettingsViewModel } from './viewmodel-interfaces'

export class SettingsViewModel implements ISettingsViewModel {
  constructor(
    private readonly getSettingsUseCase: GetSettingsUseCase,
    private readonly updateSettingsUseCase: UpdateSettingsUseCase,
  ) {}

  get settings$(): Observable<AppSettings> {
    return this.getSettingsUseCase.property.asObservable()
  }

  updateSettings(settings: Partial<AppSettings>): void {
    this.updateSettingsUseCase.invoke(settings)
  }

  setTheme(theme: Theme): void {
    this.updateSettingsUseCase.invoke({ theme })
  }
}
