import { useEffect, useState } from 'react'
import { Plus, Send, Settings, User, MessageSquare, Bell, BellOff, LogOut, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface Account {
  id: string
  name: string
  avatar?: string
  unreadCount: number
}

function App() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => {
    window.electron.ipcRenderer.send('set-view-visibility', !(isAdding || isSettingsOpen))
  }, [isAdding, isSettingsOpen])

  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    // Initial fetch
    window.electron.ipcRenderer.invoke('get-accounts').then((loadedAccounts: Account[]) => {
      setAccounts(loadedAccounts)
      if (loadedAccounts.length > 0) {
        handleSwitch(loadedAccounts[0].id)
      }
    })

    // Listen for updates
    const removeListener = window.electron.ipcRenderer.on('accounts-updated', (_, updatedAccounts: Account[]) => {
      setAccounts(updatedAccounts)
    })

    // Sync bounds
    const container = document.getElementById('view-container')
    if (container) {
      const observer = new ResizeObserver(() => {
        const rect = container.getBoundingClientRect()
        window.electron.ipcRenderer.send('update-view-bounds', {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        })
      })
      observer.observe(container)
      return () => {
        removeListener()
        observer.disconnect()
      }
    }

    return () => {
      removeListener()
    }
  }, [])

  const handleSwitch = (id: string) => {
    setActiveAccountId(id)
    window.electron.ipcRenderer.send('switch-account', id)
  }

  const handleAdd = () => {
    if (!newName) return
    const id = Math.random().toString(36).substr(2, 9)
    const newAccount: Account = { id, name: newName, unreadCount: 0 }
    window.electron.ipcRenderer.send('add-account', newAccount)
    setNewName('')
    setIsAdding(false)
    handleSwitch(id)
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Delete account "${accounts.find(a => a.id === id)?.name}"?`)) {
      window.electron.ipcRenderer.send('delete-account', id)
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden text-slate-100 bg-mesh selection:bg-telegram-blue/30">
      {/* Sidebar */}
      <div className="glass-sidebar flex w-[88px] flex-col items-center py-6 space-y-6 z-20" style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="mb-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <motion.div 
            whileHover={{ scale: 1.1, rotate: -5 }}
            className="w-14 h-14 rounded-[22px] bg-gradient-to-tr from-telegram-blue to-cyan-400 flex items-center justify-center shadow-2xl shadow-telegram-blue/30 cursor-pointer"
          >
            <Send size={28} className="text-white fill-white/10" />
          </motion.div>
        </div>

        <div className="flex-1 w-full overflow-y-auto no-scrollbar space-y-4 px-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {accounts.map((account) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSwitch(account.id)}
              className={cn(
                "relative group cursor-pointer w-14 h-14 mx-auto rounded-2xl flex items-center justify-center transition-all duration-500 overflow-visible",
                activeAccountId === account.id 
                  ? "bg-gradient-to-br from-telegram-blue/80 to-telegram-blue shadow-[0_8px_20px_rgba(36,161,222,0.3)]" 
                  : "bg-white/5 hover:bg-white/10 border border-white/5"
              )}
            >
              {account.avatar ? (
                <img src={account.avatar} className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <span className={cn(
                  "text-xl font-semibold uppercase tracking-wider",
                  activeAccountId === account.id ? "text-white" : "text-slate-400"
                )}>
                  {account.name[0]}
                </span>
              )}
              
              {account.unreadCount > 0 && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-[#1e293b] min-w-[20px] text-center shadow-lg"
                >
                  {account.unreadCount > 99 ? '99+' : account.unreadCount}
                </motion.div>
              )}

              {/* Active Indicator */}
              {activeAccountId === account.id && (
                <motion.div 
                  layoutId="active-indicator"
                  className="absolute -left-3 w-1.5 h-8 bg-telegram-blue rounded-r-full shadow-[4px_0_12px_rgba(36,161,222,0.5)]"
                />
              )}

              {/* Tooltip */}
              <div className="absolute left-[70px] px-3 py-2 bg-slate-800/90 backdrop-blur-md rounded-xl text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none border border-white/10 shadow-xl z-50">
                {account.name}
              </div>
            </motion.div>
          ))}

          <motion.button
            whileHover={{ scale: 1.08, backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAdding(true)}
            className="w-14 h-14 mx-auto rounded-2xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center text-slate-500 hover:text-telegram-blue transition-all duration-300 group"
          >
            <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
          </motion.button>
        </div>

        <div className="mt-auto space-y-4 pb-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <motion.button 
            whileHover={{ rotate: 45, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsSettingsOpen(true)}
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
              isSettingsOpen ? "bg-telegram-blue text-white" : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
            )}
          >
            <Settings size={22} />
          </motion.button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative bg-transparent">
        {/* Top Bar */}
        <div className="glass-topbar h-[68px] flex items-center justify-between pl-8 pr-[140px] z-10" style={{ WebkitAppRegion: 'drag' } as any}>
          <div className="flex flex-col">
            <h1 className="text-[17px] font-bold tracking-tight">
              {activeAccountId ? (
                <motion.span 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3"
                >
                  {accounts.find(a => a.id === activeAccountId)?.name}
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                </motion.span>
              ) : (
                <span className="text-slate-500">No account selected</span>
              )}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-widest mt-0.5">
              {activeAccountId ? 'Connected and Syncing' : 'Awaiting Connection'}
            </p>
          </div>

          <div className="flex items-center gap-6" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <div className="relative group hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-telegram-blue transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search conversations..." 
                className="bg-white/5 border border-white/5 rounded-full py-2 pl-10 pr-4 text-sm w-48 focus:outline-none focus:bg-white/10 focus:border-telegram-blue/30 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={cn(
                  "p-2 rounded-xl transition-all duration-300 relative",
                  notificationsEnabled ? "text-slate-500 hover:text-slate-200" : "text-red-400 bg-red-400/10"
                )}
                title={notificationsEnabled ? "Mute Notifications" : "Unmute Notifications"}
              >
                {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
                {notificationsEnabled && <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-telegram-blue rounded-full"></span>}
              </button>
              
              {activeAccountId && (
                <motion.button 
                  whileHover={{ scale: 1.1, color: '#f87171' }}
                  onClick={(e) => handleDelete(activeAccountId, e)}
                  className="p-2 text-slate-500 transition-colors"
                  title="Remove Account"
                >
                  <LogOut size={20} />
                </motion.button>
              )}
            </div>

            <div className="h-8 w-[1px] bg-white/5 mx-1" />
            
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-tight group-hover:text-telegram-blue transition-colors">Admin</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Superuser</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-white/5 shadow-lg overflow-hidden">
                <User size={20} className="text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* View Container */}
        <div className="flex-1 relative overflow-hidden" id="view-container">
          <AnimatePresence mode="wait">
            {!activeAccountId ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="w-full h-full flex flex-col items-center justify-center p-12 text-center"
              >
                <div className="relative mb-8">
                  <motion.div 
                    animate={{ 
                      y: [0, -15, 0],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 4, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="w-32 h-32 rounded-full bg-gradient-to-br from-telegram-blue/20 to-cyan-500/10 flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-[0_0_50px_rgba(36,161,222,0.15)]"
                  >
                    <Send size={56} className="text-telegram-blue drop-shadow-[0_0_15px_rgba(36,161,222,0.5)]" />
                  </motion.div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center shadow-xl">
                    <MessageSquare size={18} className="text-slate-400" />
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
                  Welcome to TG-Parallel
                </h2>
                <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
                  The ultimate desktop manager for multiple Telegram accounts. 
                  Add an account to get started with complete session isolation.
                </p>
                
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(36,161,222,0.3)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsAdding(true)}
                  className="mt-10 px-8 py-3.5 rounded-2xl bg-telegram-blue text-white font-bold text-sm shadow-xl shadow-telegram-blue/20 hover:bg-telegram-blue/90 transition-all flex items-center gap-3"
                >
                  <Plus size={20} />
                  Add Your First Account
                </motion.button>
              </motion.div>
            ) : (
              <div className="w-full h-full bg-slate-900/50" />
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
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-slate-900 border border-white/10 p-8 rounded-[32px] w-full max-w-md shadow-[0_32px_64px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-telegram-blue/10 flex items-center justify-center border border-telegram-blue/20">
                  <Plus size={24} className="text-telegram-blue" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">New Account</h3>
                  <p className="text-xs text-slate-500">Give your session a memorable name</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1 mb-2 block">Account Alias</label>
                  <input
                    autoFocus
                    type="text"
                    placeholder="e.g. Work, Personal, Support"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-telegram-blue/30 focus:bg-white/10 transition-all placeholder:text-slate-600 font-medium"
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => setIsAdding(false)}
                    className="flex-1 px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={!newName.trim()}
                    className="flex-1 px-6 py-4 rounded-2xl bg-telegram-blue hover:bg-telegram-blue/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-all shadow-lg shadow-telegram-blue/20"
                  >
                    Initialize
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-slate-900 border border-white/10 p-8 rounded-[32px] w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold">App Settings</h3>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <LogOut size={20} className="rotate-180" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="font-bold">Session Persistence</h4>
                    <p className="text-xs text-slate-500">Keep accounts logged in after restart</p>
                  </div>
                  <div className="w-12 h-6 bg-telegram-blue rounded-full relative p-1 cursor-pointer">
                    <div className="w-4 h-4 bg-white rounded-full absolute right-1 shadow-sm"></div>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="font-bold">Launch at Startup</h4>
                    <p className="text-xs text-slate-500">Open TG-Parallel when Windows starts</p>
                  </div>
                  <div className="w-12 h-6 bg-white/10 rounded-full relative p-1 cursor-pointer">
                    <div className="w-4 h-4 bg-slate-400 rounded-full absolute left-1 shadow-sm"></div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button 
                    onClick={() => setIsSettingsOpen(false)}
                    className="px-8 py-3 rounded-xl bg-telegram-blue text-white font-bold"
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
