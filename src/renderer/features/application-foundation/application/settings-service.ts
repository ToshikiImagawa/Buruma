import type { ISettingsService } from '../di-tokens'
import type { AppSettings } from '@/shared/domain'
import { BehaviorSubject, Observable } from 'rxjs'
import { DEFAULT_SETTINGS } from '@/shared/domain'

export class SettingsService implements ISettingsService {
  private readonly _settings$ = new BehaviorSubject<AppSettings>(DEFAULT_SETTINGS)

  get settings$(): Observable<AppSettings> {
    return this._settings$.asObservable()
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
