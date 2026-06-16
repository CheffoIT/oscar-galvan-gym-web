const rateLimit = require('express-rate-limit')

// ─── Utilidad: respuesta estándar de rate limit ────────────────────────────
const handler = (req, res) => {
  res.status(429).json({
    error: 'Demasiados intentos. Esperá unos minutos antes de volver a intentarlo.',
    retryAfter: Math.ceil(req.rateLimit?.resetTime
      ? (req.rateLimit.resetTime - Date.now()) / 1000
      : 60),
  })
}

// ─── Login / recuperación de contraseña: muy estricto ────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 10,                     // 10 intentos por IP
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skip: () => process.env.NODE_ENV === 'test',
})

// ─── Registro público: moderado ───────────────────────────────────────────
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hora
  max: 5,                      // 5 registros por IP por hora
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skip: () => process.env.NODE_ENV === 'test',
})

// ─── API general: protección contra abuso ────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 300,                    // 300 peticiones por IP
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skip: () => process.env.NODE_ENV === 'test',
})

// ─── Fichas públicas / QR: moderado ──────────────────────────────────────
const publicLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,  // 10 minutos
  max: 60,                     // 60 requests por IP
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skip: () => process.env.NODE_ENV === 'test',
})

// ─── Invitaciones: estricto ───────────────────────────────────────────────
const inviteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hora
  max: 20,                     // 20 por IP
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skip: () => process.env.NODE_ENV === 'test',
})

module.exports = { authLimiter, registerLimiter, apiLimiter, publicLimiter, inviteLimiter }
