import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  const overlayRef = useRef(null)

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const sizeMap = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
    >
      <div className={`w-full ${sizeMap[size]} bg-cream-50 rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slide-up overflow-hidden`}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-cream-200">
            <h3 className="font-display font-semibold text-bark-700 text-lg">{title}</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-cream-200 transition-colors text-bark-400 hover:text-bark-700">
              <X size={20} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto max-h-[85dvh] sm:max-h-[80vh]">
          {children}
        </div>
      </div>
    </div>
  )
}
