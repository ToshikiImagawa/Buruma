import type { Observable } from 'rxjs'
import type { GetSettingsUseCase, ISettingsViewModel, UpdateSettingsUseCase } from '../di-tokens'
import type { AppSettings, Theme } from '../domain'

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
