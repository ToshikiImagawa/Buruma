import type { WorktreeChangeEvent } from '@shared/domain'
import type { FSWatcher } from 'chokidar'
import type { BrowserWindow } from 'electron'
import type { IWorktreeWatcher } from '../application/worktree-interfaces'
import path from 'node:path'
import chokidar from 'chokidar'

export class WorktreeWatcher implements IWorktreeWatcher {
  private watcher: FSWatcher | null = null
  private debounceTimer: NodeJS.Timeout | null = null

  start(repoPath: string, window: BrowserWindow): void {
    this.stop()

    const watchPath = path.join(repoPath, '.git', 'worktrees')

    this.watcher = chokidar.watch(watchPath, {
      ignoreInitial: true,
      depth: 1,
    })

    const notify = () => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer)
      this.debounceTimer = setTimeout(() => {
        if (!window.isDestroyed()) {
          const event: WorktreeChangeEvent = {
            repoPath,
            type: 'modified',
            worktreePath: repoPath,
          }
          window.webContents.send('worktree:changed', event)
        }
      }, 300)
    }

    this.watcher.on('add', notify)
    this.watcher.on('unlink', notify)
    this.watcher.on('change', notify)
    this.watcher.on('addDir', notify)
    this.watcher.on('unlinkDir', notify)
  }

  stop(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
    }
  }
}
