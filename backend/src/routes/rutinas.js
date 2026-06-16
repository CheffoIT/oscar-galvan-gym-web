const router = require('express').Router()
const { supabase } = require('../config/supabase')
const { authenticate, authorize } = require('../middlewares/auth')

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isUUID = v => UUID_REGEX.test(v)

function rutinaDTO(r) {
  return {
    id:          r.id,
    nombre:      r.nombre,
    descripcion: r.descripcion,
    alumno_id:   r.alumno_id,
    entrenador_id: r.entrenador_id,
    activa:      r.activa,
    created_at:  r.created_at,
    ejercicios:  r.ejercicios || [],
  }
}

// GET /api/rutinas — listar rutinas (admin/entrenador)
router.get('/', authenticate, authorize('admin', 'entrenador'), async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
  const from  = (page - 1) * limit

  let query = supabase
    .from('rutinas')
    .select(`
      id, nombre, descripcion, alumno_id, entrenador_id, activa, created_at,
      alumnos(nombre, apellido),
      perfiles:entrenador_id(nombre, apellido)
    `, { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  // Entrenador solo ve rutinas de sus alumnos
  if (req.user.rol === 'entrenador') {
    const { data: perfil } = await supabase
      .from('perfiles').select('id').eq('id', req.user.sub).single()
    if (perfil) query = query.eq('entrenador_id', perfil.id)
  }

  const { data, error, count } = await query
  if (error) return res.status(500).json({ error: 'Error al obtener rutinas.' })
  return res.json({ data: data.map(rutinaDTO), total: count, page, limit })
})

// GET /api/rutinas/alumno/:alumnoId — rutina activa de un alumno
router.get('/alumno/:alumnoId', authenticate, async (req, res) => {
  if (!isUUID(req.params.alumnoId)) return res.status(400).json({ error: 'ID inválido.' })

  // IDOR: alumno solo puede ver su propia rutina
  if (req.user.rol === 'alumno') {
    const { data: al } = await supabase
      .from('alumnos').select('perfil_id').eq('id', req.params.alumnoId).single()
    if (!al || al.perfil_id !== req.user.sub) {
      return res.status(403).json({ error: 'Acceso denegado.' })
    }
  }

  const { data, error } = await supabase
    .from('rutinas')
    .select('id, nombre, descripcion, alumno_id, entrenador_id, activa, created_at, ejercicios')
    .eq('alumno_id', req.params.alumnoId)
    .eq('activa', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return res.status(500).json({ error: 'Error al obtener rutina.' })
  return res.json({ data: data ? rutinaDTO(data) : null })
})

// POST /api/rutinas — crear rutina (admin/entrenador)
router.post('/', authenticate, authorize('admin', 'entrenador'), async (req, res) => {
  const { nombre, descripcion, alumno_id, ejercicios } = req.body

  if (!nombre || String(nombre).trim().length < 2) return res.status(400).json({ error: 'Nombre requerido.' })
  if (!alumno_id || !isUUID(alumno_id)) return res.status(400).json({ error: 'alumno_id inválido.' })

  const { data, error } = await supabase.from('rutinas').insert({
    nombre:       String(nombre).trim(),
    descripcion:  descripcion ? String(descripcion).slice(0, 1000) : null,
    alumno_id,
    entrenador_id: req.user.sub,
    activa:        true,
    ejercicios:   Array.isArray(ejercicios) ? ejercicios : [],
    created_by:   req.user.sub,
  }).select().single()

  if (error) return res.status(500).json({ error: 'Error al crear rutina.' })
  return res.status(201).json(rutinaDTO(data))
})

// PATCH /api/rutinas/:id — actualizar rutina
router.patch('/:id', authenticate, authorize('admin', 'entrenador'), async (req, res) => {
  if (!isUUID(req.params.id)) return res.status(400).json({ error: 'ID inválido.' })

  const campos = {}
  for (const k of ['nombre', 'descripcion', 'activa', 'ejercicios']) {
    if (req.body[k] !== undefined) campos[k] = req.body[k]
  }
  campos.updated_by = req.user.sub

  const { data, error } = await supabase
    .from('rutinas').update(campos)
    .eq('id', req.params.id).is('deleted_at', null)
    .select().single()

  if (error || !data) return res.status(404).json({ error: 'Rutina no encontrada.' })
  return res.json(rutinaDTO(data))
})

// DELETE /api/rutinas/:id — borrado lógico
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  if (!isUUID(req.params.id)) return res.status(400).json({ error: 'ID inválido.' })
  const { error } = await supabase
    .from('rutinas')
    .update({ deleted_at: new Date().toISOString(), deleted_by: req.user.sub })
    .eq('id', req.params.id).is('deleted_at', null)
  if (error) return res.status(500).json({ error: 'Error al eliminar rutina.' })
  return res.json({ message: 'Rutina eliminada.' })
})

module.exports = router
