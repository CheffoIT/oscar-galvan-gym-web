/**
 * Capa de acceso a datos con Supabase.
 * Cada función devuelve { data, error }.
 * Si Supabase no está configurado, devuelve los datos mock como fallback.
 */
import { supabase }          from './supabaseClient'
import { alumnosMock }       from '../data/alumnosMock'
import { rutinasMock }       from '../data/rutinasMock'
import { pagosMock, estadisticasPagos } from '../data/pagosMock'
import { configuracionGym }  from '../data/configuracionGymMock'
import { asistenciasMock }   from '../data/horariosMock'

// ─── ALUMNOS ─────────────────────────────────────────────────

export const getAlumnos = async ({ estado, search } = {}) => {
  if (!supabase) {
    let data = [...alumnosMock]
    if (estado) data = data.filter(a => a.estado === estado)
    if (search) data = data.filter(a =>
      `${a.nombre} ${a.apellido} ${a.dni}`.toLowerCase().includes(search.toLowerCase())
    )
    return { data, error: null }
  }

  let query = supabase
    .from('alumnos')
    .select(`
      id, nombre, apellido, dni, email, telefono, fecha_nacimiento,
      foto_url, qr_code, estado, observaciones, created_at,
      entrenadores ( id, perfil_id, perfiles ( nombre, apellido ) )
    `)
    .order('apellido', { ascending: true })

  if (estado)  query = query.eq('estado', estado)
  if (search)  query = query.or(`nombre.ilike.%${search}%,apellido.ilike.%${search}%,dni.ilike.%${search}%`)

  const { data, error } = await query
  return { data: data || [], error }
}

export const getAlumnoById = async (id) => {
  if (!supabase) {
    const alumno = alumnosMock.find(a => a.id === id)
    return { data: alumno || null, error: alumno ? null : 'No encontrado' }
  }

  const { data, error } = await supabase
    .from('alumnos')
    .select(`
      *,
      entrenadores ( id, perfiles ( nombre, apellido ) ),
      pagos ( id, monto, fecha_pago, fecha_vencimiento, estado, membresias(nombre) ),
      seguimiento_fisico ( id, fecha, peso_kg, altura_cm, cintura_cm ),
      rutinas ( id, nombre, activa, fecha_inicio )
    `)
    .eq('id', id)
    .single()

  return { data, error }
}

export const createAlumno = async (alumnoData) => {
  if (!supabase) {
    return { data: { id: String(Date.now()), ...alumnoData }, error: null }
  }
  const { data, error } = await supabase
    .from('alumnos')
    .insert(alumnoData)
    .select()
    .single()
  return { data, error }
}

export const updateAlumno = async (id, updates) => {
  if (!supabase) return { data: { id, ...updates }, error: null }
  const { data, error } = await supabase
    .from('alumnos').update(updates).eq('id', id).select().single()
  return { data, error }
}

// ─── PAGOS ───────────────────────────────────────────────────

export const getPagos = async ({ estado } = {}) => {
  if (!supabase) {
    let data = [...pagosMock]
    if (estado) data = data.filter(p => p.estado === estado)
    return { data, estadisticas: estadisticasPagos, error: null }
  }

  let query = supabase
    .from('pagos')
    .select(`
      id, monto, fecha_pago, fecha_vencimiento, metodo, estado, notas,
      alumnos ( id, nombre, apellido ),
      membresias ( id, nombre, duracion_dias )
    `)
    .order('created_at', { ascending: false })

  if (estado) query = query.eq('estado', estado)

  const { data, error } = await query
  return { data: data || [], error }
}

export const registrarPago = async (pagoData) => {
  if (!supabase) {
    return { data: { id: String(Date.now()), ...pagoData }, error: null }
  }
  // Calcular fecha_vencimiento según la duración del plan
  const { data: memb } = await supabase
    .from('membresias').select('duracion_dias').eq('id', pagoData.membresia_id).single()

  const fechaVenc = new Date(pagoData.fecha_pago)
  fechaVenc.setDate(fechaVenc.getDate() + (memb?.duracion_dias || 30))

  const { data, error } = await supabase
    .from('pagos')
    .insert({ ...pagoData, fecha_vencimiento: fechaVenc.toISOString().split('T')[0], estado: 'activo' })
    .select().single()

  // Actualizar estado del alumno a activo
  if (!error) {
    await supabase.from('alumnos').update({ estado: 'activo' }).eq('id', pagoData.alumno_id)
  }
  return { data, error }
}

// ─── RUTINAS ─────────────────────────────────────────────────

export const getRutinas = async () => {
  if (!supabase) return { data: rutinasMock, error: null }

  const { data, error } = await supabase
    .from('rutinas')
    .select(`
      id, nombre, descripcion, activa, fecha_inicio, fecha_fin,
      alumnos ( id, nombre, apellido ),
      entrenadores ( id, perfiles ( nombre, apellido ) ),
      rutina_ejercicios (
        id, dia, series, repeticiones, descanso_seg, orden, notas,
        ejercicios ( id, nombre, grupo_muscular, imagen_url, video_url )
      )
    `)
    .order('created_at', { ascending: false })

  return { data: data || [], error }
}

export const getRutinaByAlumnoId = async (alumnoId) => {
  if (!supabase) {
    const r = rutinasMock.find(r => r.alumnoId === alumnoId && r.activa)
    return { data: r || null, error: null }
  }

  const { data, error } = await supabase
    .from('rutinas')
    .select(`
      id, nombre, descripcion, activa, fecha_inicio,
      rutina_ejercicios (
        id, dia, series, repeticiones, descanso_seg, orden, notas,
        ejercicios ( id, nombre, grupo_muscular, descripcion, imagen_url, video_url )
      )
    `)
    .eq('alumno_id', alumnoId)
    .eq('activa', true)
    .single()

  return { data, error }
}

