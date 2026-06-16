import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LandingPage          from '../pages/public/LandingPage'
import LoginPage            from '../pages/public/LoginPage'
import RegisterPage         from '../pages/public/RegisterPage'
import AdminDashboard       from '../pages/admin/AdminDashboard'
import AlumnosPage          from '../pages/admin/AlumnosPage'
import EntrenadoresPage     from '../pages/admin/EntrenadoresPage'
import RutinasPage          from '../pages/admin/RutinasPage'
import PagosPage            from '../pages/admin/PagosPage'
import ConfiguracionPage    from '../pages/admin/ConfiguracionPage'
import WhatsappPage         from '../pages/admin/WhatsappPage'
import EntrenadorDashboard  from '../pages/entrenador/EntrenadorDashboard'
import AlumnoDashboard      from '../pages/alumno/AlumnoDashboard'

// ─── Pantalla de carga ────────────────────────────────────────────────────
function LoadingScreen({ message = 'Verificando sesión...' }) {
  return (
    <div className="min-h-screen bg-gym-black flex flex-col items-center justify-center gap-4">
      {/* Spinner */}
      <div className="w-10 h-10 border-4 border-gym-purple/30 border-t-gym-purple rounded-full animate-spin" />
      <p className="text-gym-gray text-sm">{message}</p>
    </div>
  )
}

// ─── Pantalla 403 ─────────────────────────────────────────────────────────
function AccessDenied() {
  return (
    <div className="min-h-screen bg-gym-black flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-5xl">🔒</div>
      <h1 className="font-display text-3xl text-gym-white tracking-wider">ACCESO DENEGADO</h1>
      <p className="text-gym-gray text-sm max-w-xs">
        No tenés permisos para ver esta página. Si creés que es un error, contactá al administrador.
      </p>
    </div>
  )
}

// ─── PrivateRoute ─────────────────────────────────────────────────────────
/**
 * Protege rutas verificando la sesión con Supabase (nunca solo localStorage).
 * loading:true mientras Supabase confirma la sesión → muestra pantalla de carga,
 * nunca muestra contenido privado antes de validar.
 */
function PrivateRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth()

  // Esperando confirmación de Supabase — no mostrar nada privado todavía
  if (loading) {
    return <LoadingScreen />
  }

  // No autenticado → login
  if (!user || !role) {
    return <Navigate to="/login" replace />
  }

  // Autenticado pero rol no autorizado para esta ruta
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <AccessDenied />
  }

  return children
}
// ─── PublicOnlyRoute ──────────────────────────────────────────────────────
// Redirige al dashboard si ya está autenticado (no mostrar /login a usuario logueado)
function PublicOnlyRoute({ children }) {
  const { user, role, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user && role) {
    if (role === 'admin')       return <Navigate to="/admin"       replace />
    if (role === 'entrenador')  return <Navigate to="/entrenador"  replace />
    if (role === 'alumno')      return <Navigate to="/alumno"      replace />
  }
  return children
}

// ─── AppRoutes ────────────────────────────────────────────────────────────
export default function AppRoutes() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/"         element={<LandingPage />} />
      <Route path="/login"    element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

      {/* Admin */}
      <Route path="/admin"                element={<PrivateRoute allowedRoles={['admin']}><AdminDashboard /></PrivateRoute>} />
      <Route path="/admin/alumnos"        element={<PrivateRoute allowedRoles={['admin']}><AlumnosPage /></PrivateRoute>} />
      <Route path="/admin/entrenadores"   element={<PrivateRoute allowedRoles={['admin']}><EntrenadoresPage /></PrivateRoute>} />
      <Route path="/admin/rutinas"        element={<PrivateRoute allowedRoles={['admin']}><RutinasPage /></PrivateRoute>} />
      <Route path="/admin/pagos"          element={<PrivateRoute allowedRoles={['admin']}><PagosPage /></PrivateRoute>} />
      <Route path="/admin/configuracion"  element={<PrivateRoute allowedRoles={['admin']}><ConfiguracionPage /></PrivateRoute>} />
      <Route path="/admin/whatsapp"       element={<PrivateRoute allowedRoles={['admin']}><WhatsappPage /></PrivateRoute>} />

      {/* Entrenador */}
      <Route path="/entrenador" element={<PrivateRoute allowedRoles={['admin','entrenador']}><EntrenadorDashboard /></PrivateRoute>} />

      {/* Alumno */}
      <Route path="/alumno" element={<PrivateRoute allowedRoles={['admin','entrenador','alumno']}><AlumnoDashboard /></PrivateRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
