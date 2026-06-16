import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/ui/Button'
import { supabase } from '../../services/supabaseClient'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const STATUS_CONFIG = {
  ready:        { label: 'Conectado',         color: 'text-green-400',  dot: 'bg-green-400',  icon: '✅' },
  qr_ready:     { label: 'Esperando escaneo', color: 'text-yellow-400', dot: 'bg-yellow-400', icon: '📱' },
  connecting:   { label: 'Conectando...',     color: 'text-blue-400',   dot: 'bg-blue-400',   icon: '⏳' },
  disconnected: { label: 'Desconectado',      color: 'text-gym-gray',   dot: 'bg-gym-gray',   icon: '⭕' },
  error:        { label: 'Error',             color: 'text-red-400',    dot: 'bg-red-400',    icon: '❌' },
}

// Obtiene el token de sesion desde Supabase — NUNCA desde localStorage
async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || ''
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

async function apiFetch(path, options = {}) {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API}${path}`, { ...options, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Error ${res.status}`)
  }
  return res.json()
}

export default function WhatsappPage() {
  const [status,     setStatus]     = useState('disconnected')
  const [qrImage,    setQrImage]    = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [msg,        setMsg]        = useState('')
  const [error,      setError]      = useState('')
  const [testTel,    setTestTel]    = useState('')
  const [testMsg,    setTestMsg]    = useState('Hola! Este es un mensaje de prueba de Oscar Galván Gym 💪')
  const [sending,    setSending]    = useState(false)
  const [diasAlerta, setDiasAlerta] = useState(7)
  const [runResult,  setRunResult]  = useState(null)
  const [running,    setRunning]    = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const data = await apiFetch('/api/whatsapp/status')
      setStatus(data.status)
      if (data.hasQr) {
        const qrData = await apiFetch('/api/whatsapp/qr')
        setQrImage(qrData.qr || null)
      } else {
        setQrImage(null)
      }
    } catch {
      // Error de red — no bloquear la UI
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const iv = setInterval(() => {
      if (status !== 'ready') fetchStatus()
    }, 4000)
    return () => clearInterval(iv)
  }, [fetchStatus, status])

  const handleConnect = async () => {
    setLoading(true); setError(''); setMsg('')
    try {
      const data = await apiFetch('/api/whatsapp/connect', { method: 'POST', body: '{}' })
      setMsg(data.message)
      setTimeout(fetchStatus, 2000)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  const handleDisconnect = async () => {
    setLoading(true); setError(''); setMsg('')
    try {
      const data = await apiFetch('/api/whatsapp/disconnect', { method: 'POST', body: '{}' })
      setMsg(data.message)
      setQrImage(null)
      await fetchStatus()
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  const handleTestSend = async (e) => {
    e.preventDefault()
    if (!testTel) return
    setSending(true); setError(''); setMsg('')
    try {
      const data = await apiFetch('/api/whatsapp/test', {
        method: 'POST',
        body: JSON.stringify({ telefono: testTel, mensaje: testMsg }),
      })
      if (data.ok) setMsg(`✅ Mensaje enviado a ${data.chatId}`)
      else setError(data.error || 'Error al enviar')
    } catch (e) { setError(e.message) }
    setSending(false)
  }

  const handleRunAlerts = async () => {
    setRunning(true); setRunResult(null); setError('')
    try {
      const data = await apiFetch('/api/whatsapp/run-alerts', {
        method: 'POST',
        body: JSON.stringify({ dias: diasAlerta }),
      })
      setRunResult(data)
    } catch (e) { setError(e.message) }
    setRunning(false)
  }

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.disconnected

  return (
    <DashboardLayout title="WhatsApp">
      <div className="max-w-2xl space-y-6">

        {/* Estado */}
        <div className="bg-gym-card border border-gym-border rounded-xl p-6">
          <h2 className="text-gym-white font-semibold mb-4">Estado de conexión</h2>
          <div className="flex items-center gap-3 mb-6">
            <span className={`inline-block w-3 h-3 rounded-full ${cfg.dot} animate-pulse`} />
            <span className={`font-medium ${cfg.color}`}>{cfg.icon} {cfg.label}</span>
          </div>
          <div className="flex gap-3">
            {status !== 'ready' && (
              <Button variant="primary" onClick={handleConnect} disabled={loading || status === 'connecting'}>
                {status === 'connecting' ? 'Conectando...' : '🔗 Conectar WhatsApp'}
              </Button>
            )}
            {['ready', 'connecting', 'qr_ready'].includes(status) && (
              <Button variant="ghost" onClick={handleDisconnect} disabled={loading}>
                Desconectar
              </Button>
            )}
          </div>
        </div>

        {/* QR */}
        {qrImage && (
          <div className="bg-gym-card border border-gym-purple/50 rounded-xl p-6 text-center">
            <h2 className="text-gym-white font-semibold mb-2">Escaneá el QR con WhatsApp</h2>
            <p className="text-gym-gray text-sm mb-4">
              Abrí WhatsApp → Dispositivos vinculados → Vincular dispositivo
            </p>
            <div className="inline-block bg-white rounded-xl p-3">
              <img src={qrImage} alt="QR WhatsApp" className="w-52 h-52" />
            </div>
            <p className="text-gym-gray text-xs mt-3">El QR se actualiza automáticamente</p>
          </div>
        )}

        {/* Alertas */}
        <div className="bg-gym-card border border-gym-border rounded-xl p-6">
          <h2 className="text-gym-white font-semibold mb-1">Alertas automáticas</h2>
          <p className="text-gym-gray text-sm mb-4">
            Todos los días a las <strong className="text-gym-white">9:00 AM</strong> se envía
            un mensaje a alumnos con vencimiento próximo.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-gym-gray text-sm">Alertas en:</label>
            <select
              value={diasAlerta}
              onChange={e => setDiasAlerta(Number(e.target.value))}
              className="gym-input w-24 text-sm"
            >
              {[1,2,3,5,7,10,14,30].map(d => <option key={d} value={d}>{d} días</option>)}
            </select>
            <Button variant="secondary" onClick={handleRunAlerts} disabled={running || status !== 'ready'}>
              {running ? 'Enviando...' : '▶ Ejecutar ahora'}
            </Button>
          </div>
          {status !== 'ready' && (
            <p className="text-yellow-400 text-xs mt-2">⚠ Conectá WhatsApp primero</p>
          )}
          {runResult && (
            <div className="mt-3 bg-green-400/10 border border-green-400/30 rounded-lg p-3 text-sm">
              <span className="text-green-400 font-medium">✓ </span>
              <span className="text-gym-white">{runResult.enviados ?? 0} mensajes enviados</span>
              {runResult.errores > 0 && <span className="text-red-400 ml-2">{runResult.errores} errores</span>}
            </div>
          )}
        </div>

        {/* Test */}
        <div className="bg-gym-card border border-gym-border rounded-xl p-6">
          <h2 className="text-gym-white font-semibold mb-4">Mensaje de prueba</h2>
          <form onSubmit={handleTestSend} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gym-gray mb-1.5">Teléfono</label>
              <input
                type="tel" value={testTel} onChange={e => setTestTel(e.target.value)}
                placeholder="+54 9 261 123-4567"
                className="gym-input w-full text-sm" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gym-gray mb-1.5">Mensaje</label>
              <textarea
                rows={3} value={testMsg} onChange={e => setTestMsg(e.target.value)}
                className="w-full bg-gym-dark border border-gym-border text-gym-white placeholder:text-gym-grays rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gym-purple resize-none"
              />
            </div>
            <Button variant="primary" type="submit" disabled={sending || status !== 'ready'}>
              {sending ? 'Enviando...' : '📤 Enviar prueba'}
            </Button>
          </form>
        </div>

        {msg   && <p className="text-green-400 text-sm">{msg}</p>}
        {error && <p className="text-red-400 text-sm">❌ {error}</p>}
      </div>
    </DashboardLayout>
  )
}
