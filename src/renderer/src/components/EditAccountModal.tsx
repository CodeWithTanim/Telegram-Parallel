import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Check, Power, Trash2, X } from 'lucide-react'
import { cn } from '../utils/cn'

interface Account {
  id: string
  name: string
  avatar?: string
  hasCustomAvatar?: boolean
  unreadCount: number
  isEnabled?: boolean
}

interface EditAccountModalProps {
  account: Account | null
  isOpen: boolean
  onClose: () => void
  onRename: (id: string, newName: string) => Promise<void> | void
  onChangeAvatar: (id: string) => Promise<void> | void
  onToggleStatus: (id: string, enabled: boolean) => Promise<void> | void
  onDelete: (id: string) => void
}

export function EditAccountModal({
  account,
  isOpen,
  onClose,
  onRename,
  onChangeAvatar,
  onToggleStatus,
  onDelete
}: EditAccountModalProps) {
  const [name, setName] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)

  useEffect(() => {
    if (account) {
      setName(account.name)
    }
  }, [account])

  if (!account) return null

  const isEnabled = account.isEnabled !== false

  const handleSaveName = async () => {
    if (!name.trim() || name === account.name) return
    setIsSavingName(true)
    try {
      await onRename(account.id, name.trim())
    } finally {
      setIsSavingName(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            className="relative w-full max-w-md glass-modal p-8 rounded-[36px] z-10 text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black bg-gradient-to-r from-white via-cyan-100 to-indigo-200 bg-clip-text text-transparent">
                  Account Settings
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Customize profile & manage RAM usage
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Profile Avatar Card */}
            <div className="flex flex-col items-center mb-8">
              <div
                className="relative group cursor-pointer"
                onClick={() => onChangeAvatar(account.id)}
              >
                <div className="w-24 h-24 rounded-[28px] overflow-hidden border border-white/20 shadow-2xl flex items-center justify-center bg-gradient-to-tr from-[#00D2FF]/20 via-[#24A1DE]/30 to-[#8B5CF6]/30 ring-2 ring-[#00D2FF]/30 group-hover:ring-[#00D2FF]/60 transition-all duration-300">
                  {account.avatar ? (
                    <img
                      src={account.avatar}
                      alt={account.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-extrabold text-white uppercase tracking-wider">
                      {account.name.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Camera Overlay */}
                <div className="absolute inset-0 rounded-[28px] bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white backdrop-blur-xs">
                  <Camera
                    size={22}
                    className="text-[#00D2FF] drop-shadow-[0_0_8px_rgba(0,210,255,0.7)]"
                  />
                  <span className="text-[10px] font-bold tracking-wider uppercase">Change</span>
                </div>
              </div>

              <button
                onClick={() => onChangeAvatar(account.id)}
                className="mt-3 text-xs text-[#00D2FF] hover:text-white hover:underline font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Camera size={14} /> Upload & Crop Photo
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-5">
              {/* Account Alias / Name */}
              <div>
                <label className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 ml-1 mb-2 block">
                  Account Alias
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    placeholder="e.g. Work, Personal"
                    className="flex-1 bg-white/[0.05] border border-white/10 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-[#00D2FF]/50 focus:ring-2 focus:ring-[#00D2FF]/20 focus:bg-white/[0.08] transition-all font-medium text-sm text-white placeholder:text-slate-500"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={isSavingName || !name.trim() || name === account.name}
                    className="px-5 py-3.5 bg-gradient-to-r from-[#00D2FF] to-[#24A1DE] hover:from-[#00D2FF]/90 hover:to-[#24A1DE]/90 disabled:opacity-40 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-[#24A1DE]/30 flex items-center justify-center active:scale-95"
                  >
                    <Check size={18} />
                  </button>
                </div>
              </div>

              {/* RAM Saver / Status Switch */}
              <div
                className="glass-card p-5 rounded-2xl flex items-center justify-between cursor-pointer"
                onClick={() => onToggleStatus(account.id, !isEnabled)}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Power
                      size={16}
                      className={isEnabled ? 'text-emerald-400' : 'text-amber-400'}
                    />
                    <h4 className="font-bold text-sm text-white">
                      {isEnabled ? 'Session Active' : 'Session Sleeping (RAM Saver)'}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {isEnabled
                      ? 'Live in memory & syncing messages in background'
                      : 'Freed 400MB RAM while preserving login state'}
                  </p>
                </div>

                <div
                  className={cn(
                    'w-13 h-7 rounded-full relative p-1 transition-all duration-300',
                    isEnabled
                      ? 'bg-gradient-to-r from-[#00D2FF] to-[#6366F1] shadow-[0_0_15px_rgba(0,210,255,0.4)]'
                      : 'bg-white/10'
                  )}
                >
                  <motion.div
                    animate={{ x: isEnabled ? 24 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={cn(
                      'w-5 h-5 rounded-full shadow-md transition-colors',
                      isEnabled ? 'bg-white' : 'bg-slate-400'
                    )}
                  />
                </div>
              </div>

              {/* Danger Zone: Delete */}
              <div className="pt-2 flex items-center justify-between border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onDelete(account.id)
                  }}
                  className="px-4 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors text-xs font-semibold flex items-center gap-2"
                >
                  <Trash2 size={16} /> Delete Account
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all border border-white/10"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
