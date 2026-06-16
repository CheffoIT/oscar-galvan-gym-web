/**
 * Cliente HTTP centralizado para el backend propio (Express).
 *
 * Para datos que van directo a Supabase, usar supabaseClient.js y api.js.
 * Este cliente es para rutas del backend Express que no pasan por Supabase.
 *
 * Características:
 *  - baseURL configurable por entorno
 *  - Timeout de 15 segundos
 *  - Manejo centralizado de errores (401, 403, 404, 429, 500)
 *  - Sin tokens en URLs
 *  - Sin datos sensibles en logs
 *  - Prevención de notificaciones duplicadas
 */
import { supabase } from './supabaseClient'

// ─── Configuración ────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const TIMEOUT_MS = 15_000

// ─── Mensajes de error amigables ──────────────────────────────────────────
const HTTP_ERRORS = {
  400: 'Los datos enviados no son válidos. Revisá el formulario.',
  401: 'Tu sesión venció o no estás autenticado. Iniciá sesión nuevamente.',
  403: 'No tenés permisos para realizar esta acción.',
  404: 'El recurso solicitado no existe.',
  409: 'Ya existe un registro con esos datos.',
  413: 'El archivo enviado es demasiado grande.',
  422: 'Los datos enviados tienen errores de validación.',
  429: 'Demasiadas solicitudes. Esperá unos minutos e intentá nuevamente.',
  500: 'Error en el servidor. Intentá nuevamente más tarde.',
  502: 'El servidor no está disponible temporalmente.',
  503: 'El servicio no está disponible. Intentá más tarde.',
}

// Anti-duplicado: evitar multiple redirects/notificaciones por 401
let redirectingTo401 = false

// ─── Utilidad: obtener token JWT de Supabase ─────────────────────────────
async function getAuthToken() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data?.session?.access_token || null
}

// ─── Utilidad: construir URL sin doble /api/ ─────────────────────────────
function buildUrl(path) {
  // Normalizar: asegurarse que el path empieza con /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  // Nunca incluir /api/api/
  return `${BASE_URL}${normalizedPath}`
}

// ─── Utilidad: disparar evento de error global (para el Toast global) ────
function dispatchErrorEvent(message) {
  window.dispatchEvent(new CustomEvent('api:error', { detail: { message } }))
}

// ─── Función principal de fetch ───────────────────────────────────────────
async function request(method, path, { body, params, headers: extraHeaders, silent = false } = {}) {
  // Obtener token del usuario autenticado
  const token = await getAuthToken()

  // Construir URL con query params si hay
  let url = buildUrl(path)
  if (params && Object.keys(params).length > 0) {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => [k, String(v)])
      )
    ).toString()
    if (qs) url += `?${qs}`
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  }

  // Controller para timeout
  const controller = new AbortController()
  const timeoutId  = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      credentials: 'include',
    })
  } catch (err) {
    clearTimeout(timeoutId)

    if (err.name === 'AbortError') {
      const msg = 'La solicitud tardó demasiado. Verificá tu conexión e intentá nuevamente.'
      if (!silent) dispatchErrorEvent(msg)
      return { data: null, error: msg }
    }

    const msg = 'No se pudo conectar con el servidor. Verificá tu conexión.'
    if (!silent) dispatchErrorEvent(msg)
    return { data: null, error: msg }
  } finally {
    clearTimeout(timeoutId)
  }

  // ── Manejar respuestas de error ────────────────────────────────────────
  if (!response.ok) {
    let errorMsg = HTTP_ERRORS[response.status] || 'Error inesperado.'

    try {
      const errBody = await response.json()
      // Usar mensaje del servidor si es amigable (no expone stack traces)
      if (errBody.error && typeof errBody.error === 'string' && errBody.error.length < 300) {
        errorMsg = errBody.error
      }
    } catch { /* respuesta sin JSON */ }

    // 401 → redirigir al login (una sola vez)
    if (response.status === 401 && !redirectingTo401) {
      redirectingTo401 = true
      if (!silent) dispatchErrorEvent('Tu sesión venció. Iniciá sesión nuevamente.')
      setTimeout(() => {
        redirectingTo401 = false
        window.location.href = '/login'
      }, 1500)
    } else if (!silent && response.status !== 401) {
      dispatchErrorEvent(errorMsg)
    }

    return { data: null, error: errorMsg, status: response.status }
  }

  // ── Respuesta exitosa ──────────────────────────────────────────────────
  let data = null
  try {
    const text = await response.text()
    if (text) data = JSON.parse(text)
  } catch {
    // Respuesta sin cuerpo (204 No Content, etc.)
  }

  return { data, error: null, status: response.status }
}

// ─── Métodos públicos ─────────────────────────────────────────────────────
export const api = {
  get:    (path, opts)  => request('GET',    path, opts),
  post:   (path, body, opts) => request('POST',   path, { body, ...opts }),
  put:    (path, body, opts) => request('PUT',    path, { body, ...opts }),
  patch:  (path, body, opts) => request('PATCH',  path, { body, ...opts }),
  delete: (path, opts)  => request('DELETE', path, opts),
}

export default api
