import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useGymConfig } from '../../contexts/GymConfigContext'

export default function Navbar({ publicMode = false }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, role, logout }  = useAuth()
  const { config } = useGymConfig()
  const logoUrl = config?.logo_url || null
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getDashboardPath = () => {
    if (role === 'admin')      return '/admin'
    if (role === 'entrenador') return '/entrenador'
    if (role === 'alumno')     return '/alumno'
    return '/login'
  }

  // Logo click: si ya estamos en "/" hace scroll al top; si no, navega a "/"
  const handleLogoClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gym-black/95 backdrop-blur-md border-b border-gym-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gym-purple rounded-lg flex items-center justify-center text-white font-display text-lg overflow-hidden">
              {logoUrl
                ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                : 'G'}
            </div>
            <span className="font-display text-xl tracking-wider text-gym-white hidden sm:block">
              OSCAR GALVAN <span className="text-gym-yellow">GYM</span>
            </span>
          </Link>

          {/* Links desktop */}
          {publicMode && (
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gym-gray">
              <a href="#servicios"  className="hover:text-gym-yellow transition-colors">Servicios</a>
              <a href="#horarios"   className="hover:text-gym-yellow transition-colors">Horarios</a>
              <a href="#planes"     className="hover:text-gym-yellow transition-colors">Planes</a>
              <a href="#caminatas"  className="hover:text-gym-yellow transition-colors">Caminatas</a>
              <a href="#contacto"   className="hover:text-gym-yellow transition-colors">Contacto</a>
            </div>
          )}

          {/* Derecha */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden sm:block text-xs text-gym-gray">
                  Hola, <span className="text-gym-white font-medium">{user.nombre}</span>
                  <span className="ml-1 px-1.5 py-0.5 bg-gym-purple/30 text-gym-purplel rounded text-xs">
                    {role}
                  </span>
                </span>
                <Link
                  to={getDashboardPath()}
                  className="hidden sm:block btn-secondary text-xs px-3 py-1.5 rounded-lg border border-gym-purple text-gym-purplel hover:bg-gym-purple/20 transition-all"
                >
                  Panel
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gym-gray hover:text-red-400 transition-colors text-xs px-3 py-1.5 rounded-lg hover:bg-red-900/20"
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="hidden sm:block border border-gym-purple text-gym-purplel font-bold text-sm px-4 py-2 rounded-lg hover:bg-gym-purple/20 transition-all"
                >
                  Crear cuenta
                </Link>
                <Link
                  to="/login"
                  className="bg-gym-yellow text-gym-black font-bold text-sm px-4 py-2 rounded-lg hover:bg-gym-yellowl transition-all"
                >
                  Ingresar
                </Link>
              </>
            )}

            {/* Hamburguesa mobile */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-gym-gray hover:text-gym-white p-1"
            >
              <div className={`w-5 h-0.5 bg-current transition-all ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <div className={`w-5 h-0.5 bg-current my-1 ${menuOpen ? 'opacity-0' : ''}`} />
              <div className={`w-5 h-0.5 bg-current transition-all ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && publicMode && (
        <div className="md:hidden bg-gym-dark border-t border-gym-border px-4 py-4 space-y-3">
          <a href="#servicios" onClick={() => setMenuOpen(false)} className="block text-gym-gray hover:text-gym-yellow py-2">Servicios</a>
          <a href="#horarios"  onClick={() => setMenuOpen(false)} className="block text-gym-gray hover:text-gym-yellow py-2">Horarios</a>
          <a href="#planes"    onClick={() => setMenuOpen(false)} className="block text-gym-gray hover:text-gym-yellow py-2">Planes</a>
          <a href="#caminatas" onClick={() => setMenuOpen(false)} className="block text-gym-gray hover:text-gym-yellow py-2">Caminatas</a>
          <a href="#contacto"  onClick={() => setMenuOpen(false)} 