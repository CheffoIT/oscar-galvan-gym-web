import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'

/**
 * Hook de autenticación.
 * Usa Supabase Auth si está configurado, o mock localStorage como fallback.
 */
// Lee el estado de sesión desde localStorage de forma síncrona para evitar flash
function getInitialState() {
  try {
    const storedRole = localStorage.getItem('gym_role')
    const storedUser = localStorage.getItem('gym_user')
    if (storedRole && storedUser) {
      return { user: JSON.parse(storedUser), role: storedRole }
    }
  } catch {}
  return { user: null, role: null }
}

export function useAuth() {
  const initial = getInitialState()
  const [user,    setUser]    = useState(initial.user)
  const [role,    setRole]    = useState(initial.role)
  const [loading, setLoading] = useState(true)

  // ── Cargar sesión al montar ──────────────────────────────
  useEffect(() => {
    if (supabase) {
      // Modo Supabase real
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          loadUserProfile(session.user)
        } else {
          setLoading(false)
        }
      })

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (session) {
            await loadUserProfile(session.user)
          } else {
            setUser(null)
            setRole(null)
            setLoading(false)
          }
        }
      )
      return () => subscription.unsubscribe()
    } else {
      // Fallback mock (sin Supabase configurado)
      const storedRole = localStorage.getItem('gym_role')
      const storedUser = localStorage.getItem('gym_user')
      if (storedRole && storedUser) {
        try {
          setRole(storedRole)
          setUser(JSON.parse(storedUser))
        } catch {}
      }
      setLoading(false)
    }
  }, [])

  // ── Cargar perfil desde la tabla 'perfiles' ──────────────
  const loadUserProfile = async (authUser) => {
    if (!supabase) return
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('id, nombre, apellido, rol, activo')
      .eq('id', authUser.id)
      .single()

    if (perfil) {
      const userData = {
        id:       authUser.id,
        email:    authUser.email,
        nombre:   perfil.nombre,
        apellido: perfil.apellido,
        rol:      perfil.rol,
        activo:   perfil.activo,
      }
      setUser(userData)
      setRole(perfil.rol)
      // Guardar en localStorage para PrivateRoute (sin Supabase)
      localStorage.setItem('gym_role', perfil.rol)
      localStorage.setItem('gym_user', JSON.stringify(userData))
    }
    setLoading(false)
  }

  // ── Login ────────────────────────────────────────────────
  const login = async (email, password) => {
    if (supabase) {
      // Autenticación real con Supabase
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        const mensajes = {
          'Invalid login credentials':    'Email o contraseña incorrectos.',
          'Email not confirmed':          'El email no fue confirmado. Revisá tu bandeja de entrada.',
          'Too many requests':            'Demasiados intentos. Esperá unos minutos.',
          'User not found':               'No existe una cuenta con ese email.',
        }
        return { success: false, error: mensajes[error.message] || error.message }
      }

      // Leer el perfil directamente (sin depender de onAuthStateChange)
      const { data: perfil, error: perfilError } = await supabase
        .from('perfiles')
        .select('id, nombre, apellido, rol, activo')
        .eq('id', data.user.id)
        .single()

      if (perfilError || !perfil) {
        return { success: false, error: 'No se encontró el perfil. Verificá que el seed fue ejecutado.' }
      }

      const userData = {
        id:       data.user.id,
        email:    data.user.email,
        nombre:   perfil.nombre,
        apellido: perfil.apellido,
        rol:      perfil.rol,
      }

      localStorage.setItem('gym_role', perfil.rol)
      localStorage.setItem('gym_user', JSON.stringify(userData))
      setUser(userData)
      setRole(perfil.rol)

      return { success: true, role: perfil.rol }
    } else {
      // Fallback mock
      const users = {
        'admin@gym.com':      { id:'0', nombre:'Oscar Galvan',    email:'admin@gym.com',      rol:'admin' },
        'entrenador@gym.com': { id:'1', nombre:'Carlos Ramos',    email:'entrenador@gym.com', rol:'entrenador' },
        'alumno@gym.com':     { id:'2', nombre:'Lucas Fernández', email:'alumno@gym.com',     rol:'alumno' },
      }
      const passwords = {
        'admin@gym.com':'admin123', 'entrenador@gym.com':'entrenador123', 'alumno@gym.com':'alumno123'
      }
      if (users[email] && passwords[email] === password) {
        const u = users[email]
        localStorage.setItem('gym_role', u.rol)
        localStorage.setItem('gym_user', JSON.stringify(u))
        setRole(u.rol)
        setUser(u)
        return { success: true, role: u.rol }
      }
      return { success: false, error: 'Email o contraseña incorrectos' }
    }
  }

  // ── Logout ───────────────────────────────────────────────
  const logout = async () => {
    if (supabase) await supabase.auth.signOut()
    localStorage.removeItem('gym_role')
    localStorage.removeItem('gym_user')
    setRole(null)
    setUser(null)
  }

  return {
    user, role, loading, login, logout,
    isAdmin:      role === 'admin',
    isEntrenador: role === 'entrenador',
    isAlumno:     role === 'alumno',
    isAuthenticated: !!user,
  }
}
