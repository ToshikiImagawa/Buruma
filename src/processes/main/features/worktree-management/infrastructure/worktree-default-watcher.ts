import type { WorktreeChangeEvent } from '@domain'
import type { FSWatcher } from 'chokidar'
import type { WorktreeWatcher, WorktreeWatcherParams } from '../application/repositories/worktree-watcher'
import path from 'node:path'
import chokidar from 'chokidar'

export class WorktreeDefaultWatcher implements WorktreeWatcher {
  private watcher: FSWatcher | null = null
  private debounceTimer: NodeJS.Timeout | null = null

  setUp(params: WorktreeWatcherParams): void {
    this.tearDown()

    const watchPath = path.join(params.repoPath, '.git', 'worktrees')

    this.watcher = chokidar.watch(watchPath, {
      ignoreInitial: true,
      depth: 1,
    })

    const notify = () => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer)
      this.debounceTimer = setTimeout(() => {
        if (!params.window.isDestroyed()) {
          const event: WorktreeChangeEvent = {
            repoPath: params.repoPath,
            type: 'modified',
            worktreePath: params.repoPath,
          }
          params.window.webContents.send('worktree:changed', event)
        }
      }, 300)
    }

    this.watcher.on('add', notify)
    this.watcher.on('unlink', notify)
    this.watcher.on('change', notify)
    this.watcher.on('addDir', notify)
    this.watcher.on('unlinkDir', notify)
  }

  tearDown(): void {
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
