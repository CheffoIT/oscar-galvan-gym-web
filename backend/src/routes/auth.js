const router    = require('express').Router()
const { supabase } = require('../config/supabase')

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { nombre, apellido, email, password, rol } = req.body

  if (!nombre || !apellido || !email || !password || !rol) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' })
  }
  if (!['alumno', 'entrenador'].includes(rol)) {
    return res.status(400).json({ error: 'Rol invalido. Solo alumno o entrenador.' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contrasena debe tener al menos 6 caracteres.' })
  }
  if (!supabase) {
    return res.status(503).json({ error: 'Servicio no disponible (Supabase no configurado).' })
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre, apellido, rol },
  })

  if (authError) {
    const mensajes = {
      'User already registered': 'Ya existe una cuenta con ese email.',
      'Email address is invalid': 'El email ingresado no es valido.',
      'Password should be at least 6 characters': 'La contrasena debe tener al menos 6 caracteres.',
    }
    return res.status(400).json({ error: mensajes[authError.message] || authError.message })
  }

  const userId = authData.user.id

  const { error: perfilError } = await supabase
    .from('perfiles')
    .insert({ id: userId, nombre, apellido, email, rol, activo: true })

  if (perfilError) {
    await supabase.auth.admin.deleteUser(userId)
    return res.status(500).json({ error: 'Error al crear el perfil: ' + perfilError.message })
  }

  if (rol === 'alumno') {
    await supabase.from('alumnos').insert({ nombre, apellido, email, estado: 'activo' })
  }

  res.status(201).json({
    message: 'Cuenta creada exitosamente. Ya podes ingresar.',
    user: { id: userId, nombre, apellido, email, rol },
  })
})

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Sesion cerrada' })
})

module.exports = router
