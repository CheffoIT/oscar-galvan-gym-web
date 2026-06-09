import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card   from '../../components/ui/Card'
import Badge  from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal  from '../../components/ui/Modal'
import Input  from '../../components/ui/Input'
import { getRutinas, getAlumnos } from '../../services/api'
import { supabase } from '../../services/supabaseClient'

export default function RutinasPage() {
  const [rutinas,   setRutinas]   = useState([])
  const [alumnos,   setAlumnos]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form,      setForm]      = useState({ nombre: '', descripcion: '', alumno_id: '', fecha_inicio: new Date().toISOString().split('T')[0] })
  const [saving,    setSaving]    = useState(false)
  const [saveMsg,   setSaveMsg]   = useState('')
  const [saveError, setSaveError] = useState('')
  const [modalVer,  setModalVer]  = useState(null)

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    const [{ data: rutinasData }, { data: alumnosData }] = await Promise.all([
      getRutinas(),
      getAlumnos(),
    ])
    setRutinas(rutinasData || [])
    setAlumnos(alumnosData || [])
    setLoading(false)
  }, [])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  const handleGuardar = async (e) => {
    e.preventDefault()
    if (!form.nombre || !form.alumno_id) {
      setSaveError('El nombre y el alumno son obligatorios.')
      return
    }
    setSaving(true)
    setSaveError('')

    if (supabase) {
      const { error } = await supabase.from('rutinas').insert({
        nombre:       form.nombre,
        descripcion:  form.descripcion,
        alumno_id:    form.alumno_id,
        fecha_inicio: form.fecha_inicio,
        activa:       true,
      })
      if (error) {
        setSaveError('Error al crear: ' + (error.message || error))
        setSaving(false)
        return
      }
    }

    setSaveMsg('✅ Rutina creada.')
    await cargarDatos()
    setTimeout(() => { setModalOpen(false); setForm({ nombre: '', descripcion: '', alumno_id: '', fecha_inicio: new Date().toISOString().split('T')[0] }); setSaveMsg('') }, 1500)
    setSaving(false)
  }

  const toggleActiva = async (rutina) => {
    if (!supabase) return
    await supabase.from('rutinas').update({ activa: !rutina.activa }).eq('id', rutina.id)
    await cargarDatos()
  }

  // Nombre del alumno desde la relación
  const getNombreAlumno = (rutina) => {
    if (rutina.alumnos) return `${rutina.alumnos.nombre} ${rutina.alumnos.apellido}`
    const a = alumnos.find(al => al.id === rutina.alumno_id)
    return a ? `${a.nombre} ${a.apellido}` : 'Sin alumno'
  }

  // Ejercicios del día (desde rutina_ejercicios)
  const getEjerciciosPorDia = (rutina) => {
    const ejercicios = rutina.rutina_ejercicios || []
    const byDia = {}
    ejercicios.forEach(re => {
      const dia = re.dia || 'Sin día'
      if (!byDia[dia]) byDia[dia] = []
      byDia[dia].push(re.ejercicios?.nombre || 'Ejercicio')
    })
    return Object.entries(byDia)
  }

  return (
    <DashboardLayout title="Rutinas">
      <div className="flex items-center justify-between mb-6">
        <p className="text-gym-gray text-sm">{rutinas.length} rutinas cargadas</p>
        <Button variant="primary" onClick={() => { setSaveMsg(''); setSaveError(''); setModalOpen(true) }}>
          + Nueva rutina
        </Button>
      </div>

      {loading ? (
        <p className="text-gym-gray text-sm text-center py-8">Cargando rutinas...</p>
      ) : rutinas.length === 0 ? (
        <div className="text-center py-12 text-gym-gray">
          <p className="text-4xl mb-3">📋</p>
          <p>No hay rutinas cargadas aún.</p>
          <p className="text-xs mt-1">Usá el botón "+ Nueva rutina" para crear la primera.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {rutinas.map(r => {
            const dias = getEjerciciosPorDia(r)
            return (
              <Card key={r.id} accent={r.activa}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display text-lg text-gym-white tracking-wider">{r.nombre}</h3>
                    <p className="text-gym-gray text-xs mt-0.5">
                      Entrenador: {r.entrenadores?.perfiles ? `${r.entrenadores.perfiles.nombre} ${r.entrenadores.perfiles.apellido}` : 'Sin asignar'}
                    </p>
                  </div>
                  <Badge status={r.activa ? 'activo' : 'inactivo'} label={r.activa ? 'Activa' : 'Inactiva'} />
                </div>

                {/* Alumno */}
                <div className="flex items-center gap-2 mb-3 bg-gym-border/40 rounded-lg px-3 py-2">
                  <span className="text-base">👤</span>
                  <p className="text-gym-white text-sm">{getNombreAlumno(r)}</p>
                </div>

                {r.descripcion && (
                  <p className="text-gym-gray text-xs mb-4 leading-relaxed">{r.descripcion}</p>
                )}

                {/* Ejercicios por día */}
                {dias.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {dias.map(([dia, ejercicios]) => (
                      <div key={dia} className="bg-gym-black/40 rounded-lg px-3 py-2">
                        <p className="text-gym-yellow text-xs font-semibold mb-1">{dia}</p>
                        <p className="text-gym-gray text-xs">{ejercicios.join(' · ')}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gym-grays text-xs mb-4 italic">Sin ejercicios asignados aún.</p>
                )}

                {/* Footer */}
                <div className="flex gap-2 pt-2 border-t border-gym-border">
                  <Button variant="secondary" size="sm" fullWidth onClick={() => setModalVer(r)}>
                    Ver detalle
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleActiva(r)}>
                    {r.activa ? '⏸' : '▶️'}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal: Nueva rutina */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="NUEVA RUTINA">
        <form onSubmit={handleGuardar} className="space-y-4">
          <Input label="Nombre de la rutina *" placeholder="Ej: Fuerza Hipertrofia A/B"
            value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} required />
          <div>
            <label className="block text-sm font-medium text-gym-gray mb-1.5">Alumno *</label>
            <select value={form.alumno_id} onChange={e => setForm(p => ({ ...p, alumno_id: e.target.value }))}
              className="gym-input w-full text-sm" required>
              <option value="">Seleccioná un alumno...</option>
              {alumnos.map(a => (
                <option key={a.id} value={a.id}>{a.nombre} {a.apellido}</option>
              ))}
            </select>
          </div>
          <Input label="Fecha de inicio" type="date" value={form.fecha_inicio}
            onChange={e => setForm(p => ({ ...p, fecha_inicio: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium text-gym-gray mb-1.5">Descripción</label>
            <textarea rows={2} value={form.descripcion}
              onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
              placeholder="Descripción de la rutina..."
              className="w-full bg-gym-dark border border-gym-border text-gym-white placeholder:text-gym-grays
                rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gym-purple resize-none" />
          </div>
          {saveError && <p className="text-red-400 text-sm">{saveError}</p>}
          {saveMsg   && <p className="text-green-400 text-sm">{saveMsg}</p>}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? 'Creando...' : 'Crear rutina'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Ver detalle rutina */}
      <Modal isOpen={!!modalVer} onClose={() => setModalVer(null)} title="DETALLE DE RUTINA">
        {modalVer && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gym-yellow font-semibold text-lg">{modalVer.nombre}</p>
                <p className="text-gym-gray text-sm">Alumno: {getNombreAlumno(modalVer)}</p>
              </div>
              <Badge status={modalVer.activa ? 'activo' : 'inactivo'} label={modalVer.activa ? 'Activa' : 'Inactiva'} />
            </div>
            {modalVer.descripcion && (
              <p className="text-gym-gray text-sm">{modalVer.descripcion}</p>
            )}
            <div>
              <p className="text-gym-gray text-xs mb-2">Fecha inicio: {modalVer.fecha_inicio || '—'}</p>
              {getEjerciciosPorDia(modalVer).length === 0 ? (
                <p className="text-gym-grays text-xs italic">Sin ejercicios asignados.</p>
              ) : (
                <div className="space-y-2">
                  {getEjerciciosPorDia(modalVer).map(([dia, ejercicios]) => (
                    <div key={dia} className="bg-gym-black/40 rounded-lg px-3 py-2">
                      <p className="text-gym-yellow text-xs font-semibold mb-1">{dia}</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {ejercicios.map((ej, i) => (
                          <li key={i} className="text-gym-gray text-xs">{ej}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button variant="ghost" fullWidth onClick={() => setModalVer(null)}>Cerrar</Button>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}
