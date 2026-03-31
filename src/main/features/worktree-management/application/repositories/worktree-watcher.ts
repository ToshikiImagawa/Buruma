import type { ParameterizedService } from '@shared/lib/service'
import type { BrowserWindow } from 'electron'

export interface WorktreeWatcherParams {
  repoPath: string
  window: BrowserWindow
}

/** ファイルシステム監視サービスインターフェース */
export type WorktreeWatcher = ParameterizedService<WorktreeWatcherParams>
