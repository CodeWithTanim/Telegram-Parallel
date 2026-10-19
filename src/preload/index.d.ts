import { ElectronAPI } from '@electron-toolkit/preload'

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

export interface TelegramParallelApi {
  getAccounts: () => Promise<Account[]>
  addAccount: (account: Account) => void
  deleteAccount: (id: string) => void
  renameAccount: (id: string, name: string) => Promise<void>
  readImageFile: () => Promise<string | null>
  saveAvatar: (id: string, dataUrl: string) => Promise<boolean>
  toggleAccountStatus: (id: string, enabled: boolean) => Promise<void>
  switchAccount: (id: string | null) => void
  setViewVisibility: (visible: boolean) => void
  updateViewBounds: (bounds: { x: number; y: number; width: number; height: number }) => void
  toggleSidebar: (visible: boolean) => void
  getSettings: () => Promise<UserSettings>
  setLaunchAtStartup: (enabled: boolean) => Promise<boolean>
  onAccountsUpdated: (callback: (accounts: Account[]) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: TelegramParallelApi
  }
}
