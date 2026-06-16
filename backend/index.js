require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const helmet  = require('helmet')
const { apiLimiter } = require('./src/middlewares/rateLimit')

// Validar variables de entorno criticas al arranque
const REQUIRED_ENV = ['JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
const missing = REQUIRED_ENV.filter(k => !process.env[k])
if (missing.length > 0) {
  console.error(`[FATAL] Variables de entorno faltantes: ${missing.join(', ')}`)
  if (process.env.NODE_ENV === 'production') {
    process.exit(1)
  } else {
    console.warn('[WARN] Continuando en modo desarrollo sin todas las variables. Funciones limitadas.')
  }
}

const app  = express()
const PORT = process.env.PORT || 3001

// CORS: lista blanca de origenes permitidos
const allowedOrigins = [...new Set([
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean))]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)  // curl, Postman, apps nativas
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS_BLOCKED:${origin}`))
  },
  credentials: true,
}))

// Cabeceras de seguridad HTTP
app.use(helmet({
  crossOriginEmbedderPolicy: false,  // evita romper assets de Supabase
}))

// Body parsing — limite para prevenir DoS
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: false, limit: '1mb' }))

// Logger minimo: NUNCA loguear body (puede contener passwords/tokens)
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path} [${req.ip}]`)
  next()
})

// Rate limiting global sobre /api/
app.use('/api/', apiLimiter)

// ─── Rutas ────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./src/routes/auth'))
app.use('/api/alumnos',       require('./src/routes/alumnos'))
app.use('/api/publico',       require('./src/routes/publico'))
app.use('/api/pagos',         require('./src/routes/pagos'))
app.use('/api/rutinas',       require('./src/routes/rutinas'))
app.use('/api/configuracion', require('./src/routes/configuracion'))
app.use('/api/whatsapp',      require('./src/routes/whatsapp'))
app.use('/api/health',        require('./src/routes/health'))

// Health check raiz
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }))

// 404 generico — sin exponer path ni metodo
app.use((_req, res) => res.status(404).json({ error: 'Recurso no encontrado.' }))

// Error handler: sin stack traces en produccion
app.use((err, _req, res, _next) => {
  if (err.message && err.message.startsWith('CORS_BLOCKED')) {
    return res.status(403).json({ error: 'Origen no permitido.' })
  }
  const isDev = process.env.NODE_ENV !== 'production'
  // No loguear datos del error completo en produccion para evitar info leaks
  console.error('[ERROR]', isDev ? err.stack : err.message)
  const msg = isDev ? err.message : 'Error interno del servidor.'
  res.status(500).json({ error: msg })
})

app.listen(PORT, () => {
  console.log(`[OK] Backend corriendo en http://localhost:${PORT}`)
  console.log(`[OK] Entorno: ${process.env.NODE_ENV || 'development'}`)
  console.log(`[OK] CORS origins: ${allowedOrigins.join(', ')}`)
})
