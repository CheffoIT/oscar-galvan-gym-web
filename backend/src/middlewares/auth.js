const jwt = require('jsonwebtoken')

/**
 * Middleware de autenticación JWT.
 * Verifica el token en el header Authorization: Bearer <token>
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret')
    req.user = decoded
    next()
  } catch {
    return res.status(403).json({ error: 'Token inválido o expirado' })
  }
}

/**
 * Middleware de autorización por rol.
 * Uso: authorize('admin') o authorize(['admin','entrenador'])
 */
const authorize = (...roles) => {
  const allowed = roles.flat()
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autenticado' })
    if (!allowed.includes(req.user.rol)) {
      return res.status(403).json({ error: `Acceso restringido a: ${allowed.join(', ')}` })
    }
    next()
  }
}

module.exports = { authenticate, authorize }
