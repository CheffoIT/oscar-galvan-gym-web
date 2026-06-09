import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className={`relative z-10 w-full ${maxWidth} bg-gym-card border border-gym-border rounded-2xl shadow-gym overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gym-border">
          <h3 className="font-display text-xl tracking-wider text-gym-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gym-gray hover:text-gym-white transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>
        {/* Contenido */}
        <div className="px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  )
}
