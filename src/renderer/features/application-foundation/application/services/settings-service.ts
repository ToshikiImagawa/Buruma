import type { AppSettings } from '@shared/domain'
import type { SettingsService } from './settings-service-interface'
import { DEFAULT_SETTINGS } from '@shared/domain'
import { BehaviorSubject, Observable } from 'rxjs'

export class SettingsDefaultService implements SettingsService {
  private readonly _settings$ = new BehaviorSubject<AppSettings>(DEFAULT_SETTINGS)

  readonly settings$: Observable<AppSettings>

  constructor() {
    this.settings$ = this._settings$.asObservable()
  }

  setUp(settings: AppSettings): void {
    this._settings$.next(settings)
  }

  updateSettings(settings: Partial<AppSettings>): void {
    this._settings$.next({ ...this._settings$.getValue(), ...settings })
  }

  replaceSettings(settings: AppSettings): void {
    this._settings$.next(settings)
  }

  tearDown(): void {
    this._settings$.complete()
  }
}
