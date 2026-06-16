import { useState } from 'react'
import Sidebar from './Sidebar'

export default function DashboardLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gym-black flex">
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-gym-dark/95 backdrop-blur border-b border-gym-border px-4 sm:px-6 h-14 flex items-center gap-4">
          {/* Hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gym-gray hover:text-gym-white p-1"
          >
            <div className="w-5 h-0.5 bg-current mb-1" />
            <div className="w-5 h-0.5 bg-current mb-1" />
            <div className="w-5 h-0.5 bg-current" />
          </button>

          {title && (
            <h1 className="font-display text-xl tracking-wider text-gym-white uppercase">
              {title}
            </h1>
          )}

          {/* Barra de acciones rápidas */}
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:block text-xs text-gym-gray">
              {new Date().toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long' })}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
