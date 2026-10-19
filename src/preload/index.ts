import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getAccounts: () => ipcRenderer.invoke('get-accounts'),
  addAccount: (account: any) => ipcRenderer.send('add-account', account),
  deleteAccount: (id: string) => ipcRenderer.send('delete-account', id),
  renameAccount: (id: string, name: string) => ipcRenderer.invoke('rename-account', id, name),
  readImageFile: () => ipcRenderer.invoke('read-image-file'),
  saveAvatar: (id: string, dataUrl: string) => ipcRenderer.invoke('save-avatar', id, dataUrl),
  toggleAccountStatus: (id: string, enabled: boolean) =>
    ipcRenderer.invoke('toggle-account-status', id, enabled),
  switchAccount: (id: string | null) => ipcRenderer.send('switch-account', id),
  setViewVisibility: (visible: boolean) => ipcRenderer.send('set-view-visibility', visible),
  updateViewBounds: (bounds: { x: number; y: number; width: number; height: number }) =>
    ipcRenderer.send('update-view-bounds', bounds),
  toggleSidebar: (visible: boolean) => ipcRenderer.send('toggle-sidebar', visible),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setLaunchAtStartup: (enabled: boolean) => ipcRenderer.invoke('set-launch-at-startup', enabled),
  onAccountsUpdated: (callback: (accounts: any[]) => void) => {
    const handler = (_: any, accounts: any[]) => callback(accounts)
    ipcRenderer.on('accounts-updated', handler)
    return () => {
      ipcRenderer.removeListener('accounts-updated', handler)
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
