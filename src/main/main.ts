import type { BootstrapResult } from '@main/bootstrap'
import path from 'node:path'
import { bootstrapContainer } from '@main/bootstrap'
import { mainConfigs } from '@main/di/configs'
import { BrowserWindow, app } from 'electron'
import started from 'electron-squirrel-startup'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit()
}

let bootstrap: BootstrapResult | null = null

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
  }

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools()
  }
}

app.on('ready', async () => {
  try {
    bootstrap = await bootstrapContainer(mainConfigs)
  } catch (error) {
    console.error('[Main] Container initialization failed:', error)
  }

  createWindow()
})

app.on('before-quit', () => {
  bootstrap?.cleanup.dispose()
  bootstrap?.container.clear()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
