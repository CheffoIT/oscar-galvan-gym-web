const cron = require('node-cron')
const { createClient } = require('@supabase/supabase-js')
const { enviarMensaje, getStatus } = require('../services/whatsappService')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Busca alumnos con plan venciendo en exactamente N días
 * y envía un WhatsApp a cada uno.
 */
async function enviarAlertasVencimiento(diasAntes = 7) {
  const wpStatus = getStatus()
  if (wpStatus.status !== 'ready') {
    console.log('[Alertas] WhatsApp no está conectado — omitiendo alertas')
    return { enviados: 0, errores: 0, omitidos: 'whatsapp_desconectado' }
  }

  // Fecha objetivo: hoy + diasAntes
  const fechaObjetivo = new Date()
  fechaObjetivo.setDate(fechaObjetivo.getDate() + diasAntes)
  const fechaStr = fechaObjetivo.toISOString().split('T')[0] // YYYY-MM-DD

  console.log(`[Alertas] Buscando alumnos con vencimiento el ${fechaStr}...`)

  const { data: pagos, error } = await supabase
    .from('pagos')
    .select(`
      id,
      fecha_vencimiento,
      alumnos (
        id,
        nombre,
        apellido,
        telefono
      )
    `)
    .eq('estado', 'activo')
    .eq('fecha_vencimiento', fechaStr)
    .not('alumnos.telefono', 'is', null)

  if (error) {
    console.error('[Alertas] Error consultando Supabase:', error.message)
    return { enviados: 0, errores: 1 }
  }

  if (!pagos || pagos.length === 0) {
    console.log('[Alertas] Ningún alumno con vencimiento en', diasAntes, 'días')
    return { enviados: 0, errores: 0 }
  }

  let enviados = 0
  let errores = 0

  for (const pago of pagos) {
    const alumno = pago.alumnos
    if (!alumno || !alumno.telefono) continue

    const mensaje =
      `Hola ${alumno.nombre}! 👋\n\n` +
      `Te recordamos que tu membresía en *Oscar Galván Gym* vence en *${diasAntes} días* ` +
      `(${pago.fecha_vencimiento}).\n\n` +
      `Para renovar y seguir entrenando sin interrupciones, acercate al gimnasio o contactanos.\n\n` +
      `💪 ¡Seguí entrenando fuerte!`

    try {
      await enviarMensaje(alumno.telefono, mensaje)
      console.log(`[Alertas] ✅ Enviado a ${alumno.nombre} ${alumno.apellido} (${alumno.telefono})`)
      enviados++

      // Pequeña pausa para no saturar WhatsApp
      await new Promise(r => setTimeout(r, 2000))
    } catch (err) {
      console.error(`[Alertas] ❌ Error enviando a ${alumno.nombre}:`, err.message)
      errores++
    }
  }

  console.log(`[Alertas] Resumen: ${enviados} enviados, ${errores} errores`)
  return { enviados, errores }
}

/**
 * Inicia el cron job diario.
 * Por defecto: 9:00 AM hora Argentina (UTC-3).
 */
function iniciarCronAlertas() {
  // Cron: 9:00 AM todos los días (timezone Argentina)
  cron.schedule(
    '0 9 * * *',
    async () => {
      console.log('[Cron] Ejecutando alertas de vencimiento...')
      await enviarAlertasVencimiento(7)
    },
    { timezone: 'America/Argentina/Buenos_Aires' }
  )
  console.log('[Cron] Job de alertas WhatsApp programado — se ejecuta a las 9:00 AM (hora Argentina)')
}

module.exports = { iniciarCronAlertas, enviarAlertasVencimiento }
