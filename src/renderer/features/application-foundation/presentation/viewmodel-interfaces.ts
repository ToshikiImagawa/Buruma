import type { AppSettings, ErrorNotification, RecentRepository, RepositoryInfo, Theme } from '@shared/domain'
import type { Observable } from 'rxjs'

export interface IRepositorySelectorViewModel {
  readonly recentRepositories$: Observable<RecentRepository[]>
  readonly currentRepository$: Observable<RepositoryInfo | null>
  openWithDialog(): void
  openByPath(path: string): void
  removeRecent(path: string): void
  pin(path: string, pinned: boolean): void
}

export interface ISettingsViewModel {
  readonly settings$: Observable<AppSettings>
  updateSettings(settings: Partial<AppSettings>): void
  setTheme(theme: Theme): void
}

export interface IErrorNotificationViewModel {
  readonly notifications$: Observable<ErrorNotification[]>
  dismiss(errorId: string): void
  retry(errorId: string): void
}
