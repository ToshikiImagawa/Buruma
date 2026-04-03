// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import type { ElectronAPI } from '@shared/types/ipc'
import { contextBridge, ipcRenderer } from 'electron'

const electronAPI: ElectronAPI = {
  repository: {
    open: () => ipcRenderer.invoke('repository:open'),
    openByPath: (path: string) => ipcRenderer.invoke('repository:open-path', path),
    validate: (path: string) => ipcRenderer.invoke('repository:validate', path),
    getRecent: () => ipcRenderer.invoke('repository:get-recent'),
    removeRecent: (path: string) => ipcRenderer.invoke('repository:remove-recent', path),
    pin: (path: string, pinned: boolean) => ipcRenderer.invoke('repository:pin', { path, pinned }),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (settings) => ipcRenderer.invoke('settings:set', settings),
    getTheme: () => ipcRenderer.invoke('settings:get-theme'),
    setTheme: (theme) => ipcRenderer.invoke('settings:set-theme', theme),
  },
  onError: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, notification: Parameters<typeof callback>[0]) => {
      callback(notification)
    }
    ipcRenderer.on('error:notify', handler)
    return () => {
      ipcRenderer.removeListener('error:notify', handler)
    }
  },
  worktree: {
    list: (repoPath: string) => ipcRenderer.invoke('worktree:list', repoPath),
    status: (repoPath: string, worktreePath: string) =>
      ipcRenderer.invoke('worktree:status', { repoPath, worktreePath }),
    create: (params) => ipcRenderer.invoke('worktree:create', params),
    delete: (params) => ipcRenderer.invoke('worktree:delete', params),
    suggestPath: (repoPath: string, branch: string) =>
      ipcRenderer.invoke('worktree:suggest-path', { repoPath, branch }),
    checkDirty: (worktreePath: string) => ipcRenderer.invoke('worktree:check-dirty', worktreePath),
    defaultBranch: (repoPath: string) => ipcRenderer.invoke('worktree:default-branch', repoPath),
    onChanged: (callback) => {
      const handler = (_event: Electron.IpcRendererEvent, data: Parameters<typeof callback>[0]) => {
        callback(data)
      }
      ipcRenderer.on('worktree:changed', handler)
      return () => {
        ipcRenderer.removeListener('worktree:changed', handler)
      }
    },
  },
  git: {
    status: (args) => ipcRenderer.invoke('git:status', args),
    log: (query) => ipcRenderer.invoke('git:log', query),
    commitDetail: (args) => ipcRenderer.invoke('git:commit-detail', args),
    diff: (query) => ipcRenderer.invoke('git:diff', query),
    diffStaged: (query) => ipcRenderer.invoke('git:diff-staged', query),
    diffCommit: (args) => ipcRenderer.invoke('git:diff-commit', args),
    branches: (args) => ipcRenderer.invoke('git:branches', args),
    fileTree: (args) => ipcRenderer.invoke('git:file-tree', args),
    fileContents: (args) => ipcRenderer.invoke('git:file-contents', args),
    fileContentsCommit: (args) => ipcRenderer.invoke('git:file-contents-commit', args),
    // basic-git-operations
    stage: (args) => ipcRenderer.invoke('git:stage', args),
    stageAll: (args) => ipcRenderer.invoke('git:stage-all', args),
    unstage: (args) => ipcRenderer.invoke('git:unstage', args),
    unstageAll: (args) => ipcRenderer.invoke('git:unstage-all', args),
    commit: (args) => ipcRenderer.invoke('git:commit', args),
    push: (args) => ipcRenderer.invoke('git:push', args),
    pull: (args) => ipcRenderer.invoke('git:pull', args),
    fetch: (args) => ipcRenderer.invoke('git:fetch', args),
    branchCreate: (args) => ipcRenderer.invoke('git:branch-create', args),
    branchCheckout: (args) => ipcRenderer.invoke('git:branch-checkout', args),
    branchDelete: (args) => ipcRenderer.invoke('git:branch-delete', args),
    onProgress: (callback) => {
      const handler = (_event: Electron.IpcRendererEvent, data: Parameters<typeof callback>[0]) => {
        callback(data)
      }
      ipcRenderer.on('git:progress', handler)
      return () => {
        ipcRenderer.removeListener('git:progress', handler)
      }
    },
  },
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
