import type { ISettingsService } from '../di-tokens'
import type { AppSettings } from '../domain'
import { BehaviorSubject, Observable } from 'rxjs'
import { DEFAULT_SETTINGS } from '../domain'

export class SettingsService implements ISettingsService {
  private readonly _settings$ = new BehaviorSubject<AppSettings>(DEFAULT_SETTINGS)

  get settings$(): Observable<AppSettings> {
    return this._settings$.asObservable()
  }

  updateSettings(settings: Partial<AppSettings>): void {
    this._settings$.next({ ...this._settings$.getValue(), ...settings })
  }

  replaceSettings(settings: AppSettings): void {
    this._settings$.next(settings)
  }

  dispose(): void {
    this._settings$.complete()
  }
}
