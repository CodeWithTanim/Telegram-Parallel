<p align="center">
  <img src="resources/icon.png" alt="Telegram-Parallel Logo" width="180" height="180">
</p>
<br>

<h1 align="center">✈️ Telegram-Parallel</h1>

<p align="center">
  <strong>Run, isolate, and manage multiple Telegram accounts concurrently in one high-performance desktop application. Built with Electron + Vite + React 19 + Tailwind CSS.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-39.x-47848F?style=for-the-badge&logo=electron&logoColor=white" alt="Electron">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-7.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License">
</p>

---

## 📖 Overview

**Telegram-Parallel** is an ultra-fast, modern desktop client engineered for power users, community managers, and professionals who manage multiple Telegram accounts simultaneously.

Unlike traditional multi-instance setups or cluttered browser windows, **Telegram-Parallel** isolates every session into its own dedicated Electron `WebContentsView` partition. Cookies, credentials, and local cache never collide, allowing you to run all your Telegram accounts concurrently within a single unified workspace.

---

## ✨ Core Features

### 🗂️ Account Selection Hub (Default Mode)

- **Zero-Accidental Opening**: Launches into a clean, modern workspace hub instead of automatically loading a session.
- **Visual Account Cards**: Displays all connected accounts with custom avatars, real-time connection status, unread counters, and one-click session launch buttons.
- **Instant Hub Return**: Easily return to the selection hub at any time using the sidebar hub button, topbar breadcrumb, or `Ctrl+0`.

### 🔒 Strict Session Partition Sandboxing

- **Zero Cross-Contamination**: Each account runs within an isolated partition (`persist:tg_account_${id}`).
- **Persistent Logins**: Sessions remain active across reboots and application updates without re-authentication.
- **Privacy First**: Deleting an account completely purges its cookies, cache, and indexed storage from disk.

### 🍃 RAM Saver (Session Sleeping)

- **Free up Memory on Demand**: Put background accounts to sleep with a single click to save 300MB–500MB of RAM per session.
- **Instant Wake-Up**: Wakes instantly back up into the active workspace when selected.

### 🖼️ Custom Avatar Studio & Cropper

- **Native OS File Dialog**: Pick avatar images (`.png`, `.jpg`, `.jpeg`, `.webp`) directly through your system file picker.
- **Interactive Cropping Modal**: Smooth zoom and pan controls powered by `react-easy-crop`.
- **Performance Optimized**: Automatically crops and downscales to 128x128 on an in-memory canvas to preserve disk space and memory.

### 🔔 Native Notifications & Badges

- **Background Interception**: Telegram Web notifications are seamlessly intercepted and forwarded to the native OS notification system.
- **Click-to-Focus**: Clicking an OS notification instantly brings Telegram-Parallel to the foreground and switches directly to that specific account.
- **Real-Time Unread Counters**: Dynamically parses unread messages from title mutations and displays dock/taskbar notification badges.

### 🛡️ Crash Resilience & Auto-Recovery

- **Automatic Process Recovery**: If a background Telegram Web instance crashes due to system constraints, the application automatically restarts and recovers the session silently.
- **Network Auto-Reconnect**: Automatically retries loading when internet connectivity is restored.
- **Smart URL Routing**: Opens Telegram authentication and bot popups (`oauth.telegram.org`) within the authenticated session while routing all external links to your default system browser.

### 📥 System Tray & Background Execution

- **Close-to-Tray**: Minimizing or closing the window keeps your accounts alive in the system tray so you never miss a message.
- **Quick Tray Menu**: Show/hide the application or exit cleanly through the tray context menu.

### 🎨 Modern Aurora Glassmorphism Design

- **Tailwind CSS v3**: Tailored aurora dark theme (`#07090e`) with electric cyan (`#00D2FF`), Telegram blue (`#24A1DE`), and vibrant indigo accents.
- **Fluid Micro-Animations**: Smooth layout transitions and hover physics built with Framer Motion.
- **Collapsible Sidebar**: Collapse the sidebar to enjoy an expansive, full-width chat interface.

---

## ⌨️ Desktop Keyboard Shortcuts

