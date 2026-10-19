import { useEffect, useState } from 'react'
import {
  Plus,
  Send,
  Settings,
  X,
  Search,
  PanelLeftClose,
  PanelLeft,
  Edit3,
  Moon,
  Sparkles,
  LayoutGrid,
  ArrowUpRight,
  ShieldCheck,
  Power,
  Trash2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from './utils/cn'
import { AvatarCropperModal } from './components/AvatarCropperModal'
import { EditAccountModal } from './components/EditAccountModal'

interface Account {
  id: string
  name: string
  avatar?: string
  hasCustomAvatar?: boolean
  unreadCount: number
  isEnabled?: boolean
}

function App() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
  const [cropAccountId, setCropAccountId] = useState<string | null>(null)
  const [isSidebarVisible, setIsSidebarVisible] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [launchAtStartup, setLaunchAtStartup] = useState(false)
  const [newName, setNewName] = useState('')

  // Hide WebContentsView whenever any overlay/modal is open
  useEffect(() => {
    const isAnyModalOpen = isAdding || isSettingsOpen || editingAccount !== null || cropModalOpen
    window.api?.setViewVisibility(!isAnyModalOpen)
  }, [isAdding, isSettingsOpen, editingAccount, cropModalOpen])

  useEffect(() => {
    // Initial fetch of accounts: default mode starts on the Account Selection Hub (no account auto-opened)
    window.api?.getAccounts().then((loadedAccounts: Account[]) => {
      setAccounts(Array.isArray(loadedAccounts) ? loadedAccounts : [])
    })

    // Fetch startup settings
    window.api
      ?.getSettings()
      .then((settings) => {
        if (settings && typeof settings.launchAtStartup === 'boolean') {
          setLaunchAtStartup(settings.launchAtStartup)
        }
      })
      .catch(console.error)

    // Subscribe to accounts updates
    const removeListener = window.api?.onAccountsUpdated((updatedAccounts: Account[]) => {
      setAccounts(Array.isArray(updatedAccounts) ? updatedAccounts : [])
    })

    // Sync bounds dynamically with #view-container
    const container = document.getElementById('view-container')
    let observer: ResizeObserver | null = null
    if (container) {
      observer = new ResizeObserver(() => {
        const rect = container.getBoundingClientRect()
        window.api?.updateViewBounds({
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        })
      })
      observer.observe(container)
    }

    return () => {
      if (removeListener) removeListener()
      if (observer) observer.disconnect()
    }
  }, [])

  // Global desktop keyboard shortcuts: Escape (close modals), Ctrl+0 (Hub), Ctrl+1..9 (Switch account)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (cropModalOpen) setCropModalOpen(false)
        else if (editingAccount) setEditingAccount(null)
        else if (isAdding) setIsAdding(false)
        else if (isSettingsOpen) setIsSettingsOpen(false)
      }

      // Quick Hub shortcut: Ctrl+0 / Cmd+0
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault()
        handleSwitch(null)
      }

      // Quick Switcher: Ctrl+1 .. Ctrl+9
      if ((e.ctrlKey || e.metaKey) && /^[1-9]$/.test(e.key)) {
        const index = parseInt(e.key, 10) - 1
        const target = accounts[index]
        if (target) {
          e.preventDefault()
          handleSwitch(target.id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cropModalOpen, editingAccount, isAdding, isSettingsOpen, accounts])

  const handleSwitch = (id: string | null) => {
    if (!id) {
      setActiveAccountId(null)
      window.api?.switchAccount(null)
      return
    }

    const account = accounts.find((a) => a.id === id)
    if (account && account.isEnabled === false) {
      // Wake up the account if user switches to it
      handleToggleAccountStatus(id, true)
    }
    setActiveAccountId(id)
    window.api?.switchAccount(id)
  }

  const handleAdd = () => {
    if (!newName.trim()) return
    const id = Math.random().toString(36).substring(2, 11)
    const newAccount: Account = { id, name: newName.trim(), unreadCount: 0, isEnabled: true }
    window.api?.addAccount(newAccount)
    setNewName('')
    setIsAdding(false)
    handleSwitch(id)
  }

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const target = accounts.find((a) => a.id === id)
    if (confirm(`Delete account "${target?.name || 'this account'}"?`)) {
      window.api?.deleteAccount(id)
      if (editingAccount?.id === id) setEditingAccount(null)
      if (activeAccountId === id) {
        handleSwitch(null)
      }
    }
  }

  const handleToggleStartup = async () => {
    const nextVal = !launchAtStartup
    setLaunchAtStartup(nextVal)
    try {
      const isEnabled = await window.api?.setLaunchAtStartup(nextVal)
      if (typeof isEnabled === 'boolean') {
        setLaunchAtStartup(isEnabled)
      }
    } catch (err) {
      console.error('Failed to update startup setting:', err)
      setLaunchAtStartup(!nextVal)
    }
  }

  const handleToggleSidebar = () => {
    const nextVal = !isSidebarVisible
    setIsSidebarVisible(nextVal)
    window.api?.toggleSidebar(nextVal)
  }

  const handleOpenAvatarCropper = async (accountId: string) => {
    try {
      const dataUrl = await window.api?.readImageFile()
      if (dataUrl) {
        setCropAccountId(accountId)
        setCropImageSrc(dataUrl)
        setCropModalOpen(true)
      }
    } catch (err) {
      console.error('Failed to read image file:', err)
    }
  }

  const handleSaveCroppedAvatar = async (dataUrl: string) => {
    if (cropAccountId) {
      await window.api?.saveAvatar(cropAccountId, dataUrl)
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === cropAccountId ? { ...a, avatar: dataUrl, hasCustomAvatar: true } : a
        )
      )
      if (editingAccount && editingAccount.id === cropAccountId) {
        setEditingAccount((prev) =>
          prev ? { ...prev, avatar: dataUrl, hasCustomAvatar: true } : null
        )
      }
      setCropModalOpen(false)
      setCropImageSrc(null)
      setCropAccountId(null)
    }
  }

  const handleRenameAccount = async (id: string, name: string) => {
    await window.api?.renameAccount(id, name)
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, name } : a)))
    if (editingAccount && editingAccount.id === id) {
      setEditingAccount((prev) => (prev ? { ...prev, name } : null))
    }
  }

  const handleToggleAccountStatus = async (id: string, enabled: boolean) => {
    await window.api?.toggleAccountStatus(id, enabled)
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, isEnabled: enabled } : a)))
    if (editingAccount && editingAccount.id === id) {
      setEditingAccount((prev) => (prev ? { ...prev, isEnabled: enabled } : null))
    }
    if (!enabled && activeAccountId === id) {
      handleSwitch(null)
    }
  }

  const filteredAccounts = accounts.filter((a) =>
    (a.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeAccount = accounts.find((a) => a.id === activeAccountId)

  return (
    <div className="flex h-screen w-screen overflow-hidden text-slate-100 bg-aurora selection:bg-[#00D2FF]/30 selection:text-white">
      {/* Avatar Cropper Modal */}
      <AvatarCropperModal
        isOpen={cropModalOpen}
        imageSrc={cropImageSrc}
        onClose={() => setCropModalOpen(false)}
        onSave={handleSaveCroppedAvatar}
      />

      {/* Account Settings / Edit Modal */}
      <EditAccountModal
        account={editingAccount}
        isOpen={editingAccount !== null}
        onClose={() => setEditingAccount(null)}
        onRename={handleRenameAccount}
        onChangeAvatar={handleOpenAvatarCropper}
        onToggleStatus={handleToggleAccountStatus}
        onDelete={handleDelete}
      />

      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {isSidebarVisible && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 88, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="glass-sidebar flex flex-col items-center py-6 space-y-6 z-20 shrink-0 overflow-hidden"
            style={{ WebkitAppRegion: 'drag' } as any}
          >
            {/* App Logo - Click to return to Account Hub */}
            <div className="mb-1 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
              <motion.div
                whileHover={{ scale: 1.1, rotate: -6 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSwitch(null)}
                className="w-14 h-14 rounded-[22px] bg-gradient-to-tr from-[#00D2FF] via-[#24A1DE] to-[#8B5CF6] flex items-center justify-center shadow-[0_0_25px_rgba(36,161,222,0.45)] cursor-pointer border border-white/20"
                title="Telegram-Parallel - Return to Hub"
              >
                <Send
                  size={26}
                  className="text-white fill-white/15 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                />
              </motion.div>
            </div>

            {/* Account List */}
            <div
              className="flex-1 w-full overflow-y-auto no-scrollbar space-y-3.5 px-3"
              style={{ WebkitAppRegion: 'no-drag' } as any}
            >
              {/* Account Selection Hub / Home Icon */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSwitch(null)}
                className={cn(
                  'relative group cursor-pointer w-14 h-14 mx-auto rounded-[20px] flex items-center justify-center transition-all duration-300 overflow-visible select-none',
                  activeAccountId === null
                    ? 'bg-gradient-to-br from-[#00D2FF]/20 via-[#24A1DE]/40 to-[#6366F1]/30 border border-[#00D2FF]/60 shadow-[0_8px_25px_rgba(0,210,255,0.3)] ring-1 ring-[#00D2FF]/60 text-cyan-200'
                    : 'bg-white/[0.04] hover:bg-white/[0.09] border border-white/5 hover:border-white/15 text-slate-400 hover:text-cyan-300'
                )}
                title="Account Hub (All Accounts)"
              >
                <LayoutGrid size={22} />
                {activeAccountId === null && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute -left-3 w-1.5 h-8 bg-gradient-to-b from-[#00D2FF] via-[#24A1DE] to-[#8B5CF6] rounded-r-full shadow-[4px_0_15px_rgba(0,210,255,0.8)]"
                  />
                )}
                <div className="absolute left-[70px] px-3.5 py-2 bg-slate-900/95 backdrop-blur-xl rounded-xl text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.6)] z-50 flex items-center gap-2">
                  <span className="text-white">Account Hub (Select Account)</span>
                </div>
              </motion.div>

              <div className="w-8 h-[1px] bg-white/10 mx-auto my-1.5" />
              {filteredAccounts.map((account) => {
                const isEnabled = account.isEnabled !== false
                const isActive = activeAccountId === account.id

                return (
                  <motion.div
                    key={account.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSwitch(account.id)}
                    className={cn(
                      'relative group cursor-pointer w-14 h-14 mx-auto rounded-[20px] flex items-center justify-center transition-all duration-300 overflow-visible select-none',
                      isActive
                        ? 'bg-gradient-to-br from-[#00D2FF]/20 via-[#24A1DE]/40 to-[#6366F1]/30 border border-[#00D2FF]/60 shadow-[0_8px_25px_rgba(0,210,255,0.3)] ring-1 ring-[#00D2FF]/60'
                        : 'bg-white/[0.04] hover:bg-white/[0.09] border border-white/5 hover:border-white/15',
                      !isEnabled && 'opacity-60 grayscale-[40%]'
                    )}
                  >
                    {account.avatar ? (
                      <img
                        src={account.avatar}
                        alt={account.name}
                        className="w-full h-full rounded-[20px] object-cover"
                      />
                    ) : (
                      <span
                        className={cn(
                          'text-xl font-bold uppercase tracking-wider',
                          isActive
                            ? 'bg-gradient-to-tr from-white via-cyan-100 to-indigo-200 bg-clip-text text-transparent'
                            : 'text-slate-400 group-hover:text-slate-200'
                        )}
                      >
                        {account.name[0]}
                      </span>
                    )}

                    {/* Unread Counter Badge */}
                    {account.unreadCount > 0 && isEnabled && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-[#0a0e18] min-w-[20px] text-center shadow-[0_0_12px_rgba(244,63,94,0.7)]"
                      >
                        {account.unreadCount > 99 ? '99+' : account.unreadCount}
                      </motion.div>
                    )}

                    {/* Sleeping RAM-Saver Badge */}
                    {!isEnabled && (
                      <div
                        className="absolute -bottom-1 -right-1 bg-[#07090e] border border-amber-500/50 p-1 rounded-full text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                        title="Sleeping (RAM Saved)"
                      >
                        <Moon size={10} />
                      </div>
                    )}

                    {/* Active Bar Indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="active-indicator"
                        className="absolute -left-3 w-1.5 h-8 bg-gradient-to-b from-[#00D2FF] via-[#24A1DE] to-[#8B5CF6] rounded-r-full shadow-[4px_0_15px_rgba(0,210,255,0.8)]"
                      />
                    )}

                    {/* Tooltip */}
                    <div className="absolute left-[70px] px-3.5 py-2 bg-slate-900/95 backdrop-blur-xl rounded-xl text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.6)] z-50 flex items-center gap-2">
                      <span className="text-white">{account.name}</span>
                      {!isEnabled && (
                        <span className="text-[10px] text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
                          Sleeping
                        </span>
                      )}
                    </div>
                  </motion.div>
                )
              })}

              {/* Add Account Button */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAdding(true)}
                title="Add New Telegram Account"
                className="w-14 h-14 mx-auto rounded-[20px] bg-white/[0.03] border border-dashed border-white/15 flex items-center justify-center text-slate-500 hover:text-[#00D2FF] hover:border-[#00D2FF]/50 hover:bg-[#00D2FF]/10 transition-all duration-300 group"
              >
                <Plus
                  size={24}
                  className="group-hover:rotate-90 transition-transform duration-300"
                />
              </motion.button>
            </div>

            {/* Sidebar Bottom: Settings */}
            <div
              className="mt-auto space-y-4 pb-2 shrink-0"
              style={{ WebkitAppRegion: 'no-drag' } as any}
            >
              <motion.button
                whileHover={{ rotate: 45, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsSettingsOpen(true)}
                title="Application Settings"
                className={cn(
                  'w-12 h-12 rounded-[18px] flex items-center justify-center transition-all duration-300',
                  isSettingsOpen
                    ? 'bg-gradient-to-r from-[#00D2FF] via-[#24A1DE] to-[#6366F1] text-white shadow-[0_0_20px_rgba(36,161,222,0.5)]'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10'
                )}
              >
                <Settings size={22} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative bg-transparent min-w-0">
        {/* Top Bar */}
        <div
          className="glass-topbar h-[68px] flex items-center justify-between pl-6 pr-[140px] z-10 shrink-0"
          style={{ WebkitAppRegion: 'drag' } as any}
        >
          {/* Left: Sidebar Toggle & Active Account Info */}
          <div className="flex items-center gap-4" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <button
              onClick={handleToggleSidebar}
              className="p-2.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 border border-white/10 hover:border-white/20"
              title={isSidebarVisible ? 'Collapse Sidebar (Full Width)' : 'Expand Sidebar'}
            >
              {isSidebarVisible ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
            </button>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                {activeAccount ? (
                  <motion.div
                    key={activeAccount.id}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2.5"
                  >
                    <button
                      onClick={() => handleSwitch(null)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] text-xs font-semibold text-slate-300 hover:text-white transition-all border border-white/10 hover:border-[#00D2FF]/40 shadow-sm group"
                      title="Back to Account Selection Hub"
                    >
                      <LayoutGrid
                        size={13}
                        className="text-[#00D2FF] group-hover:scale-110 transition-transform"
                      />
                      <span>All Accounts</span>
                    </button>
                    <span className="text-white/20 text-xs">/</span>
                    <span className="bg-gradient-to-r from-white via-cyan-100 to-indigo-200 bg-clip-text text-transparent font-black text-[17px]">
                      {activeAccount.name}
                    </span>
                    <button
                      onClick={() => setEditingAccount(activeAccount)}
                      className="p-1 rounded-lg text-slate-400 hover:text-[#00D2FF] hover:bg-white/10 transition-colors"
                      title="Edit Account & RAM Saver"
                    >
                      <Edit3 size={14} />
                    </button>
                    {activeAccount.isEnabled !== false ? (
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-300 bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.25)] font-semibold">
                        Sleeping
                      </span>
                    )}
                  </motion.div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#00D2FF]/20 to-[#6366F1]/20 border border-[#00D2FF]/30 flex items-center justify-center text-cyan-300">
                      <LayoutGrid size={15} />
                    </div>
                    <span className="bg-gradient-to-r from-white via-cyan-100 to-indigo-200 bg-clip-text text-transparent font-black text-[16px]">
                      Account Selection Hub
                    </span>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">
                {activeAccount
                  ? activeAccount.isEnabled !== false
                    ? 'Connected & Syncing'
                    : 'Session Paused (RAM Saved)'
                  : `Default Mode • ${accounts.length} ${accounts.length === 1 ? 'Account' : 'Accounts'} Available`}
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-5" style={{ WebkitAppRegion: 'no-drag' } as any}>
            {/* Search Accounts */}
            <div className="relative group hidden md:block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00D2FF] transition-colors"
                size={16}
              />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/[0.04] border border-white/10 rounded-full py-2 pl-10 pr-4 text-xs w-48 focus:outline-none focus:bg-white/[0.08] focus:border-[#00D2FF]/50 focus:ring-2 focus:ring-[#00D2FF]/20 transition-all text-white placeholder:text-slate-500 shadow-inner"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              {activeAccount && (
                <button
                  onClick={() => setEditingAccount(activeAccount)}
                  className="p-2.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
                  title="Account Settings & Profile"
                >
                  <Settings size={18} />
                </button>
              )}
            </div>

            <div className="h-6 w-[1px] bg-white/10 mx-0.5" />

            {/* Profile Avatar / Indicator */}
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => {
                if (activeAccount) {
                  setEditingAccount(activeAccount)
                } else {
                  handleSwitch(null)
                }
              }}
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold leading-tight group-hover:text-[#00D2FF] transition-colors">
                  {activeAccount ? activeAccount.name : 'Workspace Hub'}
                </p>
                <p className="text-[10px] text-slate-400 uppercase tracking-tighter">
                  {accounts.length} {accounts.length === 1 ? 'Account' : 'Accounts'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-[#00D2FF]/20 to-[#6366F1]/20 flex items-center justify-center border border-white/15 shadow-lg overflow-hidden shrink-0 ring-1 ring-white/10 group-hover:ring-[#00D2FF]/50 transition-all">
                {activeAccount?.avatar ? (
                  <img
                    src={activeAccount.avatar}
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <LayoutGrid size={18} className="text-cyan-200" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* View Container: Electron WebContentsView is rendered directly over this bounding box */}
        <div className="flex-1 relative overflow-hidden" id="view-container">
          <AnimatePresence mode="wait">
            {!activeAccountId ? (
              accounts.length === 0 ? (
                /* Empty state - First account hero */
                <motion.div
                  key="empty-welcome"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="w-full h-full flex flex-col items-center justify-center p-12 text-center"
                >
                  <div className="relative mb-8">
                    <motion.div
                      animate={{
                        y: [0, -12, 0],
                        rotate: [0, 4, -4, 0]
                      }}
                      transition={{
                        duration: 4.5,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                      className="w-36 h-36 rounded-[38px] bg-gradient-to-br from-[#00D2FF]/25 via-[#24A1DE]/20 to-[#8B5CF6]/25 flex items-center justify-center backdrop-blur-2xl border border-white/20 shadow-[0_0_60px_rgba(0,210,255,0.25)]"
                    >
                      <Send
                        size={60}
                        className="text-[#00D2FF] drop-shadow-[0_0_20px_rgba(0,210,255,0.7)]"
                      />
                    </motion.div>
                    <div className="absolute -bottom-2 -right-2 w-11 h-11 rounded-2xl bg-slate-900 border border-white/15 flex items-center justify-center shadow-xl">
                      <Sparkles size={20} className="text-cyan-300" />
                    </div>
                  </div>

                  <h2 className="text-3xl font-black mb-3 bg-gradient-to-r from-white via-cyan-100 to-indigo-200 bg-clip-text text-transparent">
                    Welcome to Telegram-Parallel
                  </h2>
                  <p className="text-slate-400 max-w-md mx-auto leading-relaxed text-sm">
                    Run and manage multiple isolated Telegram accounts in one sleek, lightweight
                    desktop window.
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsAdding(true)}
                    className="mt-8 px-9 py-4 rounded-2xl bg-gradient-to-r from-[#00D2FF] via-[#24A1DE] to-[#6366F1] text-white font-black text-sm shadow-[0_8px_30px_rgba(36,161,222,0.4)] hover:shadow-[0_12px_36px_rgba(0,210,255,0.5)] transition-all flex items-center gap-3 active:scale-95"
                  >
                    <Plus size={20} />
                    Add Your First Account
                  </motion.button>
                </motion.div>
              ) : (
                /* Account Selection Hub Dashboard */
                <motion.div
                  key="account-hub"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full overflow-y-auto px-8 py-10 lg:px-14 lg:py-12 flex flex-col no-scrollbar"
                >
                  <div className="max-w-6xl w-full mx-auto space-y-10">
                    {/* Header Banner */}
                    <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold tracking-wider uppercase mb-3 shadow-[0_0_20px_rgba(0,210,255,0.2)]">
                          <Sparkles size={14} className="text-cyan-400" />
                          <span>Isolated Multi-Session Hub</span>
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-white via-cyan-100 to-indigo-200 bg-clip-text text-transparent tracking-tight">
                          Select an Account
                        </h2>
                        <p className="text-slate-400 text-sm mt-2 max-w-xl">
                          Select a Telegram account to open its isolated workspace. Sessions remain
                          logged in across app restarts.
                        </p>
                      </div>

                      {/* Header Actions & Quick Stats */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/10 text-xs font-semibold text-slate-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                          <span>{accounts.filter((a) => a.isEnabled !== false).length} Active</span>
                          {accounts.some((a) => a.isEnabled === false) && (
                            <>
                              <span className="text-white/20">|</span>
                              <Moon size={12} className="text-amber-300" />
                              <span className="text-amber-300">
                                {accounts.filter((a) => a.isEnabled === false).length} Sleeping
                              </span>
                            </>
                          )}
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setIsAdding(true)}
                          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#00D2FF] via-[#24A1DE] to-[#6366F1] text-white font-bold text-xs shadow-[0_4px_20px_rgba(36,161,222,0.4)] hover:shadow-[0_6px_25px_rgba(0,210,255,0.5)] transition-all flex items-center gap-2"
                        >
                          <Plus size={16} />
                          <span>Add Account</span>
                        </motion.button>
                      </div>
                    </div>

                    {/* Account Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredAccounts.map((account) => {
                        const isEnabled = account.isEnabled !== false
                        return (
                          <motion.div
                            key={account.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -6, transition: { duration: 0.2 } }}
                            onClick={() => handleSwitch(account.id)}
                            className="group relative rounded-3xl p-6 bg-gradient-to-b from-white/[0.06] to-white/[0.015] border border-white/10 hover:border-[#00D2FF]/50 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.35)] hover:shadow-[0_18px_50px_rgba(0,210,255,0.22)] backdrop-blur-2xl cursor-pointer"
                          >
                            {/* Hover Aurora Top Light Bar */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00D2FF] via-[#24A1DE] to-[#8B5CF6] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {/* Card Top Section */}
                            <div>
                              <div className="flex items-start justify-between gap-4 mb-5">
                                {/* Squircle Avatar */}
                                <div className="relative">
                                  <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-[#00D2FF]/20 via-[#24A1DE]/30 to-[#6366F1]/30 flex items-center justify-center border border-white/15 shadow-lg overflow-hidden shrink-0 group-hover:ring-2 group-hover:ring-[#00D2FF]/50 transition-all">
                                    {account.avatar ? (
                                      <img
                                        src={account.avatar}
                                        alt={account.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-2xl font-black uppercase bg-gradient-to-tr from-white via-cyan-100 to-indigo-200 bg-clip-text text-transparent">
                                        {account.name[0]}
                                      </span>
                                    )}
                                  </div>

                                  {/* Status indicator on avatar */}
                                  {isEnabled ? (
                                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-400 border-2 border-[#0a0e18] shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                                    </span>
                                  ) : (
                                    <span
                                      className="absolute -bottom-1 -right-1 bg-[#07090e] border border-amber-500/60 p-1 rounded-full text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                                      title="Sleeping"
                                    >
                                      <Moon size={11} />
                                    </span>
                                  )}
                                </div>

                                {/* Quick Action Icons */}
                                <div
                                  className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {account.unreadCount > 0 && isEnabled && (
                                    <span className="mr-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-[0_0_12px_rgba(244,63,94,0.7)]">
                                      {account.unreadCount} unread
                                    </span>
                                  )}
                                  <button
                                    onClick={() => setEditingAccount(account)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                                    title="Edit Profile & RAM Saver"
                                  >
                                    <Edit3 size={15} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleToggleAccountStatus(account.id, !isEnabled)
                                    }
                                    className={cn(
                                      'p-2 rounded-xl transition-colors',
                                      isEnabled
                                        ? 'text-slate-400 hover:text-amber-300 hover:bg-white/10'
                                        : 'text-amber-400 hover:text-emerald-300 hover:bg-white/10'
                                    )}
                                    title={
                                      isEnabled ? 'Put to sleep (RAM Saver)' : 'Wake up account'
                                    }
                                  >
                                    <Power size={15} />
                                  </button>
                                  <button
                                    onClick={(e) => handleDelete(account.id, e)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
                                    title="Delete Account"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>

                              {/* Account Info */}
                              <h3 className="text-xl font-bold text-white group-hover:text-[#00D2FF] transition-colors truncate">
                                {account.name}
                              </h3>

                              <div className="mt-3 flex items-center gap-2">
                                {isEnabled ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Online & Ready
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                                    <Moon size={11} />
                                    Sleeping (0 MB RAM)
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Card Launch Button */}
                            <button
                              onClick={() => handleSwitch(account.id)}
                              className="w-full mt-6 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#00D2FF] via-[#24A1DE] to-[#6366F1] text-white font-bold text-xs shadow-[0_4px_20px_rgba(36,161,222,0.3)] group-hover:shadow-[0_8px_30px_rgba(0,210,255,0.5)] transition-all flex items-center justify-center gap-2 group-hover:gap-3"
                            >
                              <span>Open Session</span>
                              <ArrowUpRight
                                size={16}
                                className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                              />
                            </button>
                          </motion.div>
                        )
                      })}

                      {/* "+ Add Account" Card in Grid */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -6, transition: { duration: 0.2 } }}
                        onClick={() => setIsAdding(true)}
                        className="rounded-3xl p-6 border-2 border-dashed border-white/15 hover:border-cyan-400/60 hover:bg-white/[0.03] transition-all duration-300 flex flex-col items-center justify-center text-center group cursor-pointer min-h-[260px] backdrop-blur-2xl"
                      >
                        <div className="w-16 h-16 rounded-[22px] bg-gradient-to-tr from-[#00D2FF]/15 via-[#24A1DE]/25 to-[#8B5CF6]/15 border border-white/15 flex items-center justify-center text-cyan-300 group-hover:scale-110 group-hover:rotate-90 transition-all duration-300 shadow-[0_0_25px_rgba(0,210,255,0.15)] mb-4">
                          <Plus size={28} />
                        </div>
                        <h4 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                          Connect New Account
                        </h4>
                        <p className="text-xs text-slate-400 max-w-[210px] mt-1.5 leading-relaxed">
                          Add an additional isolated Telegram account with dedicated session
                          cookies.
                        </p>
                      </motion.div>
                    </div>

                    {/* Bottom Feature Badges */}
                    <div className="pt-4 pb-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-xs text-slate-400 text-center">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-cyan-400" />
                        <span>Zero session collisions via strict partition sandboxing</span>
                      </div>
                      <span className="hidden sm:inline text-white/15">•</span>
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-indigo-400" />
                        <span>
                          Background notification listeners active across all enabled accounts
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            ) : (
              <div className="w-full h-full bg-[#07090e]/50" />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Account Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative glass-modal p-8 rounded-[36px] w-full max-w-md z-10 text-white"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#00D2FF]/20 to-[#6366F1]/20 flex items-center justify-center border border-[#00D2FF]/30 shadow-lg shadow-[#00D2FF]/20">
                  <Plus size={24} className="text-[#00D2FF]" />
                </div>
                <div>
                  <h3 className="text-xl font-black bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                    New Account
                  </h3>
                  <p className="text-xs text-slate-400">Give your session a memorable alias</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1 mb-2 block">
                    Account Alias
                  </label>
                  <input
                    autoFocus
                    type="text"
                    placeholder="e.g. Work, Personal, Support"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-[#00D2FF]/50 focus:ring-2 focus:ring-[#00D2FF]/20 focus:bg-white/[0.08] transition-all placeholder:text-slate-500 font-medium text-white text-sm"
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold transition-all text-sm border border-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={!newName.trim()}
                    className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-[#00D2FF] via-[#24A1DE] to-[#6366F1] hover:from-[#00D2FF]/90 hover:to-[#6366F1]/90 disabled:opacity-50 text-white font-black transition-all shadow-lg shadow-[#24A1DE]/30 text-sm active:scale-95"
                  >
                    Initialize
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* App Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative glass-modal p-8 rounded-[36px] w-full max-w-lg z-10 text-white"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black bg-gradient-to-r from-white via-cyan-100 to-indigo-200 bg-clip-text text-transparent">
                    App Settings
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">System preferences & behavior</p>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5">
                {/* Session Persistence Card */}
                <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white">Session Persistence</h4>
                    <p className="text-xs text-slate-400">
                      Keep Telegram sessions logged in after reboot
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-extrabold text-[#00D2FF] tracking-wider bg-[#00D2FF]/10 px-3 py-1 rounded-full border border-[#00D2FF]/30 shadow-[0_0_10px_rgba(0,210,255,0.2)]">
                      Active
                    </span>
                  </div>
                </div>

                {/* Launch at Startup Switch */}
                <div
                  className="glass-card p-5 rounded-2xl flex items-center justify-between cursor-pointer select-none"
                  onClick={handleToggleStartup}
                >
                  <div>
                    <h4 className="font-bold text-sm text-white">Launch at Startup</h4>
                    <p className="text-xs text-slate-400">
                      Open TG-Parallel automatically when Windows starts
                    </p>
                  </div>
                  <div
                    className={cn(
                      'w-13 h-7 rounded-full relative p-1 transition-all duration-300',
                      launchAtStartup
                        ? 'bg-gradient-to-r from-[#00D2FF] to-[#6366F1] shadow-[0_0_15px_rgba(0,210,255,0.4)]'
                        : 'bg-white/10'
                    )}
                  >
                    <motion.div
                      animate={{ x: launchAtStartup ? 24 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className={cn(
                        'w-5 h-5 rounded-full shadow-md transition-colors',
                        launchAtStartup ? 'bg-white' : 'bg-slate-400'
                      )}
                    />
                  </div>
                </div>

                {/* Background Tray Running */}
                <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white">Minimize to System Tray</h4>
                    <p className="text-xs text-slate-400">
                      Closing the window keeps sessions alive in tray
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-extrabold text-emerald-400 tracking-wider bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.2)]">
                      Enabled
                    </span>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#00D2FF] via-[#24A1DE] to-[#6366F1] text-white font-black text-sm shadow-lg shadow-[#24A1DE]/30 hover:shadow-[#00D2FF]/40 transition-all active:scale-95"
                  >
                    Save & Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
