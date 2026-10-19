# 🚀 Telegram-Parallel v1.1.0 — Release Notes

> **Telegram-Parallel v1.1.0** introduces a complete architectural overhaul, an ultra-modern Aurora Glassmorphic design system, intelligent memory management with RAM Saver, and extensive desktop productivity features for multi-account power users.

---

## 🌟 Highlights

- **🗂️ Account Selection Hub (Default Mode)**: The application now starts on a clean, dedicated workspace dashboard without auto-opening any account, giving you complete control over which profile to launch.
- **🍃 RAM Saver (Session Sleeping)**: Put inactive Telegram accounts to sleep with one click to free up **300MB–500MB of RAM** per account while keeping your logins and credentials intact.
- **🖼️ Built-in Avatar Studio & Cropper**: Upload custom profile pictures directly through your native OS file dialog with interactive pan-and-zoom cropping downscaled to an optimized 128x128 in-memory canvas.
- **📥 System Tray & Background Running**: Close or minimize Telegram-Parallel to the system tray to keep sessions alive and background notification listeners active.
- **🛡️ Auto-Recovery & Crash Resilience**: Silently recovers and reloads Telegram Web instances in the event of system memory constraints or network dropouts.
- **⌨️ Desktop Keyboard Shortcuts**: Navigate rapidly between accounts with `Ctrl+1` through `Ctrl+9`, return to the hub with `Ctrl+0`, and dismiss modals with `Escape`.
- **🎨 Aurora Glassmorphism Theme**: An overhauled, futuristic dark mode interface built with Tailwind CSS v3 and fluid Framer Motion micro-interactions.

---

## 📋 What's New

### 1. Account Selection Hub

- **Default Mode Startup**: When launched, Telegram-Parallel opens directly into the visual workspace hub without auto-selecting an account.
- **Interactive Account Cards**: Every account is displayed as a sleek glassmorphic card showing its squircle avatar, real-time connection status, unread message counter, and one-click launch button.
- **Instant Hub Navigation**: Quickly return to the selection hub at any time by clicking **`[⊞ All Accounts]`** in the topbar, the **Hub icon** in the sidebar, or pressing <kbd>Ctrl</kbd> + <kbd>0</kbd>.

### 2. RAM Saver & Session Lifecycle

- Added **"Session Sleeping"**: Disabling an account completely destroys its background `WebContentsView` surface, releasing 400MB of RAM instantly while preserving authentication tokens in `persist:tg_account_${id}`.
- Waking up an account restores the session immediately without requiring you to re-authenticate or scan QR codes.
- Total memory savings and sleeping counters are now tracked live on the dashboard.

### 3. Native Avatar Cropper

- Integrated `react-easy-crop` with native OS file picker support for `.png`, `.jpg`, `.jpeg`, and `.webp`.
- Features smooth drag-to-reposition and zoom slider controls.
- Automatically crops and processes images into 128x128 JPEG/WebP data URLs, preventing memory bloat and large image storage.

### 4. Background System Tray & Startup Integration

- Added native Windows System Tray integration with double-click window restore and quick context menu.
- **Close-to-Tray**: Closing the window hides it into the tray, allowing background notification listeners to continue monitoring incoming messages.
- Fixed and verified the **"Launch at Startup"** system preference using Electron's native `app.setLoginItemSettings` API.

### 5. Desktop Keyboard Shortcuts

| Shortcut                                                       | Action                                                                  |
| :------------------------------------------------------------- | :---------------------------------------------------------------------- |
| <kbd>Escape</kbd>                                              | Dismiss any active modal (Settings, Add Account, Edit Profile, Cropper) |
| <kbd>Ctrl</kbd> + <kbd>0</kbd> / <kbd>Cmd</kbd> + <kbd>0</kbd> | Return to the **Account Selection Hub**                                 |
| <kbd>Ctrl</kbd> + <kbd>1</kbd> to <kbd>9</kbd>                 | Instantly switch directly to Account 1 through 9                        |
| <kbd>Alt</kbd> + <kbd>F4</kbd>                                 | Minimize to system tray (keeps background listeners active)             |

---

## 🛠️ Reliability & Bug Fixes

- **Safe Child View Hierarchy**: Fixed an Electron `removeChildView` crash that occurred when deleting or sleeping background views that were not active children of the main window.
- **Session Privacy on Deletion**: Deleting an account now triggers `session.fromPartition(...).clearStorageData()`, wiping session cookies, indexedDB, and cache from disk.
- **W3C Notification Standard Compliance**: Upgraded `PatchedNotification` in `telegram.ts` to implement standard W3C properties (`close()`, `icon`, `tag`, `title`, `body`), preventing `notif.close is not a function` console exceptions.
- **Continuous Title Observer**: Fixed an issue where single-page app navigation in Telegram disconnected the document title observer, restoring persistent unread badge counts on taskbar/dock icons.
- **Canvas Dimension Safety**: Added non-zero constraints in `cropImage.ts` to prevent DOM `IndexSizeError` crashes during photo processing.
- **Smart OAuth Link Routing**: Allowed Telegram OAuth popups (`oauth.telegram.org`) to open with matching partition cookies while routing external URLs to the system browser.
- **WebP Image Format Support**: Fixed MIME type detection for `.webp` image uploads.

---

## 📦 Commits Included in this Release

- `880f3e2` Publish professional documentation, feature overview, and developer guide
- `3b6ab57` Add default startup account selection hub, keyboard navigation, and session controller
- `86323c1` Create interactive avatar cropper modal and account profile edit dialog
- `a6d0c4e` Build aurora glassmorphism design system, canvas cropper utility, and styling tokens
- `8cbe1b2` Implement partition lifecycle, RAM Saver session destruction, and safe child view management
- `47304e4` Add system tray integration, close-to-tray background execution, and bounds auto-refresh
- `2f0808e` Implement strongly-typed context bridge, W3C notification patch, and resilient title observer
- `f358abc` Add comprehensive multi-process architecture blueprint and contributor guidelines
- `838d748` Configure repository tooling, ESLint 9 configuration, and package dependencies

---

## 📥 Installation & Assets

Download the installer from the release assets:

- **Windows Setup**: `telegram-parallel-setup-1.1.0.exe`
- Or compile from source:
  ```bash
  npm run build:win
  ```
