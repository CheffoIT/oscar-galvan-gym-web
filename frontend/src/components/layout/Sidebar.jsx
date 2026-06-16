import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useGymConfig } from '../../contexts/GymConfigContext'

const adminLinks = [
  { path: '/admin',                icon: '📊', label: 'Dashboard' },
  { path: '/admin/alumnos',        icon: '👥', label: 'Alumnos' },
  { path: '/admin/entrenadores',   icon: '🏋️',  label: 'Entrenadores' },
  { path: '/admin/rutinas',        icon: '📋', label: 'Rutinas' },
  { path: '/admin/pagos',          icon: '💰', label: 'Pagos' },
  { path: '/admin/configuracion',  icon: '⚙️',  label: 'Configuración' },
  { path: '/admin/whatsapp',       icon: '💬', label: 'WhatsApp' },
]

const entrenadorLinks = [
  { path: '/entrenador', icon: '📊', label: 'Dashboard' },
]

const alumnoLinks = [
  { path: '/alumno', icon: '🏠', label: 'Mi panel' },
]

export default function Sidebar({ mobileOpen = false, onClose }) {
  const location = useLocation()
  const { user, role, logout } = useAuth()
  const { config } = useGymConfig()
  const logoUrl = config?.logo_url || null

  const links = role === 'admin' ? adminLinks
              : role === 'entrenador' ? entrenadorLinks
              : alumnoLinks

  const isActive = (path) =>
    path === '/admin' || path === '/entrenador' || path === '/alumno'
      ? location.pathname === path
      : location.pathname.startsWith(path)

  return (
    <>
      {/* Overlay mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-gym-dark border-r border-gym-border
        flex flex-col z-40 transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gym-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gym-purple rounded-lg flex items-center justify-center text-white font-display text-lg overflow-hidden">
              {logoUrl
                ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                : 'G'}
            </div>
            <span className="font-display text-lg tracking-wider text-gym-white">
              OG <span className="text-gym-yellow">GYM</span>
            </span>
          </Link>
          <button onClick={onClose} className="lg:hidden text-gym-gray hover:text-white text-xl">×</button>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-gym-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gym-purple/30 border border-gym-purple/50 rounded-full flex items-center justify-center text-gym-purplel font-bold text-sm">
              {user?.nombre?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-gym-white text-sm font-medium truncate">{user?.nombre || 'Usuario'}</p>
              <p className="text-gym-gray text-xs capitalize">{role}</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map(({ path, icon, label }) => (
            <Link
              key={path}
              to={path}
              onClick={onClose}
              className={`
                flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-200
                ${isActive(path)
                  ? 'bg-gym-purple/20 border border-gym-purple/30 text-gym-white'
                  : 'text-gym-gray hover:text-gym-white hover:bg-gym-border'}
              `}
            >
              <span className="text-base">{icon}</span>
              {label}
              {isActive(path) && <span className="ml-auto w-1.5 h-1.5 bg-gym-yellow rounded-full" />}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-gym-border space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gym-gray hover:text-gym-white hover:bg-gym-border transition-all"
          >
            <span>🌐</span> Ver sitio público
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gym-gray hover:text-red-400 hover:bg-red-900/20 transition-all"
          >
            <span>🚪</span> Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
