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

function PrivateRoute({ children, allowedRoles }) {
  const { role, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gym-black flex items-center justify-center">
        <p className="text-gym-gray text-sm">Verificando sesion...</p>
      </div>
    )
  }

  if (!role) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(role)) {
    const panelPorRol = { admin: '/admin', entrenador: '/entrenador', alumno: '/alumno' }
    return <Navigate to={panelPorRol[role] || '/login'} replace />
  }

  return children
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/"          element={<LandingPage />} />
      <Route path="/login"     element={<LoginPage />} />
      <Route path="/register"  element={<RegisterPage />} />

      <Route path="/admin" element={
        <PrivateRoute allowedRoles={['admin']}><AdminDashboard /></PrivateRoute>
      }/>
      <Route path="/admin/alumnos" element={
        <PrivateRoute allowedRoles={['admin']}><AlumnosPage /></PrivateRoute>
      }/>
      <Route path="/admin/entrenadores" element={
        <PrivateRoute allowedRoles={['admin']}><EntrenadoresPage /></PrivateRoute>
      }/>
      <Route path="/admin/rutinas" element={
        <PrivateRoute allowedRoles={['admin']}><RutinasPage /></PrivateRoute>
      }/>
      <Route path="/admin/pagos" element={
        <PrivateRoute allowedRoles={['admin']}><PagosPage /></PrivateRoute>
      }/>
      <Route path="/admin/configuracion" element={
        <PrivateRoute allowedRoles={['admin']}><ConfiguracionPage /></PrivateRoute>
      }/>
      <Route path="/admin/whatsapp" element={
        <PrivateRoute allowedRoles={['admin']}><WhatsappPage /></PrivateRoute>
      }/>

      <Route path="/entrenador" element={
        <PrivateRoute allowedRoles={['entrenador', 'admin']}><EntrenadorDashboard /></PrivateRoute>
      }/>

      <Route path="/alumno" element={
        <PrivateRoute allowedRoles={['alumno', 'admin']}><AlumnoDashboard /></PrivateRoute>
      }/>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
