/**
 * Rutas públicas — no requieren autenticación.
 * Incluyen: ficha pública de alumno por token QR, imágenes de ejercicios.
 */
const router = require('express').Router()
const { supabase } = require('../config/supabase')
const { publicLimiter } = require('../middlewares/rateLimit')

// ─── GET /api/publico/alumno/:token — Ficha pública por token QR ──────────
//
// El token es un UUID criptográfico guardado en alumnos.qr_token.
// NUNCA expone el ID real del alumno ni datos sensibles.
//
router.get('/alumno/:token', publicLimiter, async (req, res) => {
  const { token } = req.params

  // Validar que el token tenga formato razonable (32-128 chars hex/uuid)
  if (!token || typeof token !== 'string' || token.length < 8 || token.length > 128) {
    return res.status(404).json({ error: 'Ficha no encontrada.' })
  }

  if (!supabase) {
    return res.status(503).json({ error: 'Servicio temporalmente no disponible.' })
  }

  // Buscar por qr_token (no por ID)
  const { data: alumno, error } = await supabase
    .from('alumnos')
    .select(`
      nombre, apellido, foto_url, estado,
      entrenadores ( perfiles ( nombre, apellido ) )
    `)
    .eq('qr_token', token)
    .eq('qr_token_activo', true)
    .single()

  if (error || !alumno) {
    // Respuesta genérica — no revelar si el token es inválido vs. revocado
    return res.status(404).json({ error: 'Ficha no encontrada o enlace desactivado.' })
  }

  if (alumno.estado === 'inactivo') {
    return res.status(404).json({ error: 'Esta ficha no está disponible.' })
  }

  // Devolver SOLO datos públicos autorizados.
  // NO incluir: email, teléfono, DNI, pagos, historial clínico, observaciones,
  // peso, altura, tokens, IDs internos, datos de contacto, dirección.
  return res.json({
    nombre:     alumno.nombre,
    apellido:   alumno.apellido,
    foto_url:   alumno.foto_url || null,
    estado:     alumno.estado,
    entrenador: alumno.entrenadores?.perfiles
      ? `${alumno.entrenadores.perfiles.nombre} ${alumno.entrenadores.perfiles.apellido}`
      : null,
    gym: process.env.GYM_NOMBRE || 'Oscar Galvan Fuerza y Musculación',
  })
})

// ─── GET /api/publico/imagenes-ejercicios — Imágenes públicas de ejercicios
router.get('/imagenes-ejercicios', publicLimiter, async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: 'Servicio temporalmente no disponible.' })
  }

  const { data, error } = await supabase
    .from('ejercicios')
    .select('id, nombre, grupo_muscular, imagen_url')
    .not('imagen_url', 'is', null)
    .order('grupo_muscular', { ascending: true })
    .limit(100)

  if (error) {
    console.error('[publico/imagenes-ejercicios] Error:', error.message)
    return res.status(500).json({ error: 'No se pudieron cargar las imágenes.' })
  }

  return res.json({ data: data || [] })
})

// ─── GET /api/publico/configuracion — Config pública del gimnasio ──────────
router.get('/configuracion', publicLimiter, async (req, res) => {
  if (!supabase) {
    return res.json({
      data: {
        nombre: process.env.GYM_NOMBRE || 'Oscar Galvan Fuerza y Musculación',
      }
    })
  }

  const { data, error } = await supabase
    .from('configuracion_gimnasio')
    .select('nombre, slogan, frase_hero, subfrase_hero, whatsapp, instagram, direccion, mostrar_precios')
    .limit(1)
    .single()

  if (error) {
    console.error('[publico/configuracion] Error:', error.message)
    return res.status(500).json({ error: 'No se pudo cargar la configuración.' })
  }

  // No devolver CBU, alias bancario ni datos internos en la ruta pública
  return res.json({ data: data || {} })
})

module.exports = router
