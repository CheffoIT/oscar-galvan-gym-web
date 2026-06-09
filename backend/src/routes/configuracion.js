const router = require('express').Router()
const { authenticate, authorize } = require('../middlewares/auth')

// Datos en memoria (reemplazar con Supabase tabla configuracion_gimnasio)
let configData = {
  nombre:       'Oscar Galvan Fuerza y Musculacion',
  whatsapp:     '+5492615551234',
  instagram:    'oscargalvanfym',
  direccion:    'Av. San Martín 1234, Godoy Cruz, Mendoza',
  cbu:          '0000003100012345678900',
  alias:        'OSCAR.GYM.FUERZA',
  fraseHero:    'TRANSFORMA TU CUERPO, TRANSFORMA TU VIDA',
  mostrarPrecios: true,
  updatedAt:    new Date().toISOString(),
}

// GET /api/configuracion — pública (landing la usa)
router.get('/', (req, res) => {
  // Devolver solo datos públicos sin datos sensibles internos
  const { cbu, alias, nombre, whatsapp, instagram, direccion, fraseHero, mostrarPrecios } = configData
  res.json({ data: { cbu, alias, nombre, whatsapp, instagram, direccion, fraseHero, mostrarPrecios } })
})

// PUT /api/configuracion — solo admin
router.put('/', authenticate, authorize('admin'), (req, res) => {
  configData = { ...configData, ...req.body, updatedAt: new Date().toISOString() }
  // TODO: persistir en Supabase
  res.json({ message: 'Configuración actualizada', data: configData })
})

module.exports = router
