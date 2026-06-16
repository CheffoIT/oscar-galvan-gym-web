const router = require('express').Router()
const { supabase } = require('../config/supabase')
const { authenticate, authorize } = require('../middlewares/auth')

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUUID(v) { return UUID_REGEX.test(v) }

// DTO: nunca devolver campos sensibles/internos al cliente
function alumnoDTO(a) {
  return {
    id:               a.id,
    nombre:           a.nombre,
    apellido:         a.apellido,
    email:            a.email,
    telefono:         a.telefono,
    fecha_nacimiento: a.fecha_nacimiento,
    dni:              a.dni,
    foto_url:         a.foto_url,
    estado:           a.estado,
    fecha_vencimiento: a.fecha_vencimiento,
    entrenador_id:    a.entrenador_id,
    created_at:       a.created_at,
  }
}

// GET /api/alumnos — listar (admin/entrenador)
router.get('/', authenticate, authorize('admin', 'entrenador'), async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
  const from  = (page - 1) * limit

  const estadosValidos = ['activo', 'inactivo', 'pendiente', 'suspendido']
  const estado = req.query.estado

  if (estado && !estadosValidos.includes(estado)) {
    return res.status(400).json({ error: 'Estado invalido.' })
  }

  let query = supabase
    .from('alumnos')
    .select('id, nombre, apellido, email, telefono, estado, fecha_vencimiento, foto_url, entrenador_id', { count: 'exact' })
    .is('deleted_at', null)
    .order('apellido', { ascending: true })
    .range(from, from + limit - 1)

  if (estado) query = query.eq('estado', estado)

  // Entrenador solo ve sus alumnos
  if (req.user.rol === 'entrenador') {
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('id')
      .eq('perfil_id', req.user.sub)
      .single()
    if (perfil) query = query.eq('entrenador_id', perfil.id)
  }

  const { data, error, count } = await query
  if (error) return res.status(500).json({ error: 'Error al obtener alumnos.' })

  return res.json({ data: data.map(alumnoDTO), total: count, page, limit })
})

// GET /api/alumnos/:id — detalle de alumno
router.get('/:id', authenticate, authorize('admin', 'entrenador', 'alumno'), async (req, res) => {
  if (!isUUID(req.params.id)) return res.status(400).json({ error: 'ID invalido.' })

  const { data, error } = await supabase
    .from('alumnos')
    .select('*')
    .eq('id', req.params.id)
    .is('deleted_at', null)
    .single()

  if (error || !data) return res.status(404).json({ error: 'Alumno no encontrado.' })

  // Un alumno solo puede ver su propio perfil
  if (req.user.rol === 'alumno' && data.perfil_id !== req.user.sub) {
    return res.status(403).json({ error: 'Acceso denegado.' })
  }

  return res.json(alumnoDTO(data))
})

// POST /api/alumnos — crear alumno (admin)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  const { nombre, apellido, email, telefono, dni, fecha_nacimiento, entrenador_id } = req.body

  if (!nombre || !apellido || !email) {
    return res.status(400).json({ error: 'nombre, apellido y email son requeridos.' })
  }

  const { data, error } = await supabase.from('alumnos').insert({
    nombre:           String(nombre).trim(),
    apellido:         String(apellido).trim(),
    email:            String(email).trim().toLowerCase(),
    telefono:         telefono ? String(telefono).trim() : null,
    dni:              dni ? String(dni).trim() : null,
    fecha_nacimiento: fecha_nacimiento || null,
    entrenador_id:    entrenador_id && isUUID(entrenador_id) ? entrenador_id : null,
    estado:           'activo',
    created_by:       req.user.sub,
  }).select().single()

  if (error) return res.status(500).json({ error: 'Error al crear alumno.' })
  return res.status(201).json(alumnoDTO(data))
})

// PATCH /api/alumnos/:id — actualizar alumno (admin/entrenador)
router.patch('/:id', authenticate, authorize('admin', 'entrenador'), async (req, res) => {
  if (!isUUID(req.params.id)) return res.status(400).json({ error: 'ID invalido.' })

  const campos = {}
  const permitidos = ['nombre', 'apellido', 'telefono', 'estado', 'fecha_vencimiento', 'entrenador_id', 'foto_url']
  for (const k of permitidos) {
    if (req.body[k] !== undefined) campos[k] = req.body[k]
  }
  campos.updated_by = req.user.sub

  const { data, error } = await supabase
    .from('alumnos')
    .update(campos)
    .eq('id', req.params.id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error || !data) return res.status(404).json({ error: 'Alumno no encontrado.' })
  return res.json(alumnoDTO(data))
})

// DELETE /api/alumnos/:id — borrado logico (admin)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  if (!isUUID(req.params.id)) return res.status(400).json({ error: 'ID invalido.' })

  const { error } = await supabase
    .from('alumnos')
    .update({ deleted_at: new Date().toISOString(), deleted_by: req.user.sub })
    .eq('id', req.params.id)
    .is('deleted_at', null)

  if (error) return res.status(500).json({ error: 'Error al eliminar alumno.' })
  return res.json({ message: 'Alumno eliminado correctamente.' })
})

// GET /api/alumnos/:id/qr — generar token QR seguro
router.get('/:id/qr', authenticate, authorize('admin', 'entrenador'), async (req, res) => {
  if (!isUUID(req.params.id)) return res.status(400).json({ error: 'ID invalido.' })

  const token = require('crypto').randomUUID()
  const caduca = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const { error } = await supabase
    .from('alumnos')
    .update({
      qr_token:           token,
      qr_token_activo:    true,
      qr_token_creado_en: new Date().toISOString(),
      qr_token_caduca_en: caduca,
    })
    .eq('id', req.params.id)
    .is('deleted_at', null)

  if (error) return res.status(500).json({ error: 'Error al generar QR.' })

  const urlPublica = `${process.env.FRONTEND_URL || ''}/ficha/${token}`
  return res.json({ token, url: urlPublica, caduca_en: caduca })
})

// DELETE /api/alumnos/:id/qr — revocar token QR
router.delete('/:id/qr', authenticate, authorize('admin', 'entrenador'), async (req, res) => {
  if (!isUUID(req.params.id)) return res.status(400).json({ error: 'ID invalido.' })

  const { error } = await supabase
    .from('alumnos')
    .update({ qr_token_activo: false })
    .eq('id', req.params.id)

  if (error) return res.status(500).json({ error: 'Error al revocar QR.' })
  return res.json({ message: 'QR revocado.' })
})

module.exports = router
