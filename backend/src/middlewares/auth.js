const jwt = require('jsonwebtoken')

// JWT_SECRET DEBE estar en .env. Sin el el servidor no puede autenticar.
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET no esta definido en .env')
  console.error('   Generalo con: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"')
  if (process.env.NODE_ENV === 'production') process.exit(1)
}

/**
 * Middleware de autenticacion.
 * Acepta JWT en el header Authorization: Bearer <token>
 * NUNCA acepta algoritmo 'none'.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Autenticacion requerida.' })
  }

  const secret = process.env.JWT_SECRET
  if (!secret) {
    return res.status(503).json({ error: 'Servidor mal configurado.' })
  }

  try {
    // algorithms: ['HS256'] impide el ataque 'alg:none'
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] })
    req.user = decoded
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sesion expirada. Ingresa nuevamente.' })
    }
    return res.status(401).json({ error: 'Token invalido.' })
  }
}

/**
 * Middleware de autorizacion por rol.
 * Uso: authorize('admin') o authorize('admin', 'entrenador')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticacion requerida.' })
  }
  if (!roles.includes(req.user.rol)) {
    return res.status(403).json({ error: 'No tenes permisos para realizar esta accion.' })
  }
  next()
}

module.exports = { authenticate, authorize }
