// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import type { ElectronAPI } from './types/ipc'
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
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
