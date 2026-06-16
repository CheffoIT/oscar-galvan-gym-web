const router   = require('express').Router()
const QRCode   = require('qrcode')
const { iniciarCliente, desconectar, enviarMensaje, getStatus, getQr } = require('../services/whatsappService')
const { enviarAlertasVencimiento } = require('../jobs/alertasVencimiento')
const { authenticate, authorize } = require('../middlewares/auth')

// Todas las rutas requieren autenticacion de admin
router.use(authenticate)
router.use(authorize('admin'))

// GET /api/whatsapp/status
router.get('/status', (req, res) => {
  res.json(getStatus())
})

// GET /api/whatsapp/qr
router.get('/qr', async (req, res) => {
  const qr = getQr()
  if (!qr) {
    return res.status(404).json({ error: 'No hay QR disponible. Iniciá la conexión primero.' })
  }
  try {
    const dataUrl = await QRCode.toDataURL(qr)
    res.json({ qr: dataUrl })
  } catch {
    res.status(500).json({ error: 'Error generando imagen QR.' })
  }
})

// POST /api/whatsapp/connect
router.post('/connect', (req, res) => {
  const current = getStatus()
  if (current.status === 'ready') {
    return res.json({ message: 'WhatsApp ya está conectado.' })
  }
  iniciarCliente()
  res.json({ message: 'Iniciando conexión. Esperá el QR...' })
})

// POST /api/whatsapp/disconnect
router.post('/disconnect', async (req, res) => {
  await desconectar()
  res.json({ message: 'WhatsApp desconectado.' })
})

// POST /api/whatsapp/test — envío de prueba
router.post('/test', async (req, res) => {
  const { telefono, mensaje } = req.body
  if (!telefono || typeof telefono !== 'string') {
    return res.status(400).json({ error: 'Campo telefono requerido.' })
  }
  const texto = mensaje ? String(mensaje).slice(0, 500) : 'Mensaje de prueba desde Oscar Galván Gym 💪'
  try {
    const chatId = await enviarMensaje(telefono, texto)
    res.json({ ok: true, chatId })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/whatsapp/run-alerts — dispara alertas manualmente
router.post('/run-alerts', async (req, res) => {
  const dias = Math.min(30, Math.max(1, parseInt(req.body.dias) || 7))
  try {
    const resultado = await enviarAlertasVencimiento(dias)
    res.json(resultado)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
