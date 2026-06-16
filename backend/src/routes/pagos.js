const router = require('express').Router()
const { supabase } = require('../config/supabase')
const { authenticate, authorize } = require('../middlewares/auth')

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isUUID = v => UUID_REGEX.test(v)

function pagoDTO(p) {
  return {
    id:            p.id,
    alumno_id:     p.alumno_id,
    monto:         p.monto,
    fecha_pago:    p.fecha_pago,
    vencimiento:   p.vencimiento,
    estado:        p.estado,
    metodo:        p.metodo,
    descripcion:   p.descripcion,
    created_at:    p.created_at,
  }
}

// GET /api/pagos — listar pagos (admin)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
  const from  = (page - 1) * limit

  const { data, error, count } = await supabase
    .from('pagos')
    .select(`
      id, alumno_id, monto, fecha_pago, vencimiento, estado, metodo, descripcion, created_at,
      alumnos(nombre, apellido)
    `, { count: 'exact' })
    .is('deleted_at', null)
    .order('fecha_pago', { ascending: false })
    .range(from, from + limit - 1)

  if (error) return res.status(500).json({ error: 'Error al obtener pagos.' })
  return res.json({ data: data.map(pagoDTO), total: count, page, limit })
})

// GET /api/pagos/alumno/:alumnoId — pagos de un alumno específico
router.get('/alumno/:alumnoId', authenticate, async (req, res) => {
  if (!isUUID(req.params.alumnoId)) return res.status(400).json({ error: 'ID inválido.' })

  // Alumno solo puede ver sus propios pagos
  if (req.user.rol === 'alumno') {
    const { data: perfil } = await supabase
      .from('alumnos')
      .select('perfil_id')
      .eq('id', req.params.alumnoId)
      .single()
    if (!perfil || perfil.perfil_id !== req.user.sub) {
      return res.status(403).json({ error: 'Acceso denegado.' })
    }
  }

  const { data, error } = await supabase
    .from('pagos')
    .select('id, alumno_id, monto, fecha_pago, vencimiento, estado, metodo, descripcion, created_at')
    .eq('alumno_id', req.params.alumnoId)
    .is('deleted_at', null)
    .order('fecha_pago', { ascending: false })

  if (error) return res.status(500).json({ error: 'Error al obtener pagos.' })
  return res.json({ data: data.map(pagoDTO) })
})

// POST /api/pagos — registrar nuevo pago (admin)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  const { alumno_id, monto, fecha_pago, metodo, descripcion } = req.body

  if (!alumno_id || !isUUID(alumno_id)) return res.status(400).json({ error: 'alumno_id inválido.' })
  if (!monto || isNaN(parseFloat(monto))) return res.status(400).json({ error: 'monto inválido.' })
  if (!fecha_pago) return res.status(400).json({ error: 'fecha_pago requerido.' })

  // Calcular vencimiento (30 días por defecto)
  const vencimiento = new Date(fecha_pago)
  vencimiento.setDate(vencimiento.getDate() + 30)

  const { data, error } = await supabase.from('pagos').insert({
    alumno_id,
    monto:       parseFloat(monto),
    fecha_pago,
    vencimiento: vencimiento.toISOString().split('T')[0],
    metodo:      metodo || 'efectivo',
    descripcion: descripcion ? String(descripcion).slice(0, 300) : null,
    estado:      'activo',
    created_by:  req.user.sub,
  }).select().single()

  if (error) return res.status(500).json({ error: 'Error al registrar pago.' })

  // Actualizar fecha_vencimiento del alumno
  await supabase.from('alumnos').update({
    fecha_vencimiento: vencimiento.toISOString().split('T')[0],
    estado: 'activo',
  }).eq('id', alumno_id)

  return res.status(201).json(pagoDTO(data))
})

// DELETE /api/pagos/:id — borrado lógico (admin)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  if (!isUUID(req.params.id)) return res.status(400).json({ error: 'ID inválido.' })

  const { error } = await supabase
    .from('pagos')
    .update({ deleted_at: new Date().toISOString(), deleted_by: req.user.sub })
    .eq('id', req.params.id)
    .is('deleted_at', null)

  if (error) return res.status(500).json({ error: 'Error al eliminar pago.' })
  return res.json({ message: 'Pago eliminado.' })
})

module.exports = router