// ─── SEGUIMIENTO FÍSICO ──────────────────────────────────────

export const getSeguimientoFisico = async (alumnoId) => {
  if (!supabase) return { data: [], error: null }

  const { data, error } = await supabase
    .from('seguimiento_fisico')
    .select('*')
    .eq('alumno_id', alumnoId)
    .order('fecha', { ascending: true })

  return { data: data || [], error }
}

export const registrarSeguimiento = async (medidas) => {
  if (!supabase) return { data: medidas, error: null }
  const { data, error } = await supabase
    .from('seguimiento_fisico').insert(medidas).select().single()
  return { data, error }
}

// ─── REGISTROS DE PESO (por ejercicio) ──────────────────────

export const registrarPesoEjercicio = async (registro) => {
  if (!supabase) return { data: registro, error: null }
  const { data, error } = await supabase
    .from('registros_peso').insert(registro).select().single()
  return { data, error }
}

export const getHistorialPesos = async (alumnoId, ejercicioId) => {
  if (!supabase) return { data: [], error: null }
  const { data, error } = await supabase
    .from('registros_peso')
    .select('*')
    .eq('alumno_id', alumnoId)
    .eq('ejercicio_id', ejercicioId)
    .order('fecha', { ascending: true })
  return { data: data || [], error }
}

// ─── ASISTENCIAS ─────────────────────────────────────────────

export const getAsistenciasHoy = async () => {
  if (!supabase) return { data: asistenciasMock.filter(a => a.fecha === new Date().toISOString().split('T')[0]), error: null }

  const hoy = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('asistencias')
    .select('*, alumnos(nombre, apellido)')
    .eq('fecha', hoy)
    .order('hora', { ascending: false })
  return { data: data || [], error }
}

export const registrarAsistencia = async (alumnoId, metodo = 'manual') => {
  if (!supabase) return { data: { alumnoId, fecha: new Date().toISOString().split('T')[0] }, error: null }
  const { data, error } = await supabase
    .from('asistencias')
    .insert({ alumno_id: alumnoId, metodo })
    .select().single()
  return { data, error }
}

// ─── CONFIGURACIÓN DEL GIMNASIO ──────────────────────────────

export const getConfiguracion = async () => {
  if (!supabase) return { data: configuracionGym, error: null }

  const { data, error } = await supabase
    .from('configuracion_gimnasio')
    .select('*')
    .limit(1)
    .single()

  return { data: data || configuracionGym, error }
}

export const updateConfiguracion = async (updates) => {
  if (!supabase) return { data: updates, error: null }

  // Obtener el ID de la única fila de configuración
  const { data: existing } = await supabase
    .from('configuracion_gimnasio').select('id').limit(1).single()

  if (existing) {
    const { data, error } = await supabase
      .from('configuracion_gimnasio').update(updates).eq('id', existing.id).select().single()
    return { data, error }
  } else {
    const { data, error } = await supabase
      .from('configuracion_gimnasio').insert(updates).select().single()
    return { data, error }
  }
}

// ─── MEMBRESIAS ──────────────────────────────────────────────

export const getMembresias = async () => {
  if (!supabase) return { data: configuracionGym.planes, error: null }

  const { data, error } = await supabase
    .from('membresias')
    .select('*')
    .eq('activa', true)
    .order('precio', { ascending: true })

  return { data: data || [], error }
}

// ─── ESTADÍSTICAS (para el dashboard admin) ──────────────────

export const getEstadisticasDashboard = async () => {
  if (!supabase) {
    return {
      data: {
        totalActivos:   alumnosMock.filter(a => a.estado === 'activo').length,
        totalMorosos:   alumnosMock.filter(a => a.estado === 'moroso').length,
        totalInactivos: alumnosMock.filter(a => a.estado === 'inactivo').length,
        ingresoMes:     estadisticasPagos.totalMesActual,
        ingresosMes:    estadisticasPagos.ingresosMes,
        asistenciasHoy: 0,
      },
      error: null
    }
  }

  // Contar alumnos por estado
  const { data: alumnosData } = await supabase
    .from('alumnos').select('estado')

  const conteo = (alumnosData || []).reduce((acc, a) => {
    acc[a.estado] = (acc[a.estado] || 0) + 1
    return acc
  }, {})

  // Ingresos del mes actual
  const primerDiaMes = new Date()
  primerDiaMes.setDate(1)
  const { data: pagosData } = await supabase
    .from('pagos')
    .select('monto')
    .gte('fecha_pago', primerDiaMes.toISOString().split('T')[0])
    .eq('estado', 'activo')

  const ingresoMes = (pagosData || []).reduce((s, p) => s + parseFloat(p.monto), 0)

  // Asistencias de hoy
  const hoy = new Date().toISOString().split('T')[0]
  const { count: asistenciasHoy } = await supabase
    .from('asistencias').select('id', { count: 'exact', head: true }).eq('fecha', hoy)

  return {
    data: {
      totalActivos:   conteo['activo']   || 0,
      totalMorosos:   conteo['moroso']   || 0,
      totalInactivos: conteo['inactivo'] || 0,
      ingresoMes,
      asistenciasHoy: asistenciasHoy || 0,
    },
    error: null
  }
}
