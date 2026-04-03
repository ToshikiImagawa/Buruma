import type { AppSettings } from '@domain'
import type { ParameterizedService } from '@lib/service'
import type { Observable } from 'rxjs'

export interface SettingsService extends ParameterizedService<AppSettings> {
  readonly settings$: Observable<AppSettings>
  updateSettings(settings: Partial<AppSettings>): void
  replaceSettings(settings: AppSettings): void
}
