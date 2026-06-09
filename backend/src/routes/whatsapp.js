const express = require('express')
const QRCode = require('qrcode')
const { iniciarCliente, desconectar, enviarMensaje, getStatus, getQr } = require('../services/whatsappService')
const { enviarAlertasVencimiento } = require('../jobs/alertasVencimiento')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// Todas las rutas requieren token de admin
router.use(authenticateToken)

// GET /api/whatsapp/status
router.get('/status', (req, res) => {
  res.json(getStatus())
})

// GET /api/whatsapp/qr  → devuelve el QR como imagen PNG en base64
router.get('/qr', async (req, res) => {
  const qr = getQr()
  if (!qr) {
    return res.status(404).json({ error: 'No hay QR disponible. Iniciá la conexión primero.' })
  }
  try {
    const dataUrl = await QRCode.toDataURL(qr)
    res.json({ qr: dataUrl })
  } catch (err) {
    res.status(500).json({ error: 'Error generando imagen QR' })
  }
})

// POST /api/whatsapp/connect  → inicia el cliente
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

// POST /api/whatsapp/test  → envío de prueba
// body: { telefono, mensaje }
router.post('/test', async (req, res) => {
  const { telefono, mensaje } = req.body
  if (!telefono) {
    return res.status(400).json({ error: 'Falta el campo telefono' })
  }
  const textoEnviar = mensaje || 'Mensaje de prueba desde Oscar Galván Gym 💪'
  try {
    const chatId = await enviarMensaje(telefono, textoEnviar)
    res.json({ ok: true, chatId })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/whatsapp/run-alerts  → dispara las alertas manualmente
router.post('/run-alerts', async (req, res) => {
  const { dias = 7 } = req.body
  try {
    const resultado = await enviarAlertasVencimiento(Number(dias))
    res.json(resultado)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
