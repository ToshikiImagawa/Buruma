import type { AppSettings } from '@shared/domain'
import type { ParameterizedService } from '@shared/lib/service'
import type { Observable } from 'rxjs'

export interface ISettingsService extends ParameterizedService<AppSettings> {
  readonly settings$: Observable<AppSettings>
  updateSettings(settings: Partial<AppSettings>): void
  replaceSettings(settings: AppSettings): void
}
