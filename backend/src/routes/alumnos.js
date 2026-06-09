const router      = require('express').Router()
const { authenticate, authorize } = require('../middlewares/auth')

// Mock data — reemplazar con queries a Supabase
const alumnosMock = [
  { id:'1', nombre:'Lucas',     apellido:'Fernández', dni:'38521478', estado:'activo',  plan:'Plan Personalizado', vencimiento:'2026-06-05' },
  { id:'2', nombre:'Valentina', apellido:'Rios',      dni:'41236589', estado:'activo',  plan:'Plan Básico',        vencimiento:'2026-06-18' },
  { id:'3', nombre:'Marcos',    apellido:'Suárez',    dni:'35698741', estado:'moroso',  plan:'Plan Básico',        vencimiento:'2026-05-01' },
  { id:'4', nombre:'Sofía',     apellido:'Montiel',   dni:'43210987', estado:'activo',  plan:'Plan 3 Meses',       vencimiento:'2026-07-10' },
  { id:'5', nombre:'Diego',     apellido:'Peralta',   dni:'37852369', estado:'inactivo',plan:'Plan Básico',        vencimiento:'2026-01-01' },
]

// GET /api/alumnos
router.get('/', authenticate, authorize('admin', 'entrenador'), (req, res) => {
  const { estado, search } = req.query
  let result = [...alumnosMock]

  if (estado)  result = result.filter(a => a.estado === estado)
  if (search)  result = result.filter(a =>
    `${a.nombre} ${a.apellido} ${a.dni}`.toLowerCase().includes(search.toLowerCase())
  )
  res.json({ data: result, total: result.length })
})

// GET /api/alumnos/:id
router.get('/:id', authenticate, (req, res) => {
  const alumno = alumnosMock.find(a => a.id === req.params.id)
  if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado' })

  // Un alumno solo puede ver su propio perfil
  if (req.user.rol === 'alumno' && req.user.alumnoId !== req.params.id) {
    return res.status(403).json({ error: 'Sin acceso' })
  }
  res.json({ data: alumno })
})

// POST /api/alumnos — crear alumno
router.post('/', authenticate, authorize('admin'), (req, res) => {
  const { nombre, apellido, dni, email, telefono } = req.body
  if (!nombre || !apellido || !dni) {
    return res.status(400).json({ error: 'Nombre, apellido y DNI son requeridos' })
  }
  // TODO: insertar en Supabase
  const nuevo = { id: String(Date.now()), nombre, apellido, dni, email, telefono, estado: 'activo' }
  res.status(201).json({ data: nuevo, message: 'Alumno creado exitosamente' })
})

// PUT /api/alumnos/:id — actualizar alumno
router.put('/:id', authenticate, authorize('admin'), (req, res) => {
  // TODO: actualizar en Supabase
  res.json({ message: 'Alumno actualizado', data: { id: req.params.id, ...req.body } })
})

// DELETE /api/alumnos/:id — eliminar alumno
router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  // TODO: eliminar en Supabase (soft delete recomendado)
  res.json({ message: 'Alumno eliminado' })
})

module.exports = router
