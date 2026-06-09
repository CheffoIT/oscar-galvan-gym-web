import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card   from '../../components/ui/Card'
import Badge  from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { getRutinaByAlumnoId, registrarPesoEjercicio, getSeguimientoFisico } from '../../services/api'
import { supabase } from '../../services/supabaseClient'
import { useGymConfig } from '../../contexts/GymConfigContext'
import QRCode from 'qrcode'
import { getAlumnoById as getMockAlumno } from '../../data/alumnosMock'
import { getRutinaByAlumnoId as getMockRutina } from '../../data/rutinasMock'
import { getPagosByAlumno as getMockPagos } from '../../data/pagosMock'

export default function AlumnoDashboard() {
  const { user } = useAuth()
  const { config } = useGymConfig()

  const [alumnoId,     setAlumnoId]     = useState(null)
  const [alumnoData,   setAlumnoData]   = useState(null)
  const [rutina,       setRutina]       = useState(null)
  const [ultimoPago,   setUltimoPago]   = useState(null)
  const [seguimiento,  setSeguimiento]  = useState([])
  const [qrDataUrl,    setQrDataUrl]    = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [tabRutina,    setTabRutina]    = useState(0)
  const [pesos,        setPesos]        = useState({})
  const [savedSession, setSavedSession] = useState(false)
  const [savingSession,setSavingSession]= useState(false)

  const cargarDatos = useCallback(async () => {
    setLoading(true)

    if (supabase && user?.id) {
      const { data: alumno } = await supabase
        .from('alumnos')
        .select('*')
        .eq('perfil_id', user.id)
        .single()

      if (alumno) {
        setAlumnoId(alumno.id)
        setAlumnoData(alumno)

        const { data: rutinaData } = await getRutinaByAlumnoId(alumno.id)
        setRutina(rutinaData)

        const { data: pagosData } = await supabase
          .from('pagos')
          .select('*, membresias(nombre)')
          .eq('alumno_id', alumno.id)
          .order('fecha_pago', { ascending: false })
          .limit(1)
          .single()
        setUltimoPago(pagosData || null)

        const { data: segData } = await getSeguimientoFisico(alumno.id)
        setSeguimiento(segData || [])

        try {
          const qrUrl = await QRCode.toDataURL('alumno:' + alumno.id, {
            width: 200,
            color: { dark: '#ffffff', light: '#00000000' },
          })
          setQrDataUrl(qrUrl)
        } catch { /* QR opcional */ }
      }
    } else {
      const a     = getMockAlumno('1')
      const r     = getMockRutina('1')
      const pagos = getMockPagos('1') || []
      setAlumnoData(a)
      setRutina(r)
      setUltimoPago(pagos[0] || null)
      setAlumnoId('1')
    }

    setLoading(false)
  }, [user?.id])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  const getDiasRutina = () => {
    if (!rutina) return []
    if (rutina.rutina_ejercicios) {
      const byDia = {}
      ;(rutina.rutina_ejercicios || []).forEach(re => {
        const dia = re.dia || 'Dia 1'
        if (!byDia[dia]) byDia[dia] = []
        byDia[dia].push({
          ejercicioId:  re.ejercicio_id,
          nombre:       re.ejercicios?.nombre || 'Ejercicio',
          series:       re.series,
          repeticiones: re.repeticiones,
          descanso:     re.descanso_seg,
          notas:        re.notas,
        })
      })
      return Object.entries(byDia).map(([dia, ejercicios]) => ({ dia, ejercicios }))
    }
    return rutina.dias || []
  }

  const diasRutina = getDiasRutina()
  const diaActivo  = diasRutina[tabRutina]

  const handlePeso = (ejercicioId, value) => {
    setPesos(prev => ({ ...prev, [ejercicioId]: value }))
  }

  const handleGuardarSesion = async () => {
    if (!alumnoId) return
    const registros = Object.entries(pesos)
      .filter(([, kg]) => kg && parseFloat(kg) > 0)
      .map(([ejercicioId, kg]) => ({
        alumno_id:   alumnoId,
        ejercicio_id:ejercicioId,
        peso_kg:     parseFloat(kg),
        fecha:       new Date().toISOString().split('T')[0],
      }))

    if (registros.length === 0) {
      alert('Ingresa al menos un peso antes de guardar.')
      return
    }

    setSavingSession(true)
    for (const r of registros) {
      await registrarPesoEjercicio(r)
    }
    setSavingSession(false)
    setSavedSession(true)
    setPesos({})
    setTimeout(() => setSavedSession(false), 3000)
  }

  const handleDescargarQR = () => {
    if (!qrDataUrl) { alert('QR no disponible.'); return }
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = 'qr-' + (user?.nombre || 'alumno') + '.png'
    a.click()
  }

  const ultimoSeguimiento = seguimiento[seguimiento.length - 1]

  return (
    <DashboardLayout title="Mi Panel">
      <div className="mb-6">
        <h2 className="font-display text-2xl text-gym-white tracking-wider">
          HOLA, <span className="text-gym-yellow">{(alumnoData?.nombre || user?.nombre || 'ALUMNO').toUpperCase()}</span>
        </h2>
        <p className="text-gym-gray text-sm">Listo para entrenar hoy?</p>
      </div>

      {loading ? (
        <p className="text-gym-gray text-sm text-center py-8">Cargando tu panel...</p>
      ) : (!alumnoData && supabase) ? (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4">
          <p className="text-yellow-400 text-sm">
            Tu usuario no tiene un perfil de alumno asociado. Consulta con el administrador del gimnasio.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {rutina ? (
              <Card hover={false} accent>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-xl text-gym-white tracking-wider">MI RUTINA</h3>
                  <Badge status="activo" label="Activa" />
                </div>
                <p className="text-gym-yellow font-semibold mb-1">{rutina.nombre}</p>
                {rutina.descripcion && <p className="text-gym-gray text-xs mb-5">{rutina.descripcion}</p>}

                {diasRutina.length > 1 && (
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                    {diasRutina.map((d, i) => (
                      <button key={i} onClick={() => setTabRutina(i)}
                        className={'px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-all ' +
                          (tabRutina === i ? 'bg-gym-purple text-white' : 'bg-gym-border text-gym-gray hover:text-white')}>
                        {String(d.dia).split(' / ')[1] || d.dia}
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  {(diaActivo?.ejercicios || []).map((ej, idx) => (
                    <div key={idx}
                      className="bg-gym-black/50 border border-gym-border rounded-xl p-4 hover:border-gym-purple/30 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-gym-white font-medium text-sm">{ej.nombre}</p>
                          <p className="text-gym-gray text-xs mt-0.5">
                            {ej.series} series x {ej.repeticiones} reps - {ej.descanso}s descanso
                          </p>
                          {ej.notas && <p className="text-gym-purplel text-xs mt-1 italic">"{ej.notas}"</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <input
                            type="number"
                            placeholder="kg"
                            value={pesos[ej.ejercicioId] || ''}
                            onChange={e => handlePeso(ej.ejercicioId, e.target.value)}
                            className="w-16 bg-gym-dark border border-gym-border text-gym-white text-center
                              text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:border-gym-yellow"
                          />
                          <span className="text-gym-gray text-xs">kg</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {diasRutina.length === 0 && (
                  <p className="text-gym-gray text-sm text-center py-4">Sin ejercicios asignados aun.</p>
                )}

                <div className="mt-4 pt-4 border-t border-gym-border flex items-center justify-between">
                  {savedSession
                    ? <span className="text-green-400 text-sm">Sesion guardada!</span>
                    : <span />}
                  <Button variant="primary" onClick={handleGuardarSesion} disabled={savingSession}>
                    {savingSession ? 'Guardando...' : 'Guardar sesion de hoy'}
                  </Button>
                </div>
              </Card>
            ) : (
              <Card hover={false}>
                <p className="text-gym-gray text-center py-6">
                  Todavia no tenes una rutina asignada. Consulta con tu entrenador.
                </p>
              </Card>
            )}
          </div>

          {/* Columna lateral */}
          <div className="space-y-5">

            {/* Estado de pago */}
            <Card hover={false} accent={ultimoPago?.estado === 'vencido'}>
              <h3 className="font-display text-base text-gym-white tracking-wider mb-3">MI PAGO</h3>
              {ultimoPago ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gym-gray text-sm">Estado</span>
                    <Badge
                      status={ultimoPago.estado === 'activo' ? 'activo' : 'vencido'}
                      label={ultimoPago.estado === 'activo' ? 'Al dia' : 'Vencido'} />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gym-gray text-sm">Plan</span>
                    <span className="text-gym-white text-sm">
                      {ultimoPago.membresias?.nombre || ultimoPago.plan || 'Sin plan'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gym-gray text-sm">Vence</span>
                    <span className="text-gym-yellow font-medium text-sm">
                      {ultimoPago.fecha_vencimiento || ultimoPago.vencimiento || 'Sin fecha'}
                    </span>
                  </div>
                  {(config?.cbu || config?.alias_cbu) && (
                    <div className="bg-gym-black/40 border border-gym-border rounded-xl p-3 text-xs space-y-1">
                      <p className="text-gym-gray">Para pagar transferi a:</p>
                      {config.cbu      && <p className="text-gym-white font-mono">{config.cbu}</p>}
                      {config.alias_cbu && <p className="text-gym-yellow font-semibold">{config.alias_cbu}</p>}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gym-gray text-sm">Sin registros de pago.</p>
              )}
            </Card>

            {/* Mi QR */}
            <Card hover={false}>
              <h3 className="font-display text-base text-gym-white tracking-wider mb-3">MI QR</h3>
              <div className="flex flex-col items-center">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR" className="w-32 h-32 rounded-xl mb-3" />
                ) : (
                  <div className="w-32 h-32 bg-gym-black border-2 border-dashed border-gym-purple/50 rounded-xl
                    flex items-center justify-center mb-3 text-3xl">
                    QR
                  </div>
                )}
                <p className="text-gym-gray text-xs text-center mb-3">
                  Mostra este codigo al entrenador para registrar asistencia.
                </p>
                <Button variant="secondary" size="sm" fullWidth onClick={handleDescargarQR}>
                  Descargar QR
                </Button>
              </div>
            </Card>

            {/* Progreso */}
            <Card hover={false}>
              <h3 className="font-display text-base text-gym-white tracking-wider mb-3">MI PROGRESO</h3>
              <div className="space-y-2">
                {[
                  { label: 'Peso actual', value: ultimoSeguimiento?.peso_kg ? ultimoSeguimiento.peso_kg + ' kg' : 'Sin registro' },
                  { label: 'Altura',      value: ultimoSeguimiento?.altura_cm ? ultimoSeguimiento.altura_cm + ' cm' : 'Sin registro' },
                  { label: 'Mediciones',  value: seguimiento.length > 0 ? seguimiento.length + ' registros' : 'Sin registros' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gym-gray text-xs">{label}</span>
                    <span className="text-gym-white text-xs font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
