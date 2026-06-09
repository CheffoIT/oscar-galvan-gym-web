import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/ui/Button'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const STATUS_CONFIG = {
  ready:        { label: 'Conectado',       color: 'text-green-400',  dot: 'bg-green-400',  icon: '✅' },
  qr_ready:     { label: 'Esperando escaneo', color: 'text-yellow-400', dot: 'bg-yellow-400', icon: '📱' },
  connecting:   { label: 'Conectando...',   color: 'text-blue-400',   dot: 'bg-blue-400',   icon: '⏳' },
  disconnected: { label: 'Desconectado',    color: 'text-gym-gray',   dot: 'bg-gym-gray',   icon: '⭕' },
  error:        { label: 'Error',           color: 'text-red-400',    dot: 'bg-red-400',    icon: '❌' },
}

function authHeaders() {
  const token = localStorage.getItem('gym_token')
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

export default function WhatsappPage() {
  const [status,    setStatus]    = useState('disconnected')
  const [qrImage,   setQrImage]   = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [msg,       setMsg]       = useState('')
  const [error,     setError]     = useState('')

  // Test message state
  const [testTel,   setTestTel]   = useState('')
  const [testMsg,   setTestMsg]   = useState('Hola! Este es un mensaje de prueba de Oscar Galván Gym 💪')
  const [sending,   setSending]   = useState(false)

  // Manual alerts state
  const [diasAlerta, setDiasAlerta] = useState(7)
  const [runResult,  setRunResult]  = useState(null)
  const [running,    setRunning]    = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/api/whatsapp/status`, { headers: authHeaders() })
      const data = await res.json()
      setStatus(data.status)
      if (data.hasQr) {
        const qrRes  = await fetch(`${API}/api/whatsapp/qr`, { headers: authHeaders() })
        const qrData = await qrRes.json()
        setQrImage(qrData.qr || null)
      } else {
        setQrImage(null)
      }
    } catch {
      // silencioso
    }
  }, [])

  // Poll estado cada 4 segundos mientras no esté listo
  useEffect(() => {
    fetchStatus()
    const interval = setInterval(() => {
      if (status !== 'ready') fetchStatus()
    }, 4000)
    return () => clearInterval(interval)
  }, [fetchStatus, status])

  const handleConnect = async () => {
    setLoading(true)
    setError('')
    setMsg('')
    try {
      const res  = await fetch(`${API}/api/whatsapp/connect`, { method: 'POST', headers: authHeaders() })
      const data = await res.json()
      setMsg(data.message)
      setTimeout(fetchStatus, 2000)
    } catch (e) {
      setError('Error conectando: ' + e.message)
    }
    setLoading(false)
  }

  const handleDisconnect = async () => {
    setLoading(true)
    setError('')
    setMsg('')
    try {
      const res  = await fetch(`${API}/api/whatsapp/disconnect`, { method: 'POST', headers: authHeaders() })
      const data = await res.json()
      setMsg(data.message)
      setQrImage(null)
      await fetchStatus()
    } catch (e) {
      setError('Error desconectando: ' + e.message)
    }
    setLoading(false)
  }

  const handleTestSend = async (e) => {
    e.preventDefault()
    if (!testTel) return
    setSending(true)
    setError('')
    setMsg('')
    try {
      const res = await fetch(`${API}/api/whatsapp/test`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ telefono: testTel, mensaje: testMsg }),
      })
      const data = await res.json()
      if (data.ok) {
        setMsg(`✅ Mensaje enviado a ${data.chatId}`)
      } else {
        setError(data.error || 'Error al enviar')
      }
    } catch (e) {
      setError('Error: ' + e.message)
    }
    setSending(false)
  }

  const handleRunAlerts = async () => {
    setRunning(true)
    setRunResult(null)
    setError('')
    try {
      const res  = await fetch(`${API}/api/whatsapp/run-alerts`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ dias: diasAlerta }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setRunResult(data)
      }
    } catch (e) {
      setError('Error: ' + e.message)
    }
    setRunning(false)
  }

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.disconnected

  return (
    <DashboardLayout title="WhatsApp">
      <div className="max-w-2xl space-y-6">

        {/* ── Estado ── */}
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
            {(status === 'ready' || status === 'connecting' || status === 'qr_ready') && (
              <Button variant="ghost" onClick={handleDisconnect} disabled={loading}>
                Desconectar
              </Button>
            )}
          </div>
        </div>

        {/* ── QR ── */}
        {qrImage && (
          <div className="bg-gym-card border border-gym-purple/50 rounded-xl p-6 text-center">
            <h2 className="text-gym-white font-semibold mb-2">Escaneá el QR con WhatsApp</h2>
            <p className="text-gym-gray text-sm mb-4">
              Abrí WhatsApp en tu celular → Dispositivos vinculados → Vincular dispositivo
            </p>
            <div className="inline-block bg-white rounded-xl p-3">
              <img src={qrImage} alt="QR WhatsApp" className="w-52 h-52" />
            </div>
            <p className="text-gym-gray text-xs mt-3">El QR se actualiza automáticamente</p>
          </div>
        )}

        {/* ── Alertas automáticas ── */}
        <div className="bg-gym-card border border-gym-border rounded-xl p-6">
          <h2 className="text-gym-white font-semibold mb-1">Alertas automáticas</h2>
          <p className="text-gym-gray text-sm mb-4">
            Todos los días a las <strong className="text-gym-white">9:00 AM</strong> (hora Argentina)
            el sistema envía un mensaje a cada alumno cuyo plan vence en los próximos días.
          </p>

          <div className="bg-gym-black/40 border border-gym-border rounded-lg p-4 text-sm text-gym-gray mb-4">
            <p className="text-gym-white font-medium mb-1">Mensaje que recibe el alumno:</p>
            <p className="italic">
              "Hola Juan! 👋<br/>
              Te recordamos que tu membresía en <strong>Oscar Galván Gym</strong> vence en <strong>7 días</strong> (2026-06-16).<br/>
              Para renovar y seguir entrenando sin interrupciones, acercate al gimnasio o contactanos.<br/>
              💪 ¡Seguí entrenando fuerte!"
            </p>
          </div>

          {/* Trigger manual */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-gym-gray text-sm">Enviar alertas a alumnos con vencimiento en:</label>
            <select
              value={diasAlerta}
              onChange={e => setDiasAlerta(Number(e.target.value))}
              className="gym-input w-24 text-sm"
            >
              {[1, 2, 3, 5, 7, 10, 14, 30].map(d => (
                <option key={d} value={d}>{d} días</option>
              ))}
            </select>
            <Button
              variant="secondary"
              onClick={handleRunAlerts}
              disabled={running || status !== 'ready'}
            >
              {running ? 'Enviando...' : '▶ Ejecutar ahora'}
            </Button>
          </div>
          {status !== 'ready' && (
            <p className="text-yellow-400 text-xs mt-2">⚠ Conectá WhatsApp para poder enviar alertas</p>
          )}
          {runResult && (
            <div className="mt-3 bg-green-400/10 border border-green-400/30 rounded-lg p-3 text-sm">
              <span className="text-green-400 font-medium">Resumen: </span>
              <span className="text-gym-white">{runResult.enviados} mensajes enviados</span>
              {runResult.errores > 0 && (
                <span className="text-red-400 ml-2">{runResult.errores} errores</span>
              )}
              {runResult.omitidos && (
                <span className="text-gym-gray ml-2">({runResult.omitidos})</span>
              )}
            </div>
          )}
        </div>

        {/* ── Test ── */}
        <div className="bg-gym-card border border-gym-border rounded-xl p-6">
          <h2 className="text-gym-white font-semibold mb-4">Enviar mensaje de prueba</h2>
          <form onSubmit={handleTestSend} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gym-gray mb-1.5">Teléfono</label>
              <input
                type="tel"
                value={testTel}
                onChange={e => setTestTel(e.target.value)}
                placeholder="+54 9 261 123-4567"
                className="gym-input w-full text-sm"
                required
              />
              <p className="text-gym-grays text-xs mt-1">Ingresá el número con código de país</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gym-gray mb-1.5">Mensaje</label>
              <textarea
                rows={3}
                value={testMsg}
                onChange={e => setTestMsg(e.target.value)}
                className="w-full bg-gym-dark border border-gym-border text-gym-white placeholder:text-gym-grays
                  rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gym-purple resize-none"
              />
            </div>
            <Button
              variant="primary"
              type="submit"
              disabled={sending || status !== 'ready'}
            >
              {sending ? 'Enviando...' : '📤 Enviar prueba'}
            </Button>
          </form>
        </div>

        {/* ── Feedback global ── */}
        {msg   && <p className="text-green-400 text-sm">{msg}</p>}
        {error && <p className="text-red-400 text-sm">❌ {error}</p>}
      </div>
    </DashboardLayout>
  )
}
