const router    = require('express').Router()
const jwt       = require('jsonwebtoken')
const bcrypt    = require('bcryptjs')

// Demo usuarios en memoria — reemplazar con Supabase Auth
const users = [
  { id:'0', nombre:'Oscar Galvan', email:'admin@gym.com',       passwordHash: bcrypt.hashSync('admin123',10),       rol:'admin' },
  { id:'1', nombre:'Carlos Ramos', email:'entrenador@gym.com',  passwordHash: bcrypt.hashSync('entrenador123',10),  rol:'entrenador' },
  { id:'2', nombre:'Lucas Fernández', email:'alumno@gym.com',   passwordHash: bcrypt.hashSync('alumno123',10),      rol:'alumno', alumnoId:'1' },
]

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' })
  }

  const user = users.find(u => u.email === email)
  if (!user) return res.status(401).json({ error: 'Credenciales incorrectas' })

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas' })

  const token = jwt.sign(
    { id: user.id, email: user.email, rol: user.rol, alumnoId: user.alumnoId },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '8h' }
  )

  res.json({
    token,
    user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol }
  })
})

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // Con JWT stateless el logout es del lado del cliente (borrar token)
  // Con Supabase Auth se usa supabase.auth.signOut()
  res.json({ message: 'Sesión cerrada' })
})

module.exports = router
