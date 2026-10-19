import { useState, useCallback } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, ZoomIn } from 'lucide-react'
import { getCroppedImg } from '../utils/cropImage'

interface AvatarCropperModalProps {
  isOpen: boolean
  imageSrc: string | null
  onClose: () => void
  onSave: (dataUrl: string) => Promise<void> | void
}

export function AvatarCropperModal({ isOpen, imageSrc, onClose, onSave }: AvatarCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    setIsProcessing(true)
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels)
      await onSave(croppedImage)
      handleClose()
    } catch (e: any) {
      console.error('Error cropping avatar:', e)
      alert(`Error processing photo: ${e?.message || e}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    onClose()
    setZoom(1)
    setCrop({ x: 0, y: 0 })
    setCroppedAreaPixels(null)
  }

  return (
    <AnimatePresence>
      {isOpen && imageSrc && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            className="relative w-full max-w-md glass-modal rounded-[36px] flex flex-col overflow-hidden z-10"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black bg-gradient-to-r from-white via-cyan-100 to-indigo-200 bg-clip-text text-transparent">
                  Crop Profile Picture
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Drag to reposition, adjust zoom slider
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative w-full h-[320px] bg-black/90">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="p-6 bg-black/30 flex flex-col gap-5 border-t border-white/5">
              <div className="flex items-center gap-3">
                <ZoomIn size={16} className="text-[#00D2FF]" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Zoom
                </span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.05}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-[#00D2FF] cursor-pointer"
                />
                <span className="text-xs text-slate-400 font-mono w-8 text-right font-bold">
                  {zoom.toFixed(1)}x
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-sm transition-all border border-white/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isProcessing}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#00D2FF] via-[#24A1DE] to-[#6366F1] hover:from-[#00D2FF]/90 hover:to-[#6366F1]/90 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-lg shadow-[#24A1DE]/30 flex items-center justify-center gap-2 active:scale-95"
                >
                  <Check size={18} />
                  {isProcessing ? 'Saving...' : 'Apply Photo'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
