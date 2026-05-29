import { WebContentsView, BrowserWindow, ipcMain, Notification, app } from 'electron'
import { join } from 'path'
import Store from 'electron-store'

interface Account {
  id: string
  name: string
  avatar?: string
  unreadCount: number
}

interface AppStore {
  accounts: Account[]
}

const store = new Store<AppStore>({
  defaults: {
    accounts: []
  }
})

export class AccountManager {
  private views: Map<string, WebContentsView> = new Map()
  private activeAccountId: string | null = null
  private mainWindow: BrowserWindow

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    this.setupIpc()
    this.loadAccounts()
  }

  private setupIpc(): void {
    ipcMain.handle('get-accounts', () => store.get('accounts'))
    
    ipcMain.on('add-account', (_, account: Account) => {
      const accounts = store.get('accounts')
      accounts.push(account)
      store.set('accounts', accounts)
      this.createView(account.id)
      this.mainWindow.webContents.send('accounts-updated', accounts)
    })

    ipcMain.on('delete-account', (_, accountId: string) => {
      const accounts = store.get('accounts').filter(a => a.id !== accountId)
      store.set('accounts', accounts)
      
      const view = this.views.get(accountId)
      if (view) {
        this.mainWindow.contentView.removeChildView(view)
        this.views.delete(accountId)
      }
      
      if (this.activeAccountId === accountId) {
        this.activeAccountId = null
      }
      
      this.mainWindow.webContents.send('accounts-updated', accounts)
    })

    ipcMain.on('switch-account', (_, accountId: string) => {
      this.switchAccount(accountId)
    })

    ipcMain.on('update-unread-count', (event, { count }: { count: number }) => {
      const sender = event.sender
      const accountId = Array.from(this.views.entries()).find(([_, v]) => v.webContents === sender)?.[0]
      
      if (accountId) {
        const accounts = store.get('accounts')
        const account = accounts.find(a => a.id === accountId)
        if (account && account.unreadCount !== count) {
          account.unreadCount = count
          store.set('accounts', accounts)
          this.mainWindow.webContents.send('accounts-updated', accounts)
          this.updateBadge()
        }
      }
    })

    ipcMain.on('notification', (event, { title, options }: { title: string, options: any }) => {
      const sender = event.sender
      const accountId = Array.from(this.views.entries()).find(([_, v]) => v.webContents === sender)?.[0]
      if (accountId) {
        const accounts = store.get('accounts')
        const account = accounts.find(a => a.id === accountId)
        const accountName = account ? account.name : 'Telegram'
        
        // Show native notification
        new Notification({
          title: `[${accountName}] ${title}`,
          body: options.body,
          silent: options.silent
        }).show()
      }
    })

    ipcMain.on('update-view-bounds', (_, bounds: { x: number, y: number, width: number, height: number }) => {
      this.lastReportedBounds = bounds
      this.updateViewBounds()
    })

    ipcMain.on('set-view-visibility', (_, visible: boolean) => {
      const activeView = this.activeAccountId ? this.views.get(this.activeAccountId) : null
      if (activeView) {
        activeView.setVisible(visible)
      }
    })
  }

  private lastReportedBounds: { x: number, y: number, width: number, height: number } | null = null

  private loadAccounts(): void {
    const accounts = store.get('accounts')
    accounts.forEach(account => {
      this.createView(account.id)
    })
  }

  private createView(accountId: string): WebContentsView {
    const view = new WebContentsView({
      webPreferences: {
        preload: join(__dirname, '../preload/telegram.js'),
        partition: `persist:tg_account_${accountId}`,
        contextIsolation: true,
        sandbox: true
      }
    })

    view.webContents.loadURL('https://web.telegram.org/a/')
    this.views.set(accountId, view)
    
    // Hide initially
    view.setVisible(false)
    
    return view
  }

  public switchAccount(accountId: string): void {
    if (this.activeAccountId === accountId) return

    // Hide current view
    if (this.activeAccountId) {
      const currentView = this.views.get(this.activeAccountId)
      if (currentView) {
        currentView.setVisible(false)
        this.mainWindow.contentView.removeChildView(currentView)
      }
    }

    // Show new view
    const nextView = this.views.get(accountId)
    if (nextView) {
      this.mainWindow.contentView.addChildView(nextView)
      this.updateViewBounds(nextView)
      nextView.setVisible(true)
      this.activeAccountId = accountId
    }
  }

  public updateViewBounds(view?: WebContentsView): void {
    const targetView = view || (this.activeAccountId ? this.views.get(this.activeAccountId) : null)
    if (!targetView) return

    if (this.lastReportedBounds) {
      targetView.setBounds(this.lastReportedBounds)
    } else {
      const [width, height] = this.mainWindow.getContentSize()
      const sidebarWidth = 88 
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
