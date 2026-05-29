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
          return OriginalNotification.permission;
        }
        static requestPermission(callback) {
          return OriginalNotification.requestPermission(callback);
        }
        constructor(title, options) {
          super();
          try {
            if (typeof window.ipcNotify === 'function') {
              window.ipcNotify(title, options || {});
            }
          } catch (e) {
            console.error('Failed to send notification via IPC:', e);
          }
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
  const titleEl = document.querySelector('title')
  if (!titleEl) {
    // Retry shortly if the title element isn't in the DOM yet
    setTimeout(setupTitleObserver, 500)
    return
  }

  const reportUnreadCount = () => {
    const title = document.title
    const match = title.match(/\((\d+)\)/)
    const count = match ? parseInt(match[1], 10) : 0
    ipcRenderer.send('update-unread-count', { count })
  }

  const observer = new MutationObserver(() => {
    reportUnreadCount()
  })

  observer.observe(titleEl, { childList: true, characterData: true, subtree: true })
  
  // Initial check
  reportUnreadCount()
}

// Initialize title observer once the document is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupTitleObserver)
} else {
  setupTitleObserver()
}