| Shortcut                                                       | Action                                                                |
| :------------------------------------------------------------- | :-------------------------------------------------------------------- |
| <kbd>Escape</kbd>                                              | Close any active modal (Settings, Add Account, Edit Profile, Cropper) |
| <kbd>Ctrl</kbd> + <kbd>0</kbd> / <kbd>Cmd</kbd> + <kbd>0</kbd> | Return to the **Account Selection Hub**                               |
| <kbd>Ctrl</kbd> + <kbd>1</kbd> to <kbd>9</kbd>                 | Instantly switch directly to Account 1 through 9                      |
| <kbd>Alt</kbd> + <kbd>F4</kbd>                                 | Minimize to system tray (keeps sessions alive in background)          |

---

## 🛠️ Technical Stack

- **Desktop Framework**: [Electron 39](https://www.electronjs.org/) (Multi-process `WebContentsView` architecture).
- **Bundler & Tooling**: [electron-vite 7](https://electron-vite.org/) + [Vite](https://vitejs.dev/).
- **Frontend Engine**: [React 19](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/).
- **Styling**: [Tailwind CSS v3](https://tailwindcss.com/) with custom glassmorphism filters.
- **Animations**: [Framer Motion](https://www.framer.com/motion/).
- **Icons**: [Lucide React](https://lucide.dev/).
- **Image Cropper**: [react-easy-crop](https://github.com/ValentinH/react-easy-crop).
- **Settings & Config Storage**: [electron-store](https://github.com/sindresorhus/electron-store).

---

## 📁 Repository Structure

```
Telegram-Parallel
├── 📁 src
│   ├── 📁 main                      # Electron Main Process
│   │   ├── 📄 index.ts              # Window lifecycle, System Tray, deep links
│   │   └── 📄 accountManager.ts     # WebContentsView sandboxing, RAM Saver, IPC
│   ├── 📁 preload                   # Isolated Preload Layer
│   │   ├── 📄 index.ts              # Strongly-typed contextBridge API
│   │   ├── 📄 index.d.ts            # Type definitions for window.api
│   │   └── 📄 telegram.ts           # Telegram DOM title observer & notification patch
│   └── 📁 renderer                  # React 19 Frontend
│       ├── 📄 index.html            # CSP-secured root template
│       └── 📁 src
│           ├── 📁 components        # AvatarCropperModal, EditAccountModal
│           ├── 📁 utils             # cn helper, canvas cropImage utility
│           ├── 📄 App.tsx           # Hub, switcher, sidebar, and layout controller
│           └── 📄 index.css         # Aurora theme tokens & glassmorphic utilities
├── ⚙️ electron.vite.config.ts        # Vite multi-bundle configuration
├── ⚙️ electron-builder.yml          # Multi-platform installer packaging
├── 📄 AGENTS.md                     # Architecture specification & contributor rules
└── 📄 package.json                  # Dependencies & scripts
```

---

## 🚀 Installation & Getting Started

### 📥 Pre-compiled Binaries (Recommended)

Download the latest pre-compiled installer from the **[Releases](https://github.com/CodeWithTanim/Telegram-Parallel/releases)** page:

1. Download `telegram-parallel-setup.exe`.
2. Run the installer and launch the application.

### 💻 Running from Source

```bash
# 1. Clone the repository
git clone https://github.com/CodeWithTanim/Telegram-Parallel.git
cd Telegram-Parallel

# 2. Install dependencies
npm install

# 3. Launch in development mode with Hot Module Replacement (HMR)
npm run dev

# 4. Run TypeScript checks across Node and Web targets
npm run typecheck

# 5. Lint codebase
npm run lint

# 6. Format codebase
npm run format

# 7. Package Windows installer
npm run build:win
```

---

## 🧑‍💻 Author & Maintainer

**MD SAMIUR RAHMAN TANIM**

<p align="left">
  <a href="https://github.com/CodeWithTanim"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"></a>
  <a href="https://linkedin.com/in/codewithtanim"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"></a>
  <a href="https://youtube.com/@CodeWithTanim"><img src="https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="YouTube"></a>
  <a href="https://facebook.com/CodeWithTanim"><img src="https://img.shields.io/badge/Facebook-1877F2?style=for-the-badge&logo=facebook&logoColor=white" alt="Facebook"></a>
  <a href="https://instagram.com/CodeWithTanim"><img src="https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram"></a>
</p>

---

## ⚖️ Disclaimer & License

This application is **not** affiliated with Telegram or Telegram FZ-LLC. It is an independent open-source desktop client designed for personal and professional multi-account productivity.

**Copyright © 2026 MD SAMIUR RAHMAN TANIM**

Distributed under the MIT License. See [LICENSE](LICENSE) for more details.
