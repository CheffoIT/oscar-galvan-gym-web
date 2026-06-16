import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Input  from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))   // simula latencia de red
    const result = await login(email, password)
    setLoading(false)
    if (result.success) {
      const paths = { admin:'admin', entrenador:'entrenador', alumno:'alumno' }
      navigate(`/${paths[result.role]}`)
    } else {
      setError(result.error || 'Error al ingresar. Verificá tus credenciales.')
    }
  }

  return (
    <div className="min-h-screen bg-gym-black flex">

      {/* Panel izquierdo — decorativo */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #050505 0%, #0d0520 50%, #1a0540 100%)' }}>
        {/* Blobs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gym-purple/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-gym-yellow/8 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12 text-center">
          <div className="w-16 h-16 bg-gym-purple rounded-2xl flex items-center justify-center text-white font-display text-4xl mb-8 shadow-gym">
            G
          </div>
          <h1 className="font-display text-6xl tracking-wider text-gym-white leading-none mb-2">
            OSCAR<br/>
            <span className="text-gym-yellow">GALVAN</span>
          </h1>
          <p className="font-display text-2xl text-gym-purplel tracking-widest mt-2 mb-8">
            FUERZA & MUSCULACIÓN
          </p>
          <div className="h-px w-24 bg-gym-purple mb-8" />
          <p className="text-gym-gray text-sm leading-relaxed max-w-xs">
            Plataforma de gestión para alumnos, entrenadores y administradores del gimnasio.
          </p>

        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-gym-purple rounded-xl flex items-center justify-center text-white font-display text-3xl mx-auto mb-3 shadow-gym">
              G
            </div>
            <h1 className="font-display text-4xl text-gym-white tracking-wider">
              OSCAR GALVAN <span className="text-gym-yellow">GYM</span>
            </h1>
          </div>

          {/* Heading */}
          <h2 className="font-display text-3xl text-gym-white tracking-wider mb-2">INGRESAR</h2>
          <p className="text-gym-gray text-sm mb-8">Accedé a tu panel personal.</p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              icon="✉️"
              required
            />
            <Input
              id="password"
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              icon="🔒"
              required
            />

            {error && (
              <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Ingresar →'}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gym-border" />
            <span className="text-gym-grays text-xs">o</span>
            <div className="flex-1 h-px bg-gym-border" />
          </div>

          {/* Register + back */}
          <div className="text-center space-y-2">
            <p className="text-gym-gray text-sm">
              ¿No tenés cuenta?{' '}
              <Link to="/register" className="text-gym-purplel hover:text-gym-yellow transition-colors font-medium">
                Registrate acá
              </Link>
            </p>
            <Link to="/" className="block text-gym-gray text-sm hover:text-gym-yellow transition-colors">
              ← Volver al sitio del gimnasio
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
