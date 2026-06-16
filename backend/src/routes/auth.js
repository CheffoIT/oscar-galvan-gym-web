const router  = require('express').Router()
const crypto  = require('crypto')
const { supabase } = require('../config/supabase')
const { authenticate, authorize } = require('../middlewares/auth')
const { authLimiter, registerLimiter, inviteLimiter } = require('../middlewares/rateLimit')

// Politica de contrasenas
function validatePassword(password) {
  if (typeof password !== 'string') return 'La contrasena es invalida.'
  if (password.length < 12) return 'La contrasena debe tener al menos 12 caracteres.'
  if (!/[A-Z]/.test(password)) return 'La contrasena debe contener al menos una letra mayuscula.'
  if (!/[a-z]/.test(password)) return 'La contrasena debe contener al menos una letra minuscula.'
  if (!/[0-9]/.test(password)) return 'La contrasena debe contener al menos un numero.'
  if (!/[^A-Za-z0-9]/.test(password)) return 'La contrasena debe contener al menos un simbolo (!@#$%).'
  return null
}

function validateEmail(email) {
  if (typeof email !== 'string') return 'El email es invalido.'
  const trimmed = email.trim().toLowerCase()
  if (trimmed.length > 254) return 'El email es demasiado largo.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'El formato del email es invalido.'
  return null
}

// POST /api/auth/register — solo alumno desde registro publico
router.post('/register', registerLimiter, async (req, res) => {
  const { nombre, apellido, email, password } = req.body

  const emailErr = validateEmail(email)
  if (emailErr) return res.status(400).json({ error: emailErr })

  const passErr = validatePassword(password)
  if (passErr) return res.status(400).json({ error: passErr })

  if (!nombre || String(nombre).trim().length < 2) {
    return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres.' })
  }
  if (!apellido || String(apellido).trim().length < 2) {
    return res.status(400).json({ error: 'El apellido debe tener al menos 2 caracteres.' })
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: false,
    user_metadata: {
      nombre:   String(nombre).trim(),
      apellido: String(apellido).trim(),
      rol:      'alumno',  // SIEMPRE alumno en registro publico
    },
  })

  if (error) {
    // Respuesta generica para no revelar si el email ya existe
    return res.status(400).json({ error: 'No se pudo crear la cuenta. Verificá los datos ingresados.' })
  }

  // Crear perfil en la tabla perfiles
  await supabase.from('perfiles').upsert({
    id:       data.user.id,
    nombre:   String(nombre).trim(),
    apellido: String(apellido).trim(),
    rol:      'alumno',
    activo:   true,
  }, { onConflict: 'id' })

  return res.status(201).json({ message: 'Cuenta creada exitosamente.' })
})

// POST /api/auth/me — datos del usuario autenticado
router.get('/me', authenticate, async (req, res) => {
  const { data: perfil, error } = await supabase
    .from('perfiles')
    .select('id, nombre, apellido, rol, activo')
    .eq('id', req.user.sub)
    .single()

  if (error || !perfil) return res.status(404).json({ error: 'Usuario no encontrado.' })
  if (!perfil.activo) return res.status(403).json({ error: 'Cuenta desactivada.' })

  return res.json({
    id:       perfil.id,
    nombre:   perfil.nombre,
    apellido: perfil.apellido,
    rol:      perfil.rol,
  })
})

// POST /api/auth/recuperar-password — respuesta siempre igual (anti-enumeracion)
router.post('/recuperar-password', authLimiter, async (req, res) => {
  const { email } = req.body
  const emailErr = validateEmail(email)
  if (!emailErr) {
    await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase()).catch(() => {})
  }
  // Siempre misma respuesta independientemente de si el email existe
  return res.json({ message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña.' })
})

// POST /api/auth/invitar — admin/entrenador invita a un alumno
router.post('/invitar', authenticate, authorize('admin', 'entrenador'), inviteLimiter, async (req, res) => {
  const { email, rol = 'alumno' } = req.body

  const emailErr = validateEmail(email)
  if (emailErr) return res.status(400).json({ error: emailErr })

  const rolesPermitidos = ['alumno']
  if (req.user.rol === 'admin') rolesPermitidos.push('entrenador')
  if (!rolesPermitidos.includes(rol)) {
    return res.status(403).json({ error: 'No tenes permiso para invitar con ese rol.' })
  }

  const tokenRaw  = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex')
  const expiraEn  = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { error } = await supabase.from('invitaciones').insert({
    email:      email.trim().toLowerCase(),
    rol,
    token_hash: tokenHash,
    expira_en:  expiraEn,
    created_by: req.user.sub,
    usada:      false,
  })

  if (error) return res.status(500).json({ error: 'No se pudo crear la invitacion.' })

  // En produccion: enviar tokenRaw por email al invitado
  // Por ahora se retorna en la respuesta para pruebas (solo en desarrollo)
  const responseData = { message: 'Invitacion creada.' }
  if (process.env.NODE_ENV !== 'production') {
    responseData.token = tokenRaw
    responseData.link  = `${process.env.FRONTEND_URL}/activar?token=${tokenRaw}`
  }

  return res.status(201).json(responseData)
})

// POST /api/auth/activar — alumno activa su cuenta con el token de invitacion
router.post('/activar', async (req, res) => {
  const { token, password } = req.body

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token requerido.' })
  }

  const passErr = validatePassword(password)
  if (passErr) return res.status(400).json({ error: passErr })

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  const { data: inv, error: invErr } = await supabase
    .from('invitaciones')
    .select('*')
    .eq('token_hash', tokenHash)
    .eq('usada', false)
    .gt('expira_en', new Date().toISOString())
    .single()

  if (invErr || !inv) {
    return res.status(400).json({ error: 'Token invalido o expirado.' })
  }

  // Crear usuario en Supabase Auth
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: inv.email,
    password,
    email_confirm: true,
    user_metadata: { rol: inv.rol },
  })

  if (authErr) {
    return res.status(400).json({ error: 'No se pudo activar la cuenta.' })
  }

  // Crear perfil
  await supabase.from('perfiles').upsert({
    id:     authData.user.id,
    rol:    inv.rol,
    activo: true,
  }, { onConflict: 'id' })

  // Marcar invitacion como usada
  await supabase.from('invitaciones').update({ usada: true }).eq('id', inv.id)

  return res.json({ message: 'Cuenta activada exitosamente.' })
})

module.exports = router
