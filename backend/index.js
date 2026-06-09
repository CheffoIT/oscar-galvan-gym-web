require('dotenv').config()
const express = require('express')
const cors    = require('cors')

const app  = express()
const PORT = process.env.PORT || 3001

// ── Middlewares globales ──────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Logging básico en desarrollo
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString().slice(11,19)}] ${req.method} ${req.path}`)
    next()
  })
}

// ── Rutas ─────────────────────────────────────────────
app.use('/api/health',        require('./src/routes/health'))
app.use('/api/auth',          require('./src/routes/auth'))
app.use('/api/alumnos',       require('./src/routes/alumnos'))
app.use('/api/rutinas',       require('./src/routes/rutinas'))
app.use('/api/pagos',         require('./src/routes/pagos'))
app.use('/api/configuracion', require('./src/routes/configuracion'))

// ── 404 handler ───────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` })
})

// ── Error handler global ──────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Error no manejado:', err)
  res.status(500).json({ error: 'Error interno del servidor' })
})

// ── Iniciar servidor ──────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏋️  Oscar Galvan Gym Web — API`)
  console.log(`✅  Servidor corriendo en http://localhost:${PORT}`)
  console.log(`📡  Health check: http://localhost:${PORT}/api/health`)
  console.log(`🌱  Entorno: ${process.env.NODE_ENV || 'development'}\n`)
})

module.exports = app
