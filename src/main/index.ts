import path from 'node:path'
import { mainConfigs } from '@main/di/configs'
import { VContainer } from '@shared/lib/di/container'
import { DisposableStack } from '@shared/lib/di/disposable-stack'
import { BrowserWindow, app } from 'electron'
import started from 'electron-squirrel-startup'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit()
}

const container = new VContainer()
const cleanupStack = new DisposableStack()

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
  }

  // Open the DevTools in development only.
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools()
  }
}

app.on('ready', async () => {
  // Register all feature configs
  for (const config of mainConfigs) {
    config.register?.(container)
  }

  // Run setUp in priority order
  const priorityGroups = new Map<number, typeof mainConfigs>()
  for (const config of mainConfigs) {
    if (!config.setUp) continue
    const priority = config.priority ?? 0
    const group = priorityGroups.get(priority) ?? []
    group.push(config)
    priorityGroups.set(priority, group)
  }

  const sortedPriorities = [...priorityGroups.keys()].sort((a, b) => a - b)
  for (const priority of sortedPriorities) {
    const group = priorityGroups.get(priority)!
    const tearDowns = await Promise.all(group.map((config) => config.setUp!(container)))
    for (const tearDown of tearDowns) {
      if (typeof tearDown === 'function') {
        cleanupStack.defer(tearDown)
      }
    }
  }

  createWindow()
})

app.on('before-quit', () => {
  cleanupStack.dispose()
  container.clear()
})

// Quit when all windows are closed, except on macOS.
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
