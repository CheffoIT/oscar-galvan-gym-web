import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Table   from '../../components/ui/Table'
import Badge   from '../../components/ui/Badge'
import Button  from '../../components/ui/Button'
import StatCard from '../../components/ui/StatCard'
import Modal   from '../../components/ui/Modal'
import Input   from '../../components/ui/Input'
import { getPagos, registrarPago, getAlumnos, getMembresias } from '../../services/api'

const FORM_INICIAL = {
  alumno_id: '', membresia_id: '', monto: '',
  fecha_pago: new Date().toISOString().split('T')[0],
  metodo: 'efectivo', notas: '',
}

export default function PagosPage() {
  const [pagos,      setPagos]      = useState([])
  const [alumnos,    setAlumnos]    = useState([])
  const [membresias, setMembresias] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('todos')
  const [modalOpen,  setModalOpen]  = useState(false)
  const [form,       setForm]       = useState(FORM_INICIAL)
  const [saving,     setSaving]     = useState(false)
  const [saveMsg,    setSaveMsg]    = useState('')
  const [saveError,  setSaveError]  = useState('')

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    const [{ data: pagosData }, { data: alumnosData }, { data: membData }] = await Promise.all([
      getPagos(),
      getAlumnos(),
      getMembresias(),
    ])
    setPagos(pagosData || [])
    setAlumnos(alumnosData || [])
    setMembresias(membData || [])
    setLoading(false)
  }, [])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  // Al seleccionar membresía, auto-completar el monto
  const handleSelectMembresia = (membId) => {
    const memb = membresias.find(m => m.id === membId)
    setForm(p => ({ ...p, membresia_id: membId, monto: memb?.precio || '' }))
  }

  const handleRegistrar = async (e) => {
    e.preventDefault()
    if (!form.alumno_id || !form.membresia_id || !form.monto) {
      setSaveError('Alumno, plan y monto son obligatorios.')
      return
    }
    setSaving(true)
    setSaveError('')

    const { error } = await registrarPago({
      alumno_id:    form.alumno_id,
      membresia_id: form.membresia_id,
      monto:        parseFloat(form.monto),
      fecha_pago:   form.fecha_pago,
      metodo:       form.metodo,
      notas:        form.notas,
    })

    setSaving(false)
    if (error) {
      setSaveError('Error al registrar: ' + (error.message || error))
    } else {
      setSaveMsg('✅ Pago registrado correctamente.')
      await cargarDatos()
      setTimeout(() => { setModalOpen(false); setForm(FORM_INICIAL); setSaveMsg('') }, 1500)
    }
  }

  const filtered = filter === 'todos' ? pagos : pagos.filter(p => p.estado === filter)

  // Estadísticas calculadas en tiempo real
  const totalMes = pagos
    .filter(p => p.estado === 'activo' && p.fecha_pago?.startsWith(new Date().toISOString().slice(0,7)))
    .reduce((s, p) => s + parseFloat(p.monto || 0), 0)
  const pagosActivos  = pagos.filter(p => p.estado === 'activo').length
  const pagosVencidos = pagos.filter(p => p.estado === 'vencido').length

  const columns = [
    {
      key:'alumnos', label:'Alumno',
      render: v => (
        <span className="text-gym-white text-sm font-medium">
          {v ? `${v.nombre} ${v.apellido}` : '—'}
        </span>
      )
    },
    {
      key:'membresias', label:'Plan',
      render: v => <span className="text-gym-gray text-xs">{v?.nombre || '—'}</span>
    },
    {
      key:'monto', label:'Monto',
      render: v => <span className="text-gym-yellow font-bold text-sm">${parseFloat(v || 0).toLocaleString('es-AR')}</span>
    },
    {
      key:'fecha_pago', label:'Fecha pago',
      render: v => <span className="text-gym-gray text-xs">{v || '—'}</span>
    },
    {
      key:'fecha_vencimiento', label:'Vencimiento',
      render: v => <span className="text-gym-gray text-xs">{v || '—'}</span>
    },
    {
      key:'metodo', label:'Método',
      render: v => (
        <span className="text-xs px-2 py-0.5 bg-gym-border rounded-full text-gym-gray capitalize">{v || '—'}</span>
      )
    },
    {
      key:'estado', label:'Estado',
      render: v => <Badge status={v === 'activo' ? 'activo' : 'vencido'} />
    },
  ]

  return (
    <DashboardLayout title="Pagos & Membresías">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard icon="💰" label="Ingreso mes"
          value={`$${(totalMes/1000).toFixed(0)}k`} accentColor="yellow" />
        <StatCard icon="✅" label="Al día"
          value={pagosActivos} accentColor="green" />
        <StatCard icon="❌" label="Vencidos"
          value={pagosVencidos} accentColor="red" />
        <StatCard icon="📋" label="Total registros"
          value={pagos.length} accentColor="purple" />
      </div>

      {/* Filtros + acción */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <div className="flex rounded-lg border border-gym-border overflow-hidden">
          {['todos','activo','vencido'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium transition-colors capitalize
                ${filter === f ? 'bg-gym-purple text-white' : 'bg-gym-dark text-gym-gray hover:text-white'}`}
            >
              {f === 'todos' ? 'Todos' : f === 'activo' ? 'Al día' : 'Vencidos'}
            </button>
          ))}
        </div>
        <Button variant="primary" className="ml-auto" onClick={() => { setForm(FORM_INICIAL); setSaveMsg(''); setSaveError(''); setModalOpen(true) }}>
          + Registrar pago
        </Button>
      </div>

      {/* Tabla */}
      {loading ? (
        <p className="text-gym-gray text-sm text-center py-8">Cargando pagos...</p>
      ) : (
        <>
          <Table columns={columns} data={filtered} emptyMessage="Sin pagos para mostrar." />
          <p className="text-gym-grays text-xs mt-2">{filtered.length} registros</p>
        </>
      )}

      {/* Modal: Registrar pago */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="REGISTRAR PAGO">
        <form onSubmit={handleRegistrar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gym-gray mb-1.5">Alumno *</label>
            <select
              value={form.alumno_id}
              onChange={e => setForm(p => ({ ...p, alumno_id: e.target.value }))}
              className="gym-input w-full text-sm"
              required
            >
              <option value="">Seleccioná un alumno...</option>
              {alumnos.map(a => (
                <option key={a.id} value={a.id}>{a.nombre} {a.apellido} — DNI {a.dni}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gym-gray mb-1.5">Plan / Membresía *</label>
            <select
              value={form.membresia_id}
              onChange={e => handleSelectMembresia(e.target.value)}
              className="gym-input w-full text-sm"
              required
            >
              <option value="">Seleccioná un plan...</option>
              {membresias.map(m => (
                <option key={m.id} value={m.id}>{m.nombre} — ${parseFloat(m.precio).toLocaleString('es-AR')}</option>
              ))}
            </select>
          </div>
          <Input label="Monto ($) *" type="number" placeholder="8000" value={form.monto}
            onChange={e => setForm(p => ({ ...p, monto: e.target.value }))} required />
          <Input label="Fecha de pago" type="date" value={form.fecha_pago}
            onChange={e => setForm(p => ({ ...p, fecha_pago: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium text-gym-gray mb-1.5">Método de pago</label>
            <select value={form.metodo} onChange={e => setForm(p => ({ ...p, metodo: e.target.value }))}
              className="gym-input w-full text-sm">
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <Input label="Notas (opcional)" placeholder="Observaciones del pago..." value={form.notas}
            onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} />

          {saveError && <p className="text-red-400 text-sm">{saveError}</p>}
          {saveMsg   && <p className="text-green-400 text-sm">{saveMsg}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? 'Registrando...' : 'Registrar pago'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}
