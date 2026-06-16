const router = require('express').Router()
const { supabase } = require('../config/supabase')
const { authenticate, authorize } = require('../middlewares/auth')

// Fallback en memoria si Supabase no está configurado
let configMemoria = {
  nombre:         'Oscar Galvan Fuerza y Musculacion',
  whatsapp:       '',
  instagram:      '',
  direccion:      '',
  fraseHero:      'TRANSFORMA TU CUERPO, TRANSFORMA TU VIDA',
  mostrarPrecios: true,
  // Datos financieros — SOLO admin, NUNCA en endpoint público
  cbu:   '',
  alias: '',
}

async function leerConfig() {
  if (!supabase) return configMemoria
  const { data } = await supabase
    .from('configuracion_gimnasio')
    .select('*')
    .single()
  return data || configMemoria
}

// GET /api/configuracion — PÚBLICO — solo datos no sensibles
// CBU y alias quedan excluidos intencionalmente
router.get('/', async (req, res) => {
  try {
    const cfg = await leerConfig()
    res.json({
      data: {
        nombre:         cfg.nombre,
        whatsapp:       cfg.whatsapp,
        instagram:      cfg.instagram,
        direccion:      cfg.direccion,
        fraseHero:      cfg.fraseHero,
        mostrarPrecios: cfg.mostrarPrecios,
      }
    })
  } catch {
    res.status(500).json({ error: 'Error al obtener configuración.' })
  }
})

// GET /api/configuracion/admin — admin: devuelve también datos financieros
router.get('/admin', authenticate, authorize('admin'), async (req, res) => {
  try {
    const cfg = await leerConfig()
    res.json({ data: cfg })
  } catch {
    res.status(500).json({ error: 'Error al obtener configuración.' })
  }
})

// PUT /api/configuracion — solo admin
router.put('/', authenticate, authorize('admin'), async (req, res) => {
  // Mass assignment prevention: extraer solo campos permitidos
  const camposPermitidos = ['nombre', 'whatsapp', 'instagram', 'direccion', 'fraseHero', 'mostrarPrecios', 'cbu', 'alias']
  const updates = {}
  for (const k of camposPermitidos) {
    if (req.body[k] !== undefined) updates[k] = req.body[k]
  }

  if (supabase) {
    const { error } = await supabase
      .from('configuracion_gimnasio')
      .upsert({ id: 1, ...updates, updated_at: new Date().toISOString(), updated_by: req.user.sub })
    if (error) return res.status(500).json({ error: 'Error al guardar configuración.' })
  } else {
    configMemoria = { ...configMemoria, ...updates }
  }

  res.json({ message: 'Configuración actualizada.' })
})

module.exports = router
