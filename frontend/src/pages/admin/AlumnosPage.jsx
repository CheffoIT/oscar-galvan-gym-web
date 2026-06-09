import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Table  from '../../components/ui/Table'
import Badge  from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal  from '../../components/ui/Modal'
import Input  from '../../components/ui/Input'
import { getAlumnos, createAlumno, updateAlumno, getMembresias } from '../../services/api'

const ESTADO_INICIAL = {
  nombre: '', apellido: '', dni: '', email: '',
  telefono: '', fecha_nacimiento: '', observaciones: '',
}

export default function AlumnosPage() {
  const [alumnos,      setAlumnos]      = useState([])
  const [membresias,   setMembresias]   = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [filterEstado, setFilterEstado] = useState('todos')
  const [modalNuevo,   setModalNuevo]   = useState(false)
  const [modalVer,     setModalVer]     = useState(null)   // alumno seleccionado para ver
  const [modalEditar,  setModalEditar]  = useState(null)   // alumno a editar
  const [form,         setForm]         = useState(ESTADO_INICIAL)
  const [saving,       setSaving]       = useState(false)
  const [saveMsg,      setSaveMsg]      = useState('')
  const [saveError,    setSaveError]    = useState('')

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    const [{ data: alumnosData }, { data: membData }] = await Promise.all([
      getAlumnos(),
      getMembresias(),
    ])
    setAlumnos(alumnosData || [])
    setMembresias(membData || [])
    setLoading(false)
  }, [])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  // Filtro local (búsqueda y estado)
  const filtered = alumnos.filter(a => {
    const matchSearch = `${a.nombre} ${a.apellido} ${a.dni}`.toLowerCase().includes(search.toLowerCase())
    const matchEstado = filterEstado === 'todos' || a.estado === filterEstado
    return matchSearch && matchEstado
  })

  const resumen = {
    activos:   alumnos.filter(a => a.estado === 'activo').length,
    morosos:   alumnos.filter(a => a.estado === 'moroso').length,
    inactivos: alumnos.filter(a => a.estado === 'inactivo').length,
  }

  // Abrir editar con datos del alumno
  const abrirEditar = (alumno) => {
    setForm({
      nombre:           alumno.nombre           || '',
      apellido:         alumno.apellido         || '',
      dni:              alumno.dni              || '',
      email:            alumno.email            || '',
      telefono:         alumno.telefono         || '',
      fecha_nacimiento: alumno.fecha_nacimiento || '',
      observaciones:    alumno.observaciones    || '',
      estado:           alumno.estado           || 'activo',
    })
    setModalEditar(alumno)
    setSaveMsg('')
    setSaveError('')
  }

  const handleGuardar = async (e) => {
    e.preventDefault()
    if (!form.nombre || !form.apellido || !form.dni) {
      setSaveError('Nombre, apellido y DNI son obligatorios.')
      return
    }
    setSaving(true)
    setSaveError('')

    if (modalEditar) {
      // Editar existente
      const { error } = await updateAlumno(modalEditar.id, form)
      if (error) {
        setSaveError('Error al guardar: ' + (error.message || error))
      } else {
        setSaveMsg('✅ Alumno actualizado.')
        await cargarDatos()
        setTimeout(() => { setModalEditar(null); setSaveMsg('') }, 1500)
      }
    } else {
      // Crear nuevo
      const { error } = await createAlumno({ ...form, estado: 'activo' })
      if (error) {
        setSaveError('Error al crear: ' + (error.message || error))
      } else {
        setSaveMsg('✅ Alumno creado.')
        await cargarDatos()
        setTimeout(() => { setModalNuevo(false); setForm(ESTADO_INICIAL); setSaveMsg('') }, 1500)
      }
    }
    setSaving(false)
  }

  const columns = [
    {
      key: 'nombre',
      label: 'Alumno',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gym-purple/30 border border-gym-purple/50 rounded-full
            flex items-center justify-center text-gym-purplel font-bold text-sm flex-shrink-0">
            {(row.nombre || '?')[0]}
          </div>
          <div>
            <p className="text-gym-white font-medium text-sm">{row.nombre} {row.apellido}</p>
            <p className="text-gym-gray text-xs">{row.email}</p>
          </div>
        </div>
      )
    },
    { key: 'dni', label: 'DNI', render: v => <span className="text-gym-gray text-xs">{v}</span> },
    { key: 'telefono', label: 'Teléfono', render: v => <span className="text-gym-gray text-xs">{v || '—'}</span> },
    {
      key: 'estado', label: 'Estado',
      render: v => <Badge status={v} />
    },
    {
      key: 'id', label: 'Acciones',
      render: (id, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalVer(row)}
            className="text-gym-purplel text-xs hover:underline"
          >
            Ver
          </button>
          <span className="text-gym-grays">|</span>
          <button
            onClick={() => abrirEditar(row)}
            className="text-gym-yellow text-xs hover:underline"
          >
            Editar
          </button>
        </div>
      )
    },
  ]

  // Formulario reutilizable (nuevo y editar)
  const FormAlumno = () => (
    <form onSubmit={handleGuardar} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Nombre *" placeholder="Juan" value={form.nombre}
          onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} required />
        <Input label="Apellido *" placeholder="Pérez" value={form.apellido}
          onChange={e => setForm(p => ({ ...p, apellido: e.target.value }))} required />
      </div>
      <Input label="DNI *" placeholder="38521478" value={form.dni}
        onChange={e => setForm(p => ({ ...p, dni: e.target.value }))} required />
      <Input label="Email" type="email" placeholder="juan@email.com" value={form.email}
        onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
      <Input label="Teléfono" placeholder="+54 9 261..." value={form.telefono}
        onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} />
      <Input label="Fecha de nacimiento" type="date" value={form.fecha_nacimiento}
        onChange={e => setForm(p => ({ ...p, fecha_nacimiento: e.target.value }))} />
      {modalEditar && (
        <div>
          <label className="block text-sm font-medium text-gym-gray mb-1.5">Estado</label>
          <select
            value={form.estado || 'activo'}
            onChange={e => setForm(p => ({ ...p, estado: e.target.value }))}
            className="gym-input w-full text-sm"
          >
            <option value="activo">Activo</option>
            <option value="moroso">Moroso</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gym-gray mb-1.5">Observaciones</label>
        <textarea
          rows={2}
          value={form.observaciones}
          onChange={e => setForm(p => ({ ...p, observaciones: e.target.value }))}
          placeholder="Notas internas..."
          className="w-full bg-gym-dark border border-gym-border text-gym-white placeholder:text-gym-grays
            rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gym-purple resize-none"
        />
      </div>
      {saveError && <p className="text-red-400 text-sm">{saveError}</p>}
      {saveMsg   && <p className="text-green-400 text-sm">{saveMsg}</p>}
      <div className="flex gap-3 justify-end pt-2">
        <Button variant="ghost" type="button"
          onClick={() => { setModalNuevo(false); setModalEditar(null); setForm(ESTADO_INICIAL); setSaveMsg(''); setSaveError('') }}>
          Cancelar
        </Button>
        <Button variant="primary" type="submit" disabled={saving}>
          {saving ? 'Guardando...' : modalEditar ? 'Actualizar alumno' : 'Guardar alumno'}
        </Button>
      </div>
    </form>
  )

  return (
    <DashboardLayout title="Alumnos">
      {/* Resumen rápido */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label:'Activos',   val:resumen.activos,   color:'text-green-400' },
          { label:'Morosos',   val:resumen.morosos,   color:'text-red-400'   },
          { label:'Inactivos', val:resumen.inactivos, color:'text-gym-gray'  },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-gym-card border border-gym-border rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{val}</p>
            <p className="text-gym-gray text-xs">{label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Input
          placeholder="Buscar por nombre o DNI..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          icon="🔍"
          className="flex-1"
        />
        <select
          value={filterEstado}
          onChange={e => setFilterEstado(e.target.value)}
          className="gym-input w-full sm:w-40 text-sm"
        >
          <option value="todos">Todos</option>
          <option value="activo">Activos</option>
          <option value="moroso">Morosos</option>
          <option value="inactivo">Inactivos</option>
        </select>
        <Button variant="primary" onClick={() => { setForm(ESTADO_INICIAL); setSaveMsg(''); setSaveError(''); setModalNuevo(true) }}>
          + Nuevo alumno
        </Button>
      </div>

      {/* Tabla */}
      {loading ? (
        <p className="text-gym-gray text-sm text-center py-8">Cargando alumnos...</p>
      ) : (
        <>
          <Table columns={columns} data={filtered} emptyMessage="No se encontraron alumnos con ese criterio." />
          <p className="text-gym-grays text-xs mt-2">{filtered.length} alumnos encontrados</p>
        </>
      )}

      {/* Modal: Nuevo alumno */}
      <Modal isOpen={modalNuevo} onClose={() => { setModalNuevo(false); setForm(ESTADO_INICIAL) }} title="NUEVO ALUMNO">
        <FormAlumno />
      </Modal>

      {/* Modal: Editar alumno */}
      <Modal isOpen={!!modalEditar} onClose={() => { setModalEditar(null); setForm(ESTADO_INICIAL) }} title="EDITAR ALUMNO">
        <FormAlumno />
      </Modal>

      {/* Modal: Ver detalle alumno */}
      <Modal isOpen={!!modalVer} onClose={() => setModalVer(null)} title="DETALLE DEL ALUMNO">
        {modalVer && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gym-purple/30 border border-gym-purple/50 rounded-full
                flex items-center justify-center text-gym-purplel font-bold text-2xl">
                {(modalVer.nombre || '?')[0]}
              </div>
              <div>
                <p className="text-gym-white text-lg font-semibold">{modalVer.nombre} {modalVer.apellido}</p>
                <Badge status={modalVer.estado} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'DNI',        val: modalVer.dni          || '—' },
                { label: 'Email',      val: modalVer.email        || '—' },
                { label: 'Teléfono',   val: modalVer.telefono     || '—' },
                { label: 'Nacimiento', val: modalVer.fecha_nacimiento || '—' },
              ].map(({ label, val }) => (
                <div key={label} className="bg-gym-black/40 border border-gym-border rounded-lg p-3">
                  <p className="text-gym-gray text-xs mb-0.5">{label}</p>
                  <p className="text-gym-white font-medium">{val}</p>
                </div>
              ))}
            </div>
            {modalVer.observaciones && (
              <div className="bg-gym-black/40 border border-gym-border rounded-lg p-3">
                <p className="text-gym-gray text-xs mb-0.5">Observaciones</p>
                <p className="text-gym-white text-sm">{modalVer.observaciones}</p>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" fullWidth onClick={() => { setModalVer(null); abrirEditar(modalVer) }}>
                ✏️ Editar
              </Button>
              <Button variant="ghost" onClick={() => setModalVer(null)}>Cerrar</Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}
