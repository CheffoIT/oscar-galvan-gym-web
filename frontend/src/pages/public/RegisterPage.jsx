import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../services/supabaseClient'
import Input  from '../../components/ui/Input'
import Button from '../../components/ui/Button'

// ─── Política de contraseñas ──────────────────────────────────────────────
const PASSWORD_MIN = 12

function checkPassword(pw) {
  const checks = {
    length:    pw.length >= PASSWORD_MIN,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    number:    /[0-9]/.test(pw),
    symbol:    /[^A-Za-z0-9]/.test(pw),
  }
  const ok = Object.values(checks).every(Boolean)
  return { checks, ok }
}

function PasswordStrength({ password }) {
  if (!password) return null
  const { checks } = checkPassword(password)
  const passed = Object.values(checks).filter(Boolean).length
  const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-400', 'bg-green-500']
  const labels = ['', 'Muy débil', 'Débil', 'Regular', 'Buena', 'Fuerte']

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-200 ${i <= passed ? colors[passed] : 'bg-gym-border'}`} />
        ))}
      </div>
      <p className={`text-xs ${passed < 3 ? 'text-red-400' : passed < 5 ? 'text-yellow-400' : 'text-green-400'}`}>
        {labels[passed] || ''}
      </p>
      <ul className="text-xs text-gym-gray space-y-0.5">
        <li className={checks.length    ? 'text-green-400' : ''}>{'✓'} {PASSWORD_MIN}+ caracteres</li>
        <li className={checks.uppercase ? 'text-green-400' : ''}>{'✓'} Mayúscula</li>
        <li className={checks.lowercase ? 'text-green-400' : ''}>{'✓'} Minúscula</li>
        <li className={checks.number    ? 'text-green-400' : ''}>{'✓'} Número</li>
        <li className={checks.symbol    ? 'text-green-400' : ''}>{'✓'} Símbolo (!@#$%...)</li>
      </ul>
    </div>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', password: '', confirmar: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading]         = useState(false)
  const [error,   setError]           = useState('')
  const [success, setSuccess]         = useState(false)

  const set = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }))
    setFieldErrors(p => ({ ...p, [field]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.nombre.trim() || form.nombre.trim().length < 2) {
      errs.nombre = 'El nombre debe tener al menos 2 caracteres.'
    }
    if (!form.apellido.trim() || form.apellido.trim().length < 2) {
      errs.apellido = 'El apellido debe tener al menos 2 caracteres.'
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'El email no es válido.'
    }
    const { ok, checks } = checkPassword(form.password)
    if (!ok) {
      const problemas = []
      if (!checks.length)    problemas.push(`mín. ${PASSWORD_MIN} caracteres`)
      if (!checks.uppercase) problemas.push('una mayúscula')
      if (!checks.lowercase) problemas.push('una minúscula')
      if (!checks.number)    problemas.push('un número')
      if (!checks.symbol)    problemas.push('un símbolo')
      errs.password = `La contraseña necesita: ${problemas.join(', ')}.`
    }
    if (form.password !== form.confirmar) {
      errs.confirmar = 'Las contraseñas no coinciden.'
    }
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }

    if (!supabase) {
      setError('Error de configuración. Contactá al administrador.')
      return
    }

    setLoading(true)

    // El rol SIEMPRE es 'alumno' en el registro público.
    // El servidor valida esto también — el cliente no puede cambiarlo.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email:    form.email.trim().toLowerCase(),
      password: form.password,
      options: {
        data: {
          nombre:   form.nombre.trim(),
          apellido: form.apellido.trim(),
          rol:      'alumno',
        },
      },
    })

    if (signUpError) {
      const msg = signUpError.message.toLowerCase()
      if (msg.includes('already registered') || msg.includes('already exists')) {
        setError('No se pudo crear la cuenta. Verificá los datos ingresados.')
      } else if (msg.includes('invalid') && msg.includes('email')) {
        setFieldErrors(p => ({ ...p, email: 'El formato del email es inválido.' }))
      } else if (msg.includes('signup is disabled')) {
        setError('El registro está temporalmente desactivado. Contactá al gimnasio.')
      } else {
        setError('No se pudo crear la cuenta. Intentá nuevamente.')
      }
      setLoading(false)
      return
    }

    // Si el trigger de Supabase no crea el perfil automáticamente, lo creamos nosotros
    if (data.session && data.user) {
      await supabase.from('perfiles').upsert({
        id:       data.user.id,
        nombre:   form.nombre.trim(),
        apellido: form.apellido.trim(),
        rol:      'alumno',
        activo:   true,
      }, { onConflict: 'id' })
    }

    setLoading(false)
    setSuccess(true)
  }

  // ── Pantalla de éxito ───────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gym-black flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-16 h-16 bg-green-500/20 border border-green-500/40 rounded-full flex items-center justify-center text-3xl mx-auto">
            ✅
          </div>
          <div>
            <h2 className="font-display text-3xl text-gym-white tracking-wider mb-2">¡LISTO!</h2>
            <p className="text-gym-gray text-sm leading-relaxed">
              Tu cuenta fue creada exitosamente.<br/>
              Ya podés ingresar con tu email y contraseña.
            </p>
          </div>
          <Button variant="primary" size="lg" fullWidth onClick={() => navigate('/login')}>
            Ir al ingreso
          </Button>
        </div>
      </div>
    )
  }

  // ── Formulario ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gym-black flex">

      {/* Panel izquierdo decorativo */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #050505 0%, #0d0520 50%, #1a0540 100%)' }}>
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
          <p className="font-display text-2xl text-gym-purple tracking-widest mt-2 mb-8">
            FUERZA &amp; MUSCULACIÓN
          </p>
          <div className="h-px w-24 bg-gym-purple mb-8" />
          <p className="text-gym-gray text-sm leading-relaxed max-w-xs">
            Creá tu cuenta y accedé a tus rutinas, progreso y pagos desde cualquier dispositivo.
          </p>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Logo mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-gym-purple rounded-xl flex items-center justify-center text-white font-display text-3xl mx-auto mb-3 shadow-gym">
              G
            </div>
            <h1 className="font-display text-4xl text-gym-white tracking-wider">
              OSCAR GALVAN <span className="text-gym-yellow">GYM</span>
            </h1>
          </div>

          <h2 className="font-display text-3xl text-gym-white tracking-wider mb-1">CREAR CUENTA</h2>
          <p className="text-gym-gray text-sm mb-6">Completá tus datos para registrarte como alumno.</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  label="Nombre *"
                  placeholder="Juan"
                  value={form.nombre}
                  onChange={set('nombre')}
                  required
                  autoComplete="given-name"
                />
                {fieldErrors.nombre && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.nombre}</p>
                )}
              </div>
              <div>
                <Input
                  label="Apellido *"
                  placeholder="Pérez"
                  value={form.apellido}
                  onChange={set('apellido')}
                  required
                  autoComplete="family-name"
                />
                {fieldErrors.apellido && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.apellido}</p>
                )}
              </div>
            </div>

            <div>
              <Input
                label="Email *"
                type="email"
                placeholder="juan@email.com"
                value={form.email}
                onChange={set('email')}
                required
                autoComplete="email"
              />
              {fieldErrors.email && (
                <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <Input
                label="Contraseña *"
                type="password"
                placeholder="Mínimo 12 caracteres"
                value={form.password}
                onChange={set('password')}
                required
                autoComplete="new-password"
              />
              <PasswordStrength password={form.password} />
              {fieldErrors.password && (
                <p className="text-red-400 text-xs mt-1">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <Input
                label="Confirmar contraseña *"
                type="password"
                placeholder="Repetí tu contraseña"
                value={form.confirmar}
                onChange={set('confirmar')}
                required
                autoComplete="new-password"
              />
              {fieldErrors.confirmar && (
                <p className="text-red-400 text-xs mt-1">{fieldErrors.confirmar}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>

            <p className="text-gym-gray text-xs text-center pt-2">
              ¿Sos entrenador o administrador?{' '}
              <span className="text-gym-purple">Pedile al administrador que te cree la cuenta.</span>
            </p>

          </form>

          <p className="text-center text-gym-gray text-sm mt-6">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="text-gym-yellow hover:text-gym-yellow/80 font-medium transition-colors">
              Ingresá aquí
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}
