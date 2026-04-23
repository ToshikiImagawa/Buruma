import type { AppSettings, Theme } from '@domain'

export interface SettingsRepository {
  get(): Promise<AppSettings>
  update(settings: Partial<AppSettings>): Promise<void>
  getTheme(): Promise<Theme>
  setTheme(theme: Theme): Promise<void>
  /** ネイティブダイアログでエディタアプリを選択する。選択結果はバックエンド側で設定に永続化される。 */
  selectEditorApp(): Promise<string | null>
}
