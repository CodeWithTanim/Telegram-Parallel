<p align="center">
  <img src="resources/icon.png" alt="Telegram-Parallel Logo" width="200" height="200">
</p>
<br>

<h1 align="center">✈️ Telegram-Parallel</h1>

<p align="center">
  <strong>Run and manage multiple Telegram accounts in one lightweight desktop application. Built with Electron + Vite + Tailwind CSS for a seamless, modern messaging experience.</strong>
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

**Telegram-Parallel** is a high-performance desktop client designed for power users who need to balance multiple Telegram accounts simultaneously. Whether it's personal, work, or support accounts, this application allows you to switch between them instantly without the friction of multiple browser tabs or logging in/out.

Built on the **Electron-Vite** ecosystem, it provides a native-feeling experience with minimal resource overhead, ensuring your system stays fast even with several accounts active.

---

## ✨ Key Features

- 🔄 **Unlimited Multi-Account Support**: Add and manage as many Telegram accounts as you need.
- ⚡ **Instant Switching**: A sleek sidebar allows for rapid account transitions with zero lag.
- 🎨 **Premium UI/UX**: Crafted with Tailwind CSS and Framer Motion for a "glassmorphic" and responsive dark-mode design.
- 🔒 **Session Isolation**: Every account uses a separate persistent Electron partition, keeping your session data and logins completely separate and secure.
- 📊 **Real-time Monitoring**: Automatically tracks unread message badges for each active account.
- 📦 **Desktop Native Integration**:
  - 🖥️ **System Integration**: Smooth, frameless window setup with custom titlebar draggable regions.
  - 🚀 **Auto-Startup**: Option to start automatically with Windows.
  - 🔔 **Native Notifications**: Real-time alerts for active accounts.

---

## 🛠️ Technical Stack

- **Framework**: [Electron.js](https://www.electronjs.org/) for cross-platform desktop capabilities.
- **Frontend**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/).
- **Styling**: [Tailwind CSS v3](https://tailwindcss.com/) for a modern, utility-first design system.
- **Persistence**: [electron-store](https://github.com/sindresorhus/electron-store) for lightweight, secure settings and account configuration persistence.
- **Animations**: [Framer Motion](https://www.framer.com/motion/) for smooth micro-interactions.

---

## 📁 Project Structure

```bash
Telegram-Parallel
├── 📁 src
│   ├── 📁 main           # Electron Main Process (System integration & window management)
│   ├── 📁 preload        # Bridge between System and Web (IPC Communication)
│   └── 📁 renderer       # React Frontend (UI & Logic)
│       ├── 📁 src
│       │   ├── 📁 assets  # Stylesheets, icons, and logo assets
│       │   ├── 📁 components # Versions display helper component
│       │   └── 📄 App.tsx     # Main application interface and account controller
├── ⚙️ electron-builder.yml # Packaging configuration
├── ⚙️ electron.vite.config.ts # Build system config
└── 📄 package.json       # Project dependencies & scripts
```

---

## 🚀 Installation & Setup

### 📥 For Users (Recommended)
You can download the latest pre-compiled version of **Telegram-Parallel** directly from the **[Releases](https://github.com/CodeWithTanim/Telegram-Parallel/releases)** section. 
1. Download the `Telegram-Parallel-Setup-x.x.x.exe`.
2. Run the installer.
3. Start messaging!

### 💻 For Developers (Running from Source)
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/CodeWithTanim/Telegram-Parallel.git
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Run in Development Mode**:
   ```bash
   npm run dev
   ```
4. **Build Production Installer**:
   ```bash
   npm run build:win
   ```

---

## 🧑‍💻 Meet the Developer

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

This application is **not** affiliated with Telegram or Telegram FZ-LLC. It is a third-party wrapper designed for personal use and multi-account management. Use this tool responsibly and in accordance with Telegram's Terms of Service.

**Copyright © 2026 MD SAMIUR RAHMAN TANIM**

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
