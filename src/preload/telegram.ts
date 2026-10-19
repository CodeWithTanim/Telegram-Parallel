import { contextBridge, ipcRenderer } from 'electron'

// Expose IPC callback to the main world securely
try {
  contextBridge.exposeInMainWorld('ipcNotify', (title: string, options: any) => {
    ipcRenderer.send('notification', { title, options })
  })
} catch (error) {
  console.error('Failed to expose ipcNotify to main world:', error)
}

// Inject the custom Notification override into the main world context
const injectNotificationOverride = () => {
  const script = document.createElement('script')
  script.textContent = `
    (function() {
      const OriginalNotification = window.Notification;
      if (!OriginalNotification) return;
      
      class PatchedNotification extends EventTarget {
        static get permission() {
          return OriginalNotification.permission || 'granted';
        }
        static requestPermission(callback) {
          if (typeof callback === 'function') callback('granted');
          return Promise.resolve('granted');
        }
        constructor(title, options) {
          super();
          this._title = title;
          this._options = options || {};
          this.onclick = null;
          this.onclose = null;
          this.onerror = null;
          this.onshow = null;
          try {
            if (typeof window.ipcNotify === 'function') {
              window.ipcNotify(title, options || {});
            }
          } catch (e) {
            console.error('Failed to send notification via IPC:', e);
          }
        }
        close() {
          // Native desktop notification handles its own lifecycle
        }
        get title() {
          return this._title;
        }
        get body() {
          return this._options?.body || '';
        }
        get icon() {
          return this._options?.icon || '';
        }
        get tag() {
          return this._options?.tag || '';
        }
      }
      
      window.Notification = PatchedNotification;
    })();
  `
  if (document.documentElement) {
    document.documentElement.appendChild(script)
    script.remove()
  }
}

// Run notification override injection
if (document.documentElement) {
  injectNotificationOverride()
} else {
  document.addEventListener('DOMContentLoaded', injectNotificationOverride)
}

// Observer for document title changes to capture and report the unread message count
const setupTitleObserver = () => {
  const reportUnreadCount = () => {
    const title = document.title || ''
    const match = title.match(/\(([0-9,]+)\)/)
    const count = match ? parseInt(match[1].replace(/,/g, ''), 10) : 0
    ipcRenderer.send('update-unread-count', { count: Math.max(0, count || 0) })
  }

  // Observe head or root for title element changes
  const target = document.head || document.documentElement
  if (target) {
    const observer = new MutationObserver(() => {
      reportUnreadCount()
    })
    observer.observe(target, { childList: true, characterData: true, subtree: true })
  }

  // Initial check
  reportUnreadCount()
}

// Initialize title observer once document is interactive
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupTitleObserver)
} else {
  setupTitleObserver()
}
