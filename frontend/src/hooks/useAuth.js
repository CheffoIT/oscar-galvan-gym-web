import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabaseClient'

const LS_USER_KEY = 'gym_user_cache'
const LS_ROLE_KEY = 'gym_role_cache'

function clearLocalCache() {
  try {
    localStorage.removeItem(LS_USER_KEY)
    localStorage.removeItem(LS_ROLE_KEY)
    localStorage.removeItem('gym_role')
    localStorage.removeItem('gym_user')
  } catch {}
}

function setCachedSession(user, role) {
  try {
    localStorage.setItem(LS_ROLE_KEY, role)
    localStorage.setItem(LS_USER_KEY, JSON.stringify(user))
  } catch {}
}

export function useAuth() {
  const [user,      setUser]      = useState(null)
  const [role,      setRole]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [authError, setAuthError] = useState(null)

  const loadUserProfile = useCallback(async (authUser) => {
    if (!supabase || !authUser) {
      clearLocalCache()
      setUser(null)
      setRole(null)
      setLoading(false)
      return
    }

    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('id, nombre, apellido, rol, activo')
      .eq('id', authUser.id)
      .single()

    if (perfilError || !perfil) {
      clearLocalCache()
      setUser(null)
      setRole(null)
      setLoading(false)
      return
    }

    if (!perfil.activo) {
      clearLocalCache()
      await supabase.auth.signOut().catch(() => {})
      setUser(null)
      setRole(null)
      setAuthError('Tu cuenta está desactivada. Contactá al administrador.')
      setLoading(false)
      return
    }

    const userData = {
      id:       authUser.id,
      email:    authUser.email,
      nombre:   perfil.nombre,
      apellido: perfil.apellido,
      rol:      perfil.rol,
    }

    setCachedSession(userData, perfil.rol)
    setUser(userData)
    setRole(perfil.rol)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!supabase) {
      clearLocalCache()
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user)
      } else {
        clearLocalCache()
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await loadUserProfile(session.user)
        } else {
          clearLocalCache()
          setUser(null)
          setRole(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [loadUserProfile])

  const login = async (email, password) => {
    if (!supabase) {
      return { success: false, error: 'Supabase no está configurado. Revisá el archivo .env.' }
    }
    setAuthError(null)

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email:    String(email).trim().toLowerCase(),
      password: String(password),
    })

    if (loginError) {
      const mensajes = {
        'Invalid login credentials': 'Email o contraseña incorrectos.',
        'Email not confirmed':        'El email no fue confirmado.',
        'Too many requests':          'Demasiados intentos. Esperá unos minutos.',
      }
      const msg = mensajes[loginError.message] || 'Email o contraseña incorrectos.'
      return { success: false, error: msg }
    }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol, activo')
      .eq('id', data.user.id)
      .single()

    if (!perfil || !perfil.activo) {
      await supabase.auth.signOut().catch(() => {})
      return { success: false, error: 'Tu cuenta está desactivada. Contactá al administrador.' }
    }

    return { success: true, role: perfil.rol }
  }

  const logout = async () => {
    if (supabase) await supabase.auth.signOut().catch(() => {})
    clearLocalCache()
    setUser(null)
    setRole(null)
  }

  const cambiarPassword = async (passwordNueva) => {
    if (!supabase) return { success: false, error: 'Supabase no configurado.' }
    const { error } = await supabase.auth.updateUser({ password: passwordNueva })
    if (error) return { success: false, error: error.message }
    await logout()
    return { success: true }
  }

  return {
    user,
    role,
    loading,
    authError,
    login,
    logout,
    cambiarPassword,
    isAdmin:         role === 'admin',
    isEntrenador:    role === 'entrenador',
    isAlumno:        role === 'alumno',
    isAuthenticated: !!user,
  }
}
