# AGENTS.md — Telegram-Parallel AI Agent & Contributor Guide

> **Telegram-Parallel** is a high-performance desktop application for running and managing multiple Telegram accounts simultaneously within a single window, utilizing Electron `WebContentsView` partitions for strict session isolation.

---

## 1. Project Overview & Architecture

### 1.1 Core Mission

Allow power users to run and switch between multiple Telegram accounts concurrently without session collisions, browser tab bloat, or logging in/out.

### 1.2 Multi-Process Architecture

Telegram-Parallel leverages Electron's modern multi-process architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                       MAIN PROCESS                          │
│  src/main/index.ts & src/main/accountManager.ts             │
│  • Window management (Frameless BrowserWindow)             │
│  • electron-store account persistence                       │
│  • WebContentsView lifecycle & partition isolation          │
│  • Native OS Notifications & Badge counts                   │
│  • Deep Linking (tg:// protocol registration)               │
└──────────────────────┬──────────────────────────────────────┘
                       │ IPC (Inter-Process Communication)
         ┌─────────────┴─────────────┐
         ▼                           ▼
┌─────────────────────────┐ ┌─────────────────────────────────┐
│     RENDERER PROCESS    │ │     TELEGRAM WEB VIEWS (xN)     │
│  src/renderer/src/      │ │  WebContentsView per account    │
│  • React 19 + Vite      │ │  • Isolated partition:          │
│  • Tailwind CSS v3      │ │    persist:tg_account_${id}     │
│  • Framer Motion UI     │ │  • Preload: src/preload/        │
│  • Lucide React icons   │ │    telegram.ts                  │
│  • Sidebar & Account    │ │  • Intercepts window.Notification│
│    Switching Interface  │ │  • MutationObserver for unread  │
│  • Modal Controls       │ │    message count                │
└─────────────────────────┘ └─────────────────────────────────┘
```

### 1.3 Key Architectural Patterns

1. **Session Partition Isolation**:
   - Each account is loaded in a separate `WebContentsView` with `partition: 'persist:tg_account_' + account.id`.
   - Cookies, local storage, indexedDB, and cache are strictly isolated between accounts.
2. **Native WebContentsView Layering**:
   - `WebContentsView` is a native OS surface drawn on top of the Electron `BrowserWindow`.
   - **Crucial Quirk**: It renders **above** HTML DOM elements. Whenever a modal or overlay (e.g., "Add Account" or "Settings") opens in the React renderer, the active view must be hidden using `set-view-visibility(false)` to prevent obscuring the modal.
3. **Synchronized Sizing**:
   - The React renderer observes the `#view-container` bounding rect using `ResizeObserver` and emits `update-view-bounds` to the main process, keeping the native webview aligned with the UI layout.
4. **DOM & Notification Interception**:
   - `src/preload/telegram.ts` injects a custom `Notification` class replacement into the Telegram Web page that forwards web notifications over IPC to Electron's native notification API.
   - It observes `<title>` element mutations (e.g., `(2) Telegram`) to parse the active unread badge count and update the dock/taskbar badge.

---

## 2. Directory & File Map

| Path                                                                                                 | Purpose                         | Key Responsibilities                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [src/main/index.ts](file:///d:/SCRIPTS/GitHub/Telegram-Parallel/src/main/index.ts)                   | Main process entry point        | Creates main window, sets up single instance lock, registers `tg://` deep linking, initializes `AccountManager`.                                                          |
| [src/main/accountManager.ts](file:///d:/SCRIPTS/GitHub/Telegram-Parallel/src/main/accountManager.ts) | Account & view lifecycle        | Manages `WebContentsView` map, handles IPC events (`add-account`, `switch-account`, `delete-account`), manages `electron-store`, updates badges and native notifications. |
| [src/preload/index.ts](file:///d:/SCRIPTS/GitHub/Telegram-Parallel/src/preload/index.ts)             | Main UI preload script          | Exposes Electron APIs to the React renderer via `contextBridge.exposeInMainWorld`.                                                                                        |
| [src/preload/telegram.ts](file:///d:/SCRIPTS/GitHub/Telegram-Parallel/src/preload/telegram.ts)       | Telegram webview preload        | Injected into each Telegram session; overrides `window.Notification` and monitors document `<title>` for unread message counts.                                           |
| [src/preload/index.d.ts](file:///d:/SCRIPTS/GitHub/Telegram-Parallel/src/preload/index.d.ts)         | Preload TypeScript declarations | Types for global `window.electron` and `window.api`.                                                                                                                      |
| [src/renderer/src/App.tsx](file:///d:/SCRIPTS/GitHub/Telegram-Parallel/src/renderer/src/App.tsx)     | Primary React application       | Renders the sidebar, top navigation bar, account switcher, add account modal, and settings modal.                                                                         |
| [src/renderer/src/index.css](file:///d:/SCRIPTS/GitHub/Telegram-Parallel/src/renderer/src/index.css) | Global styling & design system  | Tailwind directives, glassmorphic utility classes (`glass`, `glass-sidebar`, `glass-topbar`), animated mesh gradient background, custom scrollbars.                       |
| [electron.vite.config.ts](file:///d:/SCRIPTS/GitHub/Telegram-Parallel/electron.vite.config.ts)       | Build configuration             | Configures Vite bundling for Main, Preload (both `index.ts` and `telegram.ts`), and Renderer.                                                                             |
| [electron-builder.yml](file:///d:/SCRIPTS/GitHub/Telegram-Parallel/electron-builder.yml)             | Packaging & release config      | Package installer configuration for Windows (NSIS), macOS (DMG), and Linux (AppImage/snap/deb).                                                                           |
| [package.json](file:///d:/SCRIPTS/GitHub/Telegram-Parallel/package.json)                             | Dependencies & scripts          | Node scripts for dev, build, linting, typechecking, and packaging.                                                                                                        |

---

## 3. IPC (Inter-Process Communication) Contract

### Renderer $\leftrightarrow$ Main Process

| Channel                 | Direction                   | Payload                                       | Description                                                                                                                                     |
| ----------------------- | --------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `get-accounts`          | `Renderer -> Main (invoke)` | _None_                                        | Fetches saved account list from `electron-store`. Returns `Account[]`.                                                                          |
| `add-account`           | `Renderer -> Main (send)`   | `Account: { id, name, avatar?, unreadCount }` | Persists new account, initializes isolated `WebContentsView`, emits `accounts-updated`.                                                         |
| `delete-account`        | `Renderer -> Main (send)`   | `accountId: string`                           | Removes account from store, destroys view and view resources, emits `accounts-updated`.                                                         |
| `switch-account`        | `Renderer -> Main (send)`   | `accountId: string \| null`                   | When non-null: attaches view, updates bounds, and sets visible. When `null`: detaches active view and returns to default Account Selection Hub. |
| `accounts-updated`      | `Main -> Renderer (send)`   | `Account[]`                                   | Broadcasts new state whenever accounts are added, removed, or have unread count changes.                                                        |
| `update-view-bounds`    | `Renderer -> Main (send)`   | `{ x, y, width, height }`                     | Syncs current `#view-container` bounding box with native `WebContentsView`.                                                                     |
| `set-view-visibility`   | `Renderer -> Main (send)`   | `visible: boolean`                            | Toggles active webview visibility (must be `false` while modals are open).                                                                      |
| `get-settings`          | `Renderer -> Main (invoke)` | _None_                                        | Returns persisted user settings (`{ launchAtStartup: boolean }`).                                                                               |
| `set-launch-at-startup` | `Renderer -> Main (invoke)` | `enabled: boolean`                            | Configures OS autostart via `app.setLoginItemSettings` and saves state to store.                                                                |
| `rename-account`        | `Renderer -> Main (invoke)` | `id: string, name: string`                    | Renames an account and broadcasts updated accounts.                                                                                             |
| `read-image-file`       | `Renderer -> Main (invoke)` | _None_                                        | Opens native OS file picker for images and returns base64 data URL.                                                                             |
| `save-avatar`           | `Renderer -> Main (invoke)` | `id: string, dataUrl: string`                 | Stores 128x128 cropped avatar data URL into account profile.                                                                                    |
| `toggle-account-status` | `Renderer -> Main (invoke)` | `id: string, enabled: boolean`                | Enables/Disables session (RAM Saver: destroys webContents when disabled to save memory).                                                        |
| `toggle-sidebar`        | `Renderer -> Main (send)`   | `visible: boolean`                            | Tells main process to resize active view bounds when sidebar collapses/expands.                                                                 |

### Telegram Webview $\rightarrow$ Main Process

| Channel               | Direction                  | Payload                           | Description                                                                                     |
| --------------------- | -------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------- |
| `notification`        | `Telegram Preload -> Main` | `{ title: string, options: any }` | Receives intercepted notification from Telegram Web; triggers native OS desktop `Notification`. |
| `update-unread-count` | `Telegram Preload -> Main` | `{ count: number }`               | Updates specific account unread count, syncs to store, updates app badge (`app.setBadgeCount`). |

---

## 4. Development & Build Commands

Always run these commands from the repository root:

```bash
# 1. Install dependencies
npm install

# 2. Run in development mode with HMR (hot module replacement)
npm run dev

# 3. Full TypeScript typecheck across Node and Web configs
npm run typecheck

# 4. Lint codebase
npm run lint

# 5. Format files with Prettier
npm run format

# 6. Production build test (checks types & builds bundles)
npm run build

# 7. Package Windows installer
npm run build:win

# 8. Package macOS binary (on macOS)
npm run build:mac

# 9. Package Linux installer (on Linux)
npm run build:linux
```

---

## 5. Critical Engineering Rules for Agents

1. **Never Break WebContentsView Z-Indexing**:
   - `WebContentsView` does not respect standard CSS z-index rules. Any modal, drawer, or popup overlay rendered in React **must** be accompanied by `window.electron.ipcRenderer.send('set-view-visibility', false)` when opened, and set back to `true` on close.
2. **Never Share Partitions**:
   - Every account must strictly use `persist:tg_account_${accountId}`. Never fallback to default or shared sessions, as this leads to session cross-contamination and auth state leaks.
3. **Always Run Typecheck**:
   - Run `npm run typecheck` after modifying any TypeScript code in `src/main`, `src/preload`, or `src/renderer`.
4. **Preserve Native Frameless Window Controls**:
   - In `src/renderer/src/App.tsx`, keep `style={{ WebkitAppRegion: 'drag' }}` on top headers/sidebars, and ensure interactive elements (buttons, inputs) explicitly declare `style={{ WebkitAppRegion: 'no-drag' }}`.
5. **Context Isolation & Preload Security**:
   - Preload scripts must never expose raw Node `require` or full `ipcRenderer` objects if exposed to external web content. Keep `contextIsolation: true` and `sandbox: true` on all Telegram views.

---

## 6. Future Upgrade Roadmap & Specifications

This roadmap outlines prioritized enhancements for upcoming versions. Agents implementing these features should follow the detailed technical design below:

### Phase 1: Settings & System Integration (High Priority)

- **Launch at Startup**:
  - Connect settings toggle in [App.tsx](file:///d:/SCRIPTS/GitHub/Telegram-Parallel/src/renderer/src/App.tsx) to IPC handler using `app.setLoginItemSettings({ openAtLogin: boolean })`.
- **System Tray & Background Running**:
  - Add Electron `Tray` instance in [src/main/index.ts](file:///d:/SCRIPTS/GitHub/Telegram-Parallel/src/main/index.ts).
  - Implement "Minimize to Tray" and "Close to Tray" settings.
  - Display unread badge counter directly on tray icon image.
- **Persistent Settings Storage**:
  - Extend `AppStore` schema in [src/main/accountManager.ts](file:///d:/SCRIPTS/GitHub/Telegram-Parallel/src/main/accountManager.ts) to store:
    ```typescript
    interface UserSettings {
      launchAtStartup: boolean
      closeToTray: boolean
      globalNotifications: boolean
      clientVariant: 'a' | 'k' // Telegram Web A vs Web K
      theme: 'dark' | 'system'
    }
    ```

### Phase 2: Per-Account Customization & Proxy (Power Feature)

- **Per-Account Proxy Support**:
  - Many Telegram power users operate accounts across different regions and require dedicated proxies (SOCKS5/HTTP/HTTPS).
  - Configure partition proxy in `createView`:
    ```typescript
    const session = session.fromPartition(`persist:tg_account_${accountId}`)
    await session.setProxy({
      proxyRules: account.proxyUrl, // e.g., 'socks5://127.0.0.1:1080'
      proxyBypassRules: '<local>'
    })
    ```
- **Account Editing & Custom Avatars**:
  - Add "Edit Account" dialog in the UI allowing users to rename accounts, upload a custom avatar file, or select a custom theme accent color.
- **Client Variant Selector**:
  - Support choosing between Telegram Web A (`https://web.telegram.org/a/`) and Telegram Web K (`https://web.telegram.org/k/`) per account.

### Phase 3: Keyboard Shortcuts & Power Navigation

- **Quick Account Switching**:
  - Register local keyboard shortcuts (`Ctrl+1` through `Ctrl+9` / `Cmd+1..9` on macOS) to instantly switch between accounts.
  - `Ctrl+Tab` / `Ctrl+Shift+Tab` to cycle sequentially through active accounts.
- **Global Hotkey for Quick Reveal**:
  - Optional global hotkey (e.g. `Ctrl+Alt+T`) to bring Telegram-Parallel to the foreground from anywhere.

### Phase 4: App Lock & Privacy

- **Master PIN / Password**:
  - Option to protect the application with a master password or PIN upon launch or after idle timeout.
  - Blur or hide web views when application is locked or loses focus.

### Phase 5: Architecture & Code Polish

- **Strongly-Typed ContextBridge API**:
  - Replace direct `window.electron.ipcRenderer` calls in React with a clean, typed `window.api` bridge defined in [src/preload/index.ts](file:///d:/SCRIPTS/GitHub/Telegram-Parallel/src/preload/index.ts) and [src/preload/index.d.ts](file:///d:/SCRIPTS/GitHub/Telegram-Parallel/src/preload/index.d.ts).
- **Crash Recovery & Auto-Reload**:
  - Listen for `webContents.on('render-process-gone')` and network offline/online events to automatically offer a reload button or silently reload crashed Telegram webviews.

---

## 7. Verification Checklist for New Changes

Before completing any task or pull request, ensure:

- [ ] `npm run typecheck` passes with zero errors.
- [ ] `npm run lint` passes without unresolved lint warnings.
- [ ] WebContentsView bounds scale properly when the window is resized or maximized.
- [ ] Any modal opening in the UI correctly sets `set-view-visibility` to false so it is not obscured.
- [ ] Account sessions remain preserved after restarting the app.
- [ ] Windows draggable regions (`WebkitAppRegion`) allow dragging without trapping clicks on buttons.

---

## 8. Troubleshooting & Common Issues

### "Error: Electron uninstall" during `npm run dev`

- **Root Cause**: On Windows systems or newer Node versions, npm postinstall may download the cached zip without completing extraction to `node_modules/electron/dist` or creating `node_modules/electron/path.txt`.
- **Fix**:
  Extract the cached zip directly using `tar` or PowerShell into `node_modules/electron/dist/` and create `path.txt` with content `electron.exe`:
  ```powershell
  # Locate downloaded zip in %LOCALAPPDATA%\electron\Cache\... and extract
  tar -xf "$env:LOCALAPPDATA\electron\Cache\...\electron-v*.zip" -C "node_modules/electron/dist"
  Set-Content -Path "node_modules/electron/path.txt" -Value "electron.exe" -NoNewline
  ```
