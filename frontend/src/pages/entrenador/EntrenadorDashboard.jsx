import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card    from '../../components/ui/Card'
import Badge   from '../../components/ui/Badge'
import Button  from '../../components/ui/Button'
import Modal   from '../../components/ui/Modal'
import Input   from '../../components/ui/Input'
import StatCard from '../../components/ui/StatCard'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../services/supabaseClient'
import { alumnosMock } from '../../data/alumnosMock'
import { rutinasMock }  from '../../data/rutinasMock'

export default function EntrenadorDashboard() {
  const { user } = useAuth()
  const [entrenadorId, setEntrenadorId] = useState(null)
  const [misAlumnos,   setMisAlumnos]   = useState([])
  const [misRutinas,   setMisRutinas]   = useState([])
  const [loading,      setLoading]      = useState(true)
  const [modalAlumno,  setModalAlumno]  = useState(null) // alumno a ver
  const [modalRutina,  setModalRutina]  = useState(false)
  const [formRutina,   setFormRutina]   = useState({ nombre: '', descripcion: '', alumno_id: '', fecha_inicio: new Date().toISOString().split('T')[0] })
  const [saving,       setSaving]       = useState(false)
  const [saveMsg,      setSaveMsg]      = useState('')
  const [saveError,    setSaveError]    = useState('')

  const cargarDatos = useCallback(async () => {
    setLoading(true)

    if (supabase && user?.id) {
      // Obtener el ID del registro de entrenador para este usuario
      const { data: entData } = await supabase
        .from('entrenadores')
        .select('id')
        .eq('perfil_id', user.id)
        .single()

      const entId = entData?.id
      setEntrenadorId(entId)

      if (entId) {
        // Cargar alumnos asignados a este entrenador
        const { data: alumnosData } = await supabase
          .from('alumnos')
          .select('id, nombre, apellido, email, telefono, estado, dni')
          .eq('entrenador_id', entId)
          .order('apellido')

        // Cargar rutinas de este entrenador
        const { data: rutinasData } = await supabase
          .from('rutinas')
          .select(`
            id, nombre, descripcion, activa, fecha_inicio,
            alumnos ( nombre, apellido )
          `)
          .eq('entrenador_id', entId)
          .order('created_at', { ascending: false })

        setMisAlumnos(alumnosData || [])
        setMisRutinas(rutinasData || [])
      } else {
        // Entrenador sin registro en tabla entrenadores — mostrar aviso
        setMisAlumnos([])
        setMisRutinas([])
      }
    } else {
      // Fallback mock
      setMisAlumnos(alumnosMock.filter(a => a.entrenadorId === '1'))
      setMisRutinas(rutinasMock.filter(r => r.entrenadorId === '1'))
    }

    setLoading(false)
  }, [user?.id])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  const handleCrearRutina = async (e) => {
    e.preventDefault()
    if (!formRutina.nombre || !formRutina.alumno_id) {
      setSaveError('El nombre y el alumno son obligatorios.')
      return
    }
    setSaving(true)
    setSaveError('')

    if (supabase) {
      const { error } = await supabase.from('rutinas').insert({
        nombre:       formRutina.nombre,
        descripcion:  formRutina.descripcion,
        alumno_id:    formRutina.alumno_id,
        entrenador_id:entrenadorId,
        fecha_inicio: formRutina.fecha_inicio,
        activa:       true,
      })
      if (error) {
        setSaveError('Error: ' + (error.message || error))
        setSaving(false)
        return
      }
    }

    setSaveMsg('✅ Rutina creada.')
    await cargarDatos()
    setTimeout(() => {
      setModalRutina(false)
      setFormRutina({ nombre: '', descripcion: '', alumno_id: '', fecha_inicio: new Date().toISOString().split('T')[0] })
      setSaveMsg('')
    }, 1500)
    setSaving(false)
  }

  const getNombreAlumnoRutina = (r) =>
    r.alumnos ? `${r.alumnos.nombre} ${r.alumnos.apellido}` : '—'

  return (
    <DashboardLayout title="Panel Entrenador">
      <div className="mb-6">
        <h2 className="font-display text-2xl text-gym-white tracking-wider">
          BIENVENIDO, <span className="text-gym-yellow">{user?.nombre?.toUpperCase() || 'ENTRENADOR'}</span>
        </h2>
        <p className="text-gym-gray text-sm mt-1">Gestioná tus alumnos y rutinas desde acá.</p>
      </div>

      {loading ? (
        <p className="text-gym-gray text-sm text-center py-8">Cargando datos...</p>
      ) : (
        <>
          {/* Aviso si no tiene registro de entrenador */}
          {supabase && !entrenadorId && (
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4 mb-6">
              <p className="text-yellow-400 text-sm">
                ⚠️ Tu usuario no tiene un registro en la tabla <strong>entrenadores</strong>.
                Pedile al admin que verifique la configuración de tu cuenta.
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatCard icon="👥" label="Mis alumnos"  value={misAlumnos.length}                        accentColor="yellow" />
            <StatCard icon="📋" label="Mis rutinas"  value={misRutinas.length}                        accentColor="purple" />
            <StatCard icon="✅" label="Activos"      value={misAlumnos.filter(a=>a.estado==='activo').length} accentColor="green" />
            <StatCard icon="📅" label="Hoy"          value={new Date().toLocaleDateString('es-AR',{day:'numeric',month:'short'})} accentColor="white" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mis alumnos */}
            <Card hover={false}>
              <h3 className="font-display text-lg text-gym-white tracking-wider mb-4">MIS ALUMNOS</h3>
              {misAlumnos.length === 0 ? (
                <p className="text-gym-gray text-sm text-center py-6">No tenés alumnos asignados aún.</p>
              ) : (
                <div className="space-y-3">
                  {misAlumnos.map(a => (
                    <div key={a.id}
                      className="flex items-center justify-between py-3 border-b border-gym-border last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gym-purple/30 border border-gym-purple/50 rounded-full
                          flex items-center justify-center text-gym-purplel font-bold text-sm">
                          {(a.nombre || '?')[0]}
                        </div>
                        <div>
                          <p className="text-gym-white text-sm font-medium">{a.nombre} {a.apellido}</p>
                          <p className="text-gym-gray text-xs">{a.email || 'Sin email'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge status={a.estado} />
                        <Button variant="ghost" size="sm" onClick={() => setModalAlumno(a)}>Ver</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Mis rutinas */}
            <Card hover={false}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg text-gym-white tracking-wider">MIS RUTINAS</h3>
                <Button variant="secondary" size="sm" onClick={() => { setSaveMsg(''); setSaveError(''); setModalRutina(true) }}>
                  + Nueva
                </Button>
              </div>
              {misRutinas.length === 0 ? (
                <p className="text-gym-gray text-sm text-center py-6">No creaste rutinas aún.</p>
              ) : (
                <div className="space-y-3">
                  {misRutinas.map(r => (
                    <div key={r.id}
                      className="bg-gym-black/40 border border-gym-border rounded-xl p-4
                        hover:border-gym-purple/40 transition-all">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-gym-white font-medium text-sm">{r.nombre}</p>
                          <p className="text-gym-gray text-xs mt-0.5">👤 {getNombreAlumnoRutina(r)}</p>
                        </div>
                        <Badge status={r.activa ? 'activo' : 'inactivo'} label={r.activa ? 'Activa' : 'Inactiva'} />
                      </div>
                      {r.descripcion && (
                        <p className="text-gym-grays text-xs mt-2 line-clamp-2">{r.descripcion}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Acceso rápido QR */}
            <Card hover={false} accent className="lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg text-gym-white tracking-wider mb-1">
                    📱 REGISTRAR ASISTENCIA
                  </h3>
                  <p className="text-gym-gray text-sm">
                    Pedile al alumno que muestre su QR o buscalo manualmente.
                  </p>
                </div>
                <Button variant="primary" size="lg" onClick={() => alert('Función QR en desarrollo. Por ahora usá el registro manual.')}>
                  Registrar asistencia
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Modal: Ver alumno */}
      <Modal isOpen={!!modalAlumno} onClose={() => setModalAlumno(null)} title="DETALLE DEL ALUMNO">
        {modalAlumno && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gym-purple/30 border border-gym-purple/50 rounded-full
                flex items-center justify-center text-gym-purplel font-bold text-2xl">
                {(modalAlumno.nombre || '?')[0]}
              </div>
              <div>
                <p className="text-gym-white text-lg font-semibold">{modalAlumno.nombre} {modalAlumno.apellido}</p>
                <Badge status={modalAlumno.estado} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'DNI',      val: modalAlumno.dni       || '—' },
                { label: 'Email',    val: modalAlumno.email     || '—' },
                { label: 'Teléfono',val: modalAlumno.telefono  || '—' },
                { label: 'Estado',  val: modalAlumno.estado    || '—' },
              ].map(({ label, val }) => (
                <div key={label} className="bg-gym-black/40 border border-gym-border rounded-lg p-3">
                  <p className="text-gym-gray text-xs mb-0.5">{label}</p>
                  <p className="text-gym-white font-medium text-sm">{val}</p>
                </div>
              ))}
            </div>
            <Button variant="ghost" fullWidth onClick={() => setModalAlumno(null)}>Cerrar</Button>
          </div>
        )}
      </Modal>

      {/* Modal: Nueva rutina */}
      <Modal isOpen={modalRutina} onClose={() => setModalRutina(false)} title="NUEVA RUTINA">
        <form onSubmit={handleCrearRutina} className="space-y-4">
          <Input label="Nombre *" placeholder="Ej: Fuerza Hipertrofia A/B"
            value={formRutina.nombre} onChange={e => setFormRutina(p => ({ ...p, nombre: e.target.value }))} required />
          <div>
            <label className="block text-sm font-medium text-gym-gray mb-1.5">Alumno *</label>
            <select value={formRutina.alumno_id}
              onChange={e => setFormRutina(p => ({ ...p, alumno_id: e.target.value }))}
              className="gym-input w-full text-sm" required>
              <option value="">Seleccioná un alumno...</option>
              {misAlumnos.map(a => (
                <option key={a.id} value={a.id}>{a.nombre} {a.apellido}</option>
              ))}
            </select>
          </div>
          <Input label="Fecha de inicio" type="date" value={formRutina.fecha_inicio}
            onChange={e => setFormRutina(p => ({ ...p, fecha_inicio: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium text-gym-gray mb-1.5">Descripción</label>
            <textarea rows={2} value={formRutina.descripcion}
              onChange={e => setFormRutina(p => ({ ...p, descripcion: e.target.value }))}
              placeholder="Descripción..."
              className="w-full bg-gym-dark border border-gym-border text-gym-white placeholder:text-gym-grays
                rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gym-purple resize-none" />
          </div>
          {saveError && <p className="text-red-400 text-sm">{saveError}</p>}
          {saveMsg   && <p className="text-green-400 text-sm">{saveMsg}</p>}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" type="button" onClick={() => setModalRutina(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? 'Creando...' : 'Crear rutina'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}
