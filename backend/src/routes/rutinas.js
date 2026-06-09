const router = require('express').Router()
const { authenticate, authorize } = require('../middlewares/auth')

// GET /api/rutinas
router.get('/', authenticate, authorize('admin', 'entrenador'), (req, res) => {
  res.json({
    data: [
      { id:'r1', nombre:'Fuerza Hipertrofia A/B', alumno:'Lucas Fernández', activa:true,  entrenador:'Carlos Ramos' },
      { id:'r2', nombre:'Full Body Tonificación', alumno:'Valentina Rios',   activa:true,  entrenador:'Carlos Ramos' },
      { id:'r3', nombre:'Glúteos y Piernas',      alumno:'Sofía Montiel',   activa:true,  entrenador:'Ana Pérez' },
    ],
    total: 3
  })
})

// GET /api/rutinas/alumno/:alumnoId — rutina activa de un alumno
router.get('/alumno/:alumnoId', authenticate, (req, res) => {
  // TODO: query a Supabase con filtro alumno_id + activa = true
  res.json({ data: null, message: 'Próximamente con Supabase' })
})

// POST /api/rutinas
router.post('/', authenticate, authorize('admin', 'entrenador'), (req, res) => {
  const { nombre, descripcion, alumnoId } = req.body
  if (!nombre || !alumnoId) {
    return res.status(400).json({ error: 'Nombre y alumnoId son requeridos' })
  }
  // TODO: insertar en Supabase
  res.status(201).json({ message: 'Rutina creada', data: { id: String(Date.now()), nombre, alumnoId } })
})

module.exports = router
