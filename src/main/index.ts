import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import { join, resolve } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { AccountManager } from './accountManager'

// Bypass automation detection for web views
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled')

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let accountManager: AccountManager | null = null
let isQuitting = false

function createTray(): void {
  if (tray) return
  const trayIcon = nativeImage.createFromPath(icon)
  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }))

  const restoreWindow = (): void => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
      accountManager?.updateViewBounds()
    }
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Telegram-Parallel',
      click: restoreWindow
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('Telegram-Parallel')
  tray.setContextMenu(contextMenu)
  tray.on('double-click', restoreWindow)
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1050,
    height: 720,
    minWidth: 800,
    minHeight: 550,
    show: false,
    autoHideMenuBar: true,
    icon: icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    },
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#07090e',
      symbolColor: '#cbd5e1',
      height: 32
    }
  })

  if (process.platform === 'win32') {
    mainWindow.setIcon(nativeImage.createFromPath(icon))
  }

  accountManager = new AccountManager(mainWindow)

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('resize', () => {
    accountManager?.updateViewBounds()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Prevent app from quitting when close button is clicked; minimize to tray instead
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
      return false
    }
    return true
  })

  // HMR for renderer based on electron-vite cli
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.codewithtanim.telegramparallel')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  const gotTheLock = app.requestSingleInstanceLock()
  if (!gotTheLock) {
    app.quit()
  } else {
    app.on('second-instance', (_event, commandLine) => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.show()
        mainWindow.focus()

        const url = commandLine.pop()
        if (url?.startsWith('tg://')) {
          // Deep link forwarding if required
        }
      }
    })
  }

  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('tg', process.execPath, [resolve(process.argv[1])])
    }
  } else {
    app.setAsDefaultProtocolClient('tg')
  }

  createWindow()
  createTray()

  app.on('activate', function () {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    } else {
      createWindow()
    }
  })
})

app.on('before-quit', () => {
  isQuitting = true
  if (tray && !tray.isDestroyed()) {
    tray.destroy()
    tray = null
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Kept alive by tray
  }
})
