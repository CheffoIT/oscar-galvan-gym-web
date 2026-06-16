const { Client, LocalAuth } = require('whatsapp-web.js')

let client = null
let qrCode = null
let status = 'disconnected' // disconnected | qr_ready | connecting | ready | error

/**
 * Normaliza un teléfono argentino al formato WhatsApp:
 *   +54 9 261 123-4567  →  5492611234567@c.us
 *   0261 123-4567       →  5492611234567@c.us
 */
function normalizarTelefono(tel) {
  if (!tel) return null
  // Quitar todo lo que no sea dígito
  let digits = tel.replace(/\D/g, '')

  // Si empieza con 549 ya está normalizado (sin el +)
  if (digits.startsWith('549') && digits.length >= 12) {
    return digits + '@c.us'
  }
  // Si empieza con 54 (sin el 9 intermedio)
  if (digits.startsWith('54') && digits.length >= 11) {
    // Insertar el 9 después del 54
    digits = '549' + digits.slice(2)
    return digits + '@c.us'
  }
  // Si empieza con 0 (número local argentino: 0261...)
  if (digits.startsWith('0') && digits.length >= 10) {
    digits = '549' + digits.slice(1)
    return digits + '@c.us'
  }
  // Si empieza con 9 (número sin código país)
  if (digits.startsWith('9') && digits.length >= 10) {
    digits = '54' + digits
    return digits + '@c.us'
  }
  // Número sin prefijos (ej: 2612345678)
  if (digits.length >= 10) {
    digits = '549' + digits
    return digits + '@c.us'
  }

  return null
}

function iniciarCliente() {
  if (client) return

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: './whatsapp-session' }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    },
  })

  client.on('qr', (qr) => {
    qrCode = qr
    status = 'qr_ready'
    console.log('[WhatsApp] QR generado — escaneá desde la página de admin')
  })

  client.on('authenticated', () => {
    status = 'connecting'
    qrCode = null
    console.log('[WhatsApp] Autenticado')
  })

  client.on('ready', () => {
    status = 'ready'
    qrCode = null
    console.log('[WhatsApp] Cliente listo para enviar mensajes')
  })

  client.on('disconnected', (reason) => {
    status = 'disconnected'
    qrCode = null
    client = null
    console.log('[WhatsApp] Desconectado:', reason)
  })

  client.on('auth_failure', (msg) => {
    status = 'error'
    client = null
    console.error('[WhatsApp] Error de autenticación:', msg)
  })

  client.initialize()
  status = 'connecting'
}

async function desconectar() {
  if (client) {
    await client.destroy()
    client = null
  }
  status = 'disconnected'
  qrCode = null
}

async function enviarMensaje(telefono, mensaje) {
  if (status !== 'ready' || !client) {
    throw new Error('WhatsApp no está conectado')
  }
  const chatId = normalizarTelefono(telefono)
  if (!chatId) {
    throw new Error(`Teléfono inválido: ${telefono}`)
  }
  await client.sendMessage(chatId, mensaje)
  return chatId
}

function getStatus() {
  return { status, hasQr: !!qrCode }
}

function getQr() {
  return qrCode
}

module.exports = {
  iniciarCliente,
  desconectar,
  enviarMensaje,
  normalizarTelefono,
  getStatus,
  getQr,
}
