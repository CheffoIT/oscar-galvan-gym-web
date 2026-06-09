const router = require('express').Router()
const { supabase } = require('../config/supabase')

// GET /api/health — estado del servidor
router.get('/', async (req, res) => {
  const dbStatus = supabase ? 'conectado' : 'sin configurar (.env faltante)'
  res.json({
    status:    'OK',
    app:       'Oscar Galvan Gym Web API',
    version:   '1.0.0',
    timestamp: new Date().toISOString(),
    database:  dbStatus,
    env:       process.env.NODE_ENV || 'development',
  })
})

module.exports = router
