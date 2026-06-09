const router    = require('express').Router()
const { supabase } = require('../config/supabase')

// POST /api/auth/register
// Crea un usuario nuevo (alumno o entrenador) en Supabase Auth + tabla perfiles
router.post('/register', async (req, res) => {
  const { nombre, apellido, email, password, rol } = req.body

  if (!nombre || !apellido || !email || !password || !rol) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' })
  }

  if (!['alumno', 'entrenador'].includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido. Solo alumno o entrenador.' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' })
  }

  if (!supabase) {
    return res.status(503).json({ error: 'Servicio no disponible (Supabase no configurado).' })
  }

  // 1. Crear usuario en Supabase Auth (con email ya confirmado)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,   // sin paso de confirmación por email
    user_metadata: { nombre, apellido, rol },
  })

  if (authError) {
    const mensajes = {
      'User already registered': 'Ya existe una cuenta con ese email.',
      'Email address is invalid': 'El email ingresado no es válido.',
      'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
    }
    return res.status(400).json({ error: mensajes[authError.message] || authError.message })
  }

  const userId = authData.user.id

  // 2. Insertar perfil en la tabla perfiles
  const { error: perfilError } = await supabase
    .f