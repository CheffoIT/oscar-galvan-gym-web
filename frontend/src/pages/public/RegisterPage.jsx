import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../services/supabaseClient'
import Input  from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const ROLES = [
  {
    value: 'alumno',
    label: 'Alumno',
    icon: '🏋️',
    desc: 'Accede a tus rutinas, pagos y seguimiento personal.',
  },
  {
    value: 'entrenador',
    label: 'Entrenador',
    icon: '📋',
    desc: 'Gestiona rutinas y segui el progreso de tus alumnos.',
  },
]

export default function RegisterPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', password: '', confirmar: '', rol: '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.rol) {
      setError('Elegi si sos alumno o entrenador.')
      return
    }
    if (form.password !== form.confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (!supabase) {
      setError('Error de configuracion. Contacta al administrador.')
      return
    }

    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email:    form.email.trim().toLowerCase(),
      password: form.password,
      options: {
        data: {
          nombre:   form.nombre.trim(),
          apellido: form.apellido.trim(),
          rol:      form.rol,
        },
      },
    })

    if (signUpError) {
      const mensajes = {
        'User already registered':                    'Ya existe una cuenta con ese email.',
        'Email address is invalid':                   'El email ingresado no es valido.',
        'Password should be at least 6 characters':   'La contraseña debe tener al menos 6 caracteres.',
        'signup is disabled':                         'El registro esta temporalmente desactivado.',
      }
      setError(mensajes[signUpError.message] || signUpError.message)
      setLoading(false)
      return
    }

    // El trigger on_auth_user_created ya crea perfiles y alumnos automáticamente.
    // Solo hacemos upsert de seguridad sin campos que no existen en la tabla.
    if (data.session && data.user) {
      await supabase.from('perfiles').upsert({
        id:       data.user.id,
        nombre:   form.nombre.trim(),
        apellido: form.apellido.trim(),
        rol:      form.rol,
        activo:   true,
      }, { onConflict: 'id' })
    }

    setLoading(false)
    setSuccess(true)
  }

  return (
    <div className="min-h-screen bg-gym-black flex">

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
          <p className="font-display text-2xl text-gym-purplel tracking-widest mt-2 mb-8">
            FUERZA &amp; MUSCULACION
          </p>
          <div className="h-px w-24 bg-gym-purple mb-8" />
          <p className="text-gym-gray text-sm leading-relaxed max-w-xs">
            Crea tu cuenta y accede a tu panel personalizado con rutinas, pagos y seguimiento.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-gym-purple rounded-xl flex items-center justify-center text-white font-display text-3xl mx-auto mb-3 shadow-gym">
              G
            </div>
            <h1 className="font-display text-4xl text-gym-white tracking-wider">
              OSCAR GALVAN <span className="text-gym-yellow">GYM</span>
            </h1>
          </div>

          {success ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-500/20 border border-green-500/40 rounded-full flex items-center justify-center text-3xl mx-auto">
                ✅
              </div>
              <div>
                <h2 className="font-display text-3xl text-gym-white tracking-wider mb-2">LISTO!</h2>
                <p className="text-gym-gray text-sm">
                  Tu cuenta fue creada exitosamente.<br/>
                  Ya podes ingresar con tu email y contraseña.
                </p>
              </div>
              <Button variant="primary" size="lg" fullWidth onClick={() => navigate('/login')}>
                Ir al ingreso
              </Button>
            </div>
          ) : (
            <>
              <h2 className="font-display text-3xl text-gym-white tracking-wider mb-1">CREAR CUENTA</h2>
              <p className="text-gym-gray text-sm mb-6">Completa tus datos para registrarte.</p>

              <form onSubmit={handleSubmit} className="space-y-4">

                <div>
                  <label className="block text-sm font-medium text-gym-gray mb-2">
                    Soy... <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {ROLES.map(r => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, rol: r.value }))}
                        className={`
                          relative p-4 rounded-xl border-2 text-left transition-all duration-200
                          ${form.rol === r.value
                            ? 'border-gym-purple bg-gym-purple/20 shadow-gym'
                            : 'border-gym-border bg-gym-dark hover:border-gym-purple/50'}
                        `}
                      >
                        {form.rol === r.value && (
                          <span className="absolute top-2 right-2 w-2 h-2 bg-gym-yellow rounded-full" />
                        )}
                        <span className="text-2xl block mb-1">{r.icon}</span>
                        <span className="text-gym-white font-semibold text-sm block">{r.label}</span>
                        <span className="text-gym-gray text-xs leading-snug">{r.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Nombre *"
                    placeholder="Juan"
                    value={form.nombre}
                    onChange={set('nombre')}
                    required
                  />
                  <Input
                    label="Apellido *"
                    placeholder="Perez"
                    value={form.apellido}
                    onChange={set('apellido')}
                    required
                  />
                </div>

                <Input
                  label="Email *"
                  type="email"
                  placeholder="juan@email.com"
                  value={form.email}
                  onChange={set('email')}
                  icon="✉️"
                  required
                />

                <Input
                  label="Contraseña *"
                  type="password"
                  placeholder="Minimo 6 caracteres"
                  value={form.password}
                  onChange={set('password')}
                  icon="🔒"
                  required
                />

                <Input
                  label="Confirmar contraseña *"
                  type="password"
                  placeholder="Repeti la contraseña"
                  value={form.confirmar}
                  onChange={set('confirmar')}
                  icon="🔒"
                  required
                />

                {error && (
                  <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
                  {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                </Button>
              </form>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gym-border" />
                <span className="text-gym-grays text-xs">o</span>
                <div className="flex-1 h-px bg-gym-border" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-gym-gray text-sm">
                  Ya tenes cuenta?{' '}
                  <Link to="/login" className="text-gym-purplel hover:text-gym-yellow transition-colors font-medium">
                    Ingresa aca
                  </Link>
                </p>
                <Link to="/" className="block text-gym-gray text-sm hover:text-gym-yellow transition-colors">
                  Volver al sitio del gimnasio
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
                                                                                                                                      