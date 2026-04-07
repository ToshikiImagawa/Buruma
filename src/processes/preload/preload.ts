// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import type { ElectronAPI } from '@lib/ipc'
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
    reset: (args) => ipcRenderer.invoke('git:reset', args),
    // advanced-git-operations
    merge: (args) => ipcRenderer.invoke('git:merge', args),
    mergeAbort: (args) => ipcRenderer.invoke('git:merge-abort', args),
    mergeStatus: (args) => ipcRenderer.invoke('git:merge-status', args),
    rebase: (args) => ipcRenderer.invoke('git:rebase', args),
    rebaseInteractive: (args) => ipcRenderer.invoke('git:rebase-interactive', args),
    rebaseAbort: (args) => ipcRenderer.invoke('git:rebase-abort', args),
    rebaseContinue: (args) => ipcRenderer.invoke('git:rebase-continue', args),
    rebaseGetCommits: (args) => ipcRenderer.invoke('git:rebase-get-commits', args),
    stashSave: (args) => ipcRenderer.invoke('git:stash-save', args),
    stashList: (args) => ipcRenderer.invoke('git:stash-list', args),
    stashPop: (args) => ipcRenderer.invoke('git:stash-pop', args),
    stashApply: (args) => ipcRenderer.invoke('git:stash-apply', args),
    stashDrop: (args) => ipcRenderer.invoke('git:stash-drop', args),
    stashClear: (args) => ipcRenderer.invoke('git:stash-clear', args),
    cherryPick: (args) => ipcRenderer.invoke('git:cherry-pick', args),
    cherryPickAbort: (args) => ipcRenderer.invoke('git:cherry-pick-abort', args),
    conflictList: (args) => ipcRenderer.invoke('git:conflict-list', args),
    conflictFileContent: (args) => ipcRenderer.invoke('git:conflict-file-content', args),
    conflictResolve: (args) => ipcRenderer.invoke('git:conflict-resolve', args),
    conflictResolveAll: (args) => ipcRenderer.invoke('git:conflict-resolve-all', args),
    conflictMarkResolved: (args) => ipcRenderer.invoke('git:conflict-mark-resolved', args),
    tagList: (args) => ipcRenderer.invoke('git:tag-list', args),
    tagCreate: (args) => ipcRenderer.invoke('git:tag-create', args),
    tagDelete: (args) => ipcRenderer.invoke('git:tag-delete', args),
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
  claude: {
    startSession: (args) => ipcRenderer.invoke('claude:start-session', args),
    stopSession: (args) => ipcRenderer.invoke('claude:stop-session', args),
    getSession: (args) => ipcRenderer.invoke('claude:get-session', args),
    getAllSessions: () => ipcRenderer.invoke('claude:get-all-sessions'),
    sendCommand: (command) => ipcRenderer.invoke('claude:send-command', command),
    getOutput: (args) => ipcRenderer.invoke('claude:get-output', args),
    checkAuth: () => ipcRenderer.invoke('claude:check-auth'),
    login: () => ipcRenderer.invoke('claude:login'),
    logout: () => ipcRenderer.invoke('claude:logout'),
    onOutput: (callback) => {
      const handler = (_event: Electron.IpcRendererEvent, data: Parameters<typeof callback>[0]) => {
        callback(data)
      }
      ipcRenderer.on('claude:output', handler)
      return () => {
        ipcRenderer.removeListener('claude:output', handler)
      }
    },
    onSessionChanged: (callback) => {
      const handler = (_event: Electron.IpcRendererEvent, data: Parameters<typeof callback>[0]) => {
        callback(data)
      }
      ipcRenderer.on('claude:session-changed', handler)
      return () => {
        ipcRenderer.removeListener('claude:session-changed', handler)
      }
    },
    onCommandCompleted: (callback) => {
      const handler = (_event: Electron.IpcRendererEvent, data: Parameters<typeof callback>[0]) => {
        callback(data)
      }
      ipcRenderer.on('claude:command-completed', handler)
      return () => {
        ipcRenderer.removeListener('claude:command-completed', handler)
      }
    },
    generateCommitMessage: (args) => ipcRenderer.invoke('claude:generate-commit-message', args),
  },
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
