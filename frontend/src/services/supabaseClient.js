import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase para el frontend.
 *
 * CONFIGURACIÓN:
 * 1. Creá el archivo .env en frontend/ (copiá de .env.example)
 * 2. Completá las variables con los datos de tu proyecto Supabase:
 *    - Ve a https://supabase.com → tu proyecto → Settings → API
 *    - Copiá "Project URL" → VITE_SUPABASE_URL
 *    - Copiá "anon public" → VITE_SUPABASE_ANON_KEY
 */
const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  || ''
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Exportá el cliente Supabase configurado
export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

// ─── Auth helpers ──────────────────────────────────────────────────────────────
export const signIn = async (email, password) => {
  if (!supabase) throw new Error('Supabase no configurado. Revisá el archivo .env')
  return supabase.auth.signInWithPassword({ email, password })
}

export const signOut = async () => {
  if (!supabase) return
  return supabase.auth.signOut()
}

export const getUser = async () => {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data?.user || null
}

export const onAuthStateChange = (callback) => {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } }
  return supabase.auth.onAuthStateChange(callback)
}

// ─── Storage helpers ──────────────────────────────────────────────────────────
export const uploadImage = async (bucket, path, file) => {
  if (!supabase) throw new Error('Supabase no configurado')
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  })
  if (error) throw error
  return supabase.storage.from(bucket).getPublicUrl(data.path).data.publicUrl
}

export const getPublicUrl = (bucket, path) => {
  if (!supabase) return null
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}
