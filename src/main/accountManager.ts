import {
  WebContentsView,
  BrowserWindow,
  ipcMain,
  Notification,
  app,
  session,
  shell,
  dialog
} from 'electron'
import { join } from 'path'
import * as fs from 'fs'
import Store from 'electron-store'

export interface Account {
  id: string
  name: string
  avatar?: string
  hasCustomAvatar?: boolean
  unreadCount: number
  isEnabled?: boolean
}

export interface UserSettings {
  launchAtStartup: boolean
}

export interface AppStore {
  accounts: Account[]
  settings: UserSettings
}

const store = new Store<AppStore>({
  defaults: {
    accounts: [],
    settings: {
      launchAtStartup: false
    }
  }
})

export class AccountManager {
  private views: Map<string, WebContentsView> = new Map()
  private activeAccountId: string | null = null
  private mainWindow: BrowserWindow
  private isSidebarVisible: boolean = true
  private lastReportedBounds: { x: number; y: number; width: number; height: number } | null = null

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    this.setupIpc()
    this.loadAccounts()
    this.applySettings()
  }

  private applySettings(): void {
    const settings = store.get('settings', { launchAtStartup: false })
    if (settings?.launchAtStartup) {
      try {
        app.setLoginItemSettings({
          openAtLogin: true,
          path: app.isPackaged ? process.execPath : undefined
        })
      } catch (err) {
        console.error('Failed to apply login item settings on start:', err)
      }
    }
  }

  private setupIpc(): void {
    ipcMain.removeHandler('get-accounts')
    ipcMain.handle('get-accounts', () => store.get('accounts'))

    ipcMain.removeHandler('get-settings')
    ipcMain.handle('get-settings', () => {
      const saved = store.get('settings', { launchAtStartup: false })
      try {
        const loginSettings = app.getLoginItemSettings()
        return {
          launchAtStartup: loginSettings.openAtLogin ?? saved.launchAtStartup
        }
      } catch (err) {
        console.error('Failed to get login item settings:', err)
        return saved
      }
    })

    ipcMain.removeHandler('set-launch-at-startup')
    ipcMain.handle('set-launch-at-startup', (_, enabled: boolean) => {
      store.set('settings.launchAtStartup', enabled)
      try {
        app.setLoginItemSettings({
          openAtLogin: enabled,
          path: app.isPackaged ? process.execPath : undefined
        })
        const status = app.getLoginItemSettings()
        return status.openAtLogin
      } catch (err) {
        console.error('Failed to set login item settings:', err)
        return enabled
      }
    })

    ipcMain.removeHandler('rename-account')
    ipcMain.handle('rename-account', (_, accountId: string, newName: string) => {
      const accounts = store.get('accounts').map((a) => {
        if (a.id === accountId) return { ...a, name: newName }
        return a
      })
      store.set('accounts', accounts)
      this.mainWindow.webContents.send('accounts-updated', accounts)
    })

    ipcMain.removeHandler('read-image-file')
    ipcMain.handle('read-image-file', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow, {
        properties: ['openFile'],
        filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }]
      })
      if (!result.canceled && result.filePaths.length > 0) {
        try {
          const filePath = result.filePaths[0]
          const buffer = fs.readFileSync(filePath)
          const lower = filePath.toLowerCase()
          const ext = lower.endsWith('.png') ? 'png' : lower.endsWith('.webp') ? 'webp' : 'jpeg'
          return `data:image/${ext};base64,${buffer.toString('base64')}`
        } catch (err) {
          console.error('Error loading image:', err)
          return null
        }
      }
      return null
    })

    ipcMain.removeHandler('save-avatar')
    ipcMain.handle('save-avatar', (_, accountId: string, dataUrl: string) => {
      try {
        const accounts = store.get('accounts').map((a) => {
          if (a.id === accountId) return { ...a, avatar: dataUrl, hasCustomAvatar: true }
          return a
        })
        store.set('accounts', accounts)
        this.mainWindow.webContents.send('accounts-updated', accounts)
        return true
      } catch (err) {
        console.error('Error saving avatar:', err)
        return false
      }
    })

    ipcMain.removeHandler('toggle-account-status')
    ipcMain.handle('toggle-account-status', (_, accountId: string, enabled: boolean) => {
      const accounts = store.get('accounts').map((a) => {
        if (a.id === accountId) return { ...a, isEnabled: enabled }
        return a
      })
      store.set('accounts', accounts)
      this.mainWindow.webContents.send('accounts-updated', accounts)

      if (!enabled) {
        const view = this.views.get(accountId)
        if (view) {
          if (this.activeAccountId === accountId) {
            this.safelyRemoveChildView(view)
            this.activeAccountId = null
          }
          try {
            // @ts-ignore - destroy internal webContents
            view.webContents.destroy()
          } catch (err) {
            console.error('Error destroying webContents:', err)
          }
          this.views.delete(accountId)
        }
      } else {
        if (this.activeAccountId === accountId || !this.activeAccountId) {
          this.switchAccount(accountId)
        }
      }
    })

    ipcMain.on('add-account', (_, account: Account) => {
      const accounts = store.get('accounts')
      accounts.push({ ...account, isEnabled: true })
      store.set('accounts', accounts)
      this.createView(account.id)
      this.mainWindow.webContents.send('accounts-updated', accounts)
    })

    ipcMain.on('delete-account', (_, accountId: string) => {
      const accounts = store.get('accounts').filter((a) => a.id !== accountId)
      store.set('accounts', accounts)

      const view = this.views.get(accountId)
      if (view) {
        this.safelyRemoveChildView(view)
        try {
          // @ts-ignore - destroy internal webContents
          view.webContents.destroy()
        } catch (err) {
          console.error('Error destroying webContents:', err)
        }
        this.views.delete(accountId)
      }

      // Clear storage data from disk for deleted account partition
      try {
        session.fromPartition(`persist:tg_account_${accountId}`).clearStorageData()
      } catch (err) {
        console.warn('Error clearing storage data for deleted partition:', err)
      }

      if (this.activeAccountId === accountId) {
        this.activeAccountId = null
      }

      this.mainWindow.webContents.send('accounts-updated', accounts)
    })

    ipcMain.on('switch-account', (_, accountId: string | null) => {
      this.switchAccount(accountId)
    })

    ipcMain.on('update-unread-count', (event, { count }: { count: number }) => {
      const sender = event.sender
      const accountId = Array.from(this.views.entries()).find(
        ([_, v]) => v.webContents === sender
      )?.[0]

      if (accountId) {
        const accounts = store.get('accounts')
        const account = accounts.find((a) => a.id === accountId)
        if (account && account.unreadCount !== count) {
          account.unreadCount = count
          store.set('accounts', accounts)
          this.mainWindow.webContents.send('accounts-updated', accounts)
          this.updateBadge()
        }
      }
    })

    ipcMain.on('notification', (event, { title, options }: { title: string; options: any }) => {
      const sender = event.sender
      const accountId = Array.from(this.views.entries()).find(
        ([_, v]) => v.webContents === sender
      )?.[0]
      if (accountId) {
        const accounts = store.get('accounts')
        const account = accounts.find((a) => a.id === accountId)
        const accountName = account ? account.name : 'Telegram'

        // Show native notification with click to switch
        const notif = new Notification({
          title: `[${accountName}] ${title}`,
          body: options.body,
          silent: options.silent
        })

        notif.on('click', () => {
          if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            if (this.mainWindow.isMinimized()) this.mainWindow.restore()
            this.mainWindow.show()
            this.mainWindow.focus()
            this.switchAccount(accountId)
          }
        })

        notif.show()
      }
    })

    ipcMain.on(
      'update-view-bounds',
      (_, bounds: { x: number; y: number; width: number; height: number }) => {
        this.lastReportedBounds = bounds
        this.updateViewBounds()
      }
    )

    ipcMain.on('set-view-visibility', (_, visible: boolean) => {
      const activeView = this.activeAccountId ? this.views.get(this.activeAccountId) : null
      if (activeView) {
        activeView.setVisible(visible)
      }
    })

    ipcMain.on('toggle-sidebar', (_, visible: boolean) => {
      this.isSidebarVisible = visible
      this.updateViewBounds()
    })
  }

  private loadAccounts(): void {
    const accounts = store.get('accounts')
    accounts.forEach((account) => {
      if (account.isEnabled !== false) {
        this.createView(account.id)
      }
    })
  }

  private createView(accountId: string): WebContentsView | null {
    const accounts = store.get('accounts')
    const account = accounts.find((a) => a.id === accountId)
    if (account && account.isEnabled === false) {
      return null
    }

    if (this.views.has(accountId)) {
      return this.views.get(accountId)!
    }

    const partition = `persist:tg_account_${accountId}`
    const sess = session.fromPartition(partition)

    // Grant media permissions (Microphone, Camera, Notifications)
    sess.setPermissionRequestHandler((_webContents, permission, callback) => {
      const allowed = [
        'media',
        'geolocation',
        'notifications',
        'midiSysex',
        'pointerLock',
        'fullscreen',
        'openExternal'
      ]
      callback(allowed.includes(permission))
    })

    // Modern Chrome User Agent to avoid browser obsolescence checks
    const userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
    sess.setUserAgent(userAgent)

    const view = new WebContentsView({
      webPreferences: {
        preload: join(__dirname, '../preload/telegram.js'),
        partition,
        contextIsolation: true,
        sandbox: true,
        backgroundThrottling: false,
        spellcheck: true
      }
    })

    view.webContents.setUserAgent(userAgent)

    // Handle external links vs internal auth
    view.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https://oauth.telegram.org') || url.startsWith('https://telegram.org')) {
        return { action: 'allow' }
      }
      shell.openExternal(url)
      return { action: 'deny' }
    })

    // Crash recovery: automatically reload view if render process crashes
    view.webContents.on('render-process-gone', (_event, details) => {
      console.warn(`[Account ${accountId}] WebContents crashed (${details.reason})`)
      if (details.reason !== 'clean-exit') {
        setTimeout(() => {
          if (!view.webContents.isDestroyed()) {
            view.webContents.loadURL('https://web.telegram.org/a/')
          }
        }, 1000)
      }
    })

    // Network recovery: automatically retry if initial load fails
    view.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
      if (errorCode !== -3 && validatedURL.includes('telegram.org')) {
        console.warn(`[Account ${accountId}] Failed to load (${errorCode}): ${errorDescription}`)
        setTimeout(() => {
          if (!view.webContents.isDestroyed()) {
            view.webContents.loadURL('https://web.telegram.org/a/')
          }
        }, 5000)
      }
    })

    view.webContents.loadURL('https://web.telegram.org/a/')
    this.views.set(accountId, view)

    // Hide initially until switched
    view.setVisible(false)

    return view
  }

  private safelyRemoveChildView(view: WebContentsView): void {
    try {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        const children = this.mainWindow.contentView.children
        if (children && children.includes(view)) {
          this.mainWindow.contentView.removeChildView(view)
        }
      }
    } catch (err) {
      console.warn('safelyRemoveChildView warning:', err)
    }
  }

  private safelyAddChildView(view: WebContentsView): void {
    try {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        const children = this.mainWindow.contentView.children
        if (children && !children.includes(view)) {
          this.mainWindow.contentView.addChildView(view)
        }
      }
    } catch (err) {
      console.warn('safelyAddChildView warning:', err)
    }
  }

  public switchAccount(accountId: string | null): void {
    if (!accountId) {
      if (this.activeAccountId) {
        const currentView = this.views.get(this.activeAccountId)
        if (currentView) {
          currentView.setVisible(false)
          this.safelyRemoveChildView(currentView)
        }
        this.activeAccountId = null
      }
      return
    }

    const accounts = store.get('accounts')
    const account = accounts.find((a) => a.id === accountId)
    if (account && account.isEnabled === false) {
      return
    }

    if (this.activeAccountId === accountId && this.views.has(accountId)) return

    // Hide current view
    if (this.activeAccountId) {
      const currentView = this.views.get(this.activeAccountId)
      if (currentView) {
        currentView.setVisible(false)
        this.safelyRemoveChildView(currentView)
      }
    }

    // Show new view
    let nextView = this.views.get(accountId)
    if (!nextView) {
      nextView = this.createView(accountId) || undefined
    }

    if (nextView) {
      this.safelyAddChildView(nextView)
      this.updateViewBounds(nextView)
      nextView.setVisible(true)
      this.activeAccountId = accountId
      nextView.webContents.focus()
    }
  }

  public updateViewBounds(view?: WebContentsView): void {
    const targetView = view || (this.activeAccountId ? this.views.get(this.activeAccountId) : null)
    if (!targetView) return

    if (this.lastReportedBounds) {
      targetView.setBounds(this.lastReportedBounds)
    } else {
      const [width, height] = this.mainWindow.getContentSize()
      const sidebarWidth = this.isSidebarVisible ? 88 : 0
      const topBarHeight = 68

      targetView.setBounds({
        x: sidebarWidth,
        y: topBarHeight,
        width: Math.max(0, width - sidebarWidth),
        height: Math.max(0, height - topBarHeight)
      })
    }
  }

  private updateBadge(): void {
    const accounts = store.get('accounts')
    const totalUnread = accounts.reduce((sum, a) => sum + (a.unreadCount || 0), 0)
    if (totalUnread > 0) {
      app.setBadgeCount(totalUnread)
    } else {
      app.setBadgeCount(0)
    }
  }
}
