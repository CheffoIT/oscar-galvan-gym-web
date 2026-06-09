const router = require('express').Router()
const { authenticate, authorize } = require('../middlewares/auth')

// GET /api/pagos
router.get('/', authenticate, authorize('admin'), (req, res) => {
  res.json({
    data: [
      { id:'p1', alumno:'Lucas Fernández',  monto:15000, vencimiento:'2026-06-05', estado:'activo'  },
      { id:'p2', alumno:'Valentina Rios',   monto:8000,  vencimiento:'2026-06-18', estado:'activo'  },
      { id:'p3', alumno:'Marcos Suárez',    monto:8000,  vencimiento:'2026-05-01', estado:'vencido' },
      { id:'p4', alumno:'Sofía Montiel',    monto:21000, vencimiento:'2026-07-10', estado:'activo'  },
    ],
    resumen: { activos: 3, vencidos: 1, ingresoMes: 44000 }
  })
})

// POST /api/pagos — registrar nuevo pago
router.post('/', authenticate, authorize('admin'), (req, res) => {
  const { alumnoId, membresiaId, monto, fechaPago, metodo } = req.body
  if (!alumnoId || !monto || !fechaPago) {
    return res.status(400).json({ error: 'alumnoId, monto y fechaPago son requeridos' })
  }
  // TODO: insertar en Supabase y calcular fecha de vencimiento según plan
  res.status(201).json({ message: 'Pago registrado', data: { id: String(Date.now()), alumnoId, monto } })
})

module.exports = router
