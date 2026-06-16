/**
 * Sistema de notificaciones (Toast) global.
 * Se monta una vez en el árbol de componentes y escucha el evento 'api:error'.
 * También puede usarse programáticamente con el hook useToast().
 *
 * Diseño: oscuro, borde rojo/amarillo, coherente con la estética del gimnasio.
 */
import { useState, useEffect, useCallback } from 'react'

let toastCount = 0

// ─── Provider global ──────────────────────────────────────────────────────
export function ToastProvider() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'error') => {
    const id = ++toastCount
    setToasts(prev => {
      // Evitar duplicados del mismo mensaje
      if (prev.some(t => t.message === message)) return prev
      return [...prev, { id, message, type }]
    })
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  // Escuchar eventos globales del apiClient
  useEffect(() => {
    const handler = (e) => addToast(e.detail.message, 'error')
    window.addEventListener('api:error', handler)
    return () => window.removeEventListener('api:error', handler)
  }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          role="alert"
          className={`
            flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg
            animate-slide-in-right
            ${toast.type === 'error'
              ? 'bg-red-950/95 border-red-800/60 text-red-300'
              : toast.type === 'success'
              ? 'bg-green-950/95 border-green-800/60 text-green-300'
              : 'bg-gym-dark/95 border-gym-border text-gym-white'}
          `}
        >
          <span className="shrink-0 text-lg mt-0.5" aria-hidden="true">
            {toast.type === 'error' ? '⚠️' : toast.type === 'success' ? '✅' : 'ℹ️'}
          </span>
          <p className="text-sm flex-1 leading-snug">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity ml-1"
            aria-label="Cerrar notificación"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── Hook programático ────────────────────────────────────────────────────
export function useToast() {
  const toast = useCallback((message, type = 'error') => {
    window.dispatchEvent(new CustomEvent('api:error', { detail: { message, type } }))
  }, [])

  return {
    error:   (msg) => toast(msg, 'error'),
    success: (msg) => toast(msg, 'success'),
    info:    (msg) => toast(msg, 'info'),
  }
}
