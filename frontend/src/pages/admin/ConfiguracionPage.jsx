import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card   from '../../components/ui/Card'
import Input  from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { getConfiguracion, updateConfiguracion, getMembresias } from '../../services/api'
import { configuracionGym } from '../../data/configuracionGymMock'
import { supabase } from '../../services/supabaseClient'
import { useGymConfig } from '../../contexts/GymConfigContext'

export default function ConfiguracionPage() {
  const { reload: reloadConfig } = useGymConfig()
  const [config,     setConfig]     = useState({ ...configuracionGym })
  const [planes,     setPlanes]     = useState([])
  const [saved,      setSaved]      = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [savedPlanes,setSavedPlanes]= useState(false)
  const [savingPlan, setSavingPlan] = useState(null)
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(true)

  // Cargar configuración y planes desde Supabase al montar
  useEffect(() => {
    Promise.all([
      getConfiguracion(),
      getMembresias(),
    ]).then(([{ data: confData }, { data: planesData }]) => {
      if (confData)   setConfig(prev => ({ ...prev, ...confData }))
      if (planesData) setPlanes(planesData)
      setLoading(false)
    })
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const updates = {
      nombre:                config.nombre,
      slogan:                config.slogan,
      frase_hero:            config.fraseHero            || config.frase_hero,
      subfrase_hero:         config.subfraseHero         || config.subfrase_hero,
      whatsapp:              config.whatsapp,
      instagram:             config.instagram,
      direccion:             config.direccion,
      cbu:                   config.cbu,
      alias_cbu:             config.alias_cbu            || config.alias,
      caminatas_dias:        config.caminatas_dias,
      caminatas_lugar:       config.caminatas_lugar,
      caminatas_duracion:    config.caminatas_duracion,
      caminatas_instructor:  config.caminatas_instructor,
      caminatas_descripcion: config.caminatas_descripcion,
      horario_lunes:         config.horario_lunes,
      horario_martes:        config.horario_martes,
      horario_miercoles:     config.horario_miercoles,
      horario_jueves:        config.horario_jueves,
      horario_viernes:       config.horario_viernes,
      horario_sabado:        config.horario_sabado,
      horario_domingo:       config.horario_domingo,
      servicios:             config.servicios,
      beneficios:            config.beneficios,
    }

    const { error: saveError } = await updateConfiguracion(updates)
    setSaving(false)

    if (saveError) {
      setError('Error al guardar: ' + saveError.message)
    } else {
      await reloadConfig()  // Actualizar datos del gym en toda la app
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  // Actualizar un plan en el estado local
  const updatePlan = (index, field, value) => {
    setPlanes(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  // Guardar un plan individual en Supabase
  const savePlan = async (plan, index) => {
    if (!supabase) return
    setSavingPlan(index)
    const { error } = await supabase
      .from('membresias')
      .update({
        nombre:       plan.nombre,
        precio:       parseFloat(plan.precio),
        duracion_dias:parseInt(plan.duracion_dias),
        descripcion:  plan.descripcion,
      })
      .eq('id', plan.id)
    setSavingPlan(null)
    if (!error) {
      setSavedPlanes(true)
      setTimeout(() => setSavedPlanes(false), 2500)
    }
  }

  const field = (key, label, type = 'text', placeholder = '') => (
    <Input
      label={label}
      type={type}
      placeholder={placeholder}
      value={config[key] || ''}
      onChange={e => setConfig(prev => ({ ...prev, [key]: e.target.value }))}
    />
  )

  return (
    <DashboardLayout title="Configuración del Gimnasio">
      <p className="text-gym-gray text-sm mb-8">
        Todos los cambios se reflejan automáticamente en la landing page pública.
      </p>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Datos básicos */}
        <Card hover={false}>
          <h3 className="font-display text-lg text-gym-yellow tracking-wider mb-5">DATOS BÁSICOS</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('nombre',      'Nombre del gimnasio', 'text', 'Ej: Oscar Galvan Fuerza...')}
            {field('slogan',      'Slogan')}
            {field('fraseHero',   'Frase principal del hero')}
            {field('subfraseHero','Subfrase del hero')}
            {field('direccion',   'Dirección física')}
          </div>
        </Card>

        {/* Contacto */}
        <Card hover={false}>
          <h3 className="font-display text-lg text-gym-yellow tracking-wider mb-5">CONTACTO Y REDES</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('whatsapp',  'WhatsApp (con código de país)', 'text', '+5492615551234')}
            {field('instagram', 'Instagram (@handle)',           'text', 'oscargalvanfym')}
          </div>
        </Card>

        {/* Datos de pago */}
        <Card hover={false}>
          <h3 className="font-display text-lg text-gym-yellow tracking-wider mb-5">DATOS DE PAGO</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('cbu',      'CBU',       'text', '0000003100012345678900')}
            {field('alias_cbu','Alias CBU', 'text', 'MI.ALIAS.PAGO')}
          </div>
          <div className="mt-4 bg-gym-black/40 border border-gym-border rounded-xl p-4">
            <p className="text-gym-gray text-xs mb-1">Vista previa para el alumno:</p>
            <p className="text-gym-white text-sm">
              <span className="text-gym-gray">CBU: </span>
              <span className="font-mono text-gym-yellow">{config.cbu}</span>
            </p>
            <p className="text-gym-white text-sm">
              <span className="text-gym-gray">Alias: </span>
              <span className="font-mono text-gym-yellow">{config.alias_cbu || config.alias}</span>
            </p>
          </div>
        </Card>

        {/* Horarios */}
        <Card hover={false}>
          <h3 className="font-display text-lg text-gym-yellow tracking-wider mb-5">HORARIOS DE ATENCIÓN</h3>
          <p className="text-gym-gray text-xs mb-4">
            Escribí el horario de cada día. Ejemplo: <span className="text-gym-white font-mono">07:00 a 13:00 / 16:00 a 22:00</span> o <span className="text-gym-white font-mono">Cerrado</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: 'horario_lunes',     label: 'Lunes' },
              { key: 'horario_martes',    label: 'Martes' },
              { key: 'horario_miercoles', label: 'Miércoles' },
              { key: 'horario_jueves',    label: 'Jueves' },
              { key: 'horario_viernes',   label: 'Viernes' },
              { key: 'horario_sabado',    label: 'Sábados' },
              { key: 'horario_domingo',   label: 'Domingos' },
            ].map(({ key, label }) => (
              <Input
                key={key}
                label={label}
                placeholder="07:00 a 22:00 o Cerrado"
                value={config[key] || ''}
                onChange={e => setConfig(prev => ({ ...prev, [key]: e.target.value }))}
              />
            ))}
          </div>
        </Card>

        {/* Servicios */}
        <Card hover={false}>
          <h3 className="font-display text-lg text-gym-yellow tracking-wider mb-5">SERVICIOS</h3>
          <div className="space-y-3">
            {(config.servicios || []).map((s, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gym-black/30 border border-gym-border rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={s.icono || ''}
                    onChange={e => {
                      const updated = [...config.servicios]
                      updated[i] = { ...updated[i], icono: e.target.value }
                      setConfig(prev => ({ ...prev, servicios: updated }))
                    }}
                    className="w-14 bg-gym-dark border border-gym-border text-center rounded-lg px-2 py-2 text-lg focus:outline-none focus:border-gym-purple"
                    placeholder="💪"
                  />
                  <input
                    type="text"
                    value={s.titulo || ''}
                    onChange={e => {
                      const updated = [...config.servicios]
                      updated[i] = { ...updated[i], titulo: e.target.value }
                      setConfig(prev => ({ ...prev, servicios: updated }))
                    }}
                    className="flex-1 bg-gym-dark border border-gym-border text-gym-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gym-purple font-semibold"
                    placeholder="Nombre del servicio"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={s.descripcion || ''}
                    onChange={e => {
                      const updated = [...config.servicios]
                      updated[i] = { ...updated[i], descripcion: e.target.value }
                      setConfig(prev => ({ ...prev, servicios: updated }))
                    }}
                    className="w-full bg-gym-dark border border-gym-border text-gym-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gym-purple placeholder:text-gym-grays"
                    placeholder="Descripción del servicio..."
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-gym-grays text-xs mt-3">Icono (emoji) · Nombre · Descripción de cada servicio.</p>
        </Card>

        {/* Beneficios */}
        <Card hover={false}>
          <h3 className="font-display text-lg text-gym-yellow tracking-wider mb-5">¿POR QUÉ ELEGIRNOS?</h3>
          <div className="space-y-3">
            {(config.beneficios || []).map((b, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gym-black/30 border border-gym-border rounded-xl p-4">
                <input
                  type="text"
                  value={b.titulo || ''}
                  onChange={e => {
                    const updated = [...config.beneficios]
                    updated[i] = { ...updated[i], titulo: e.target.value }
                    setConfig(prev => ({ ...prev, beneficios: updated }))
                  }}
                  className="bg-gym-dark border border-gym-border text-gym-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gym-purple font-semibold"
                  placeholder="Título del beneficio"
                />
                <input
                  type="text"
                  value={b.desc || ''}
                  onChange={e => {
                    const updated = [...config.beneficios]
                    updated[i] = { ...updated[i], desc: e.target.value }
                    setConfig(prev => ({ ...prev, beneficios: updated }))
                  }}
                  className="bg-gym-dark border border-gym-border text-gym-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gym-purple placeholder:text-gym-grays"
                  placeholder="Descripción..."
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Caminatas */}
        <Card hover={false}>
          <h3 className="font-display text-lg text-gym-yellow tracking-wider mb-5">GRUPOS DE CAMINATA</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('caminatas_dias',       'Días y horario',   'text', 'Sábados 8:00 hs')}
            {field('caminatas_lugar',      'Lugar de encuentro','text','Parque General San Martín...')}
            {field('caminatas_duracion',   'Duración',         'text', '45 a 60 minutos')}
            {field('caminatas_instructor', 'Instructor',       'text', 'Oscar Galvan')}
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gym-gray mb-1.5">Descripción</label>
            <textarea
              rows={2}
              value={config.caminatas_descripcion || ''}
              onChange={e => setConfig(prev => ({ ...prev, caminatas_descripcion: e.target.value }))}
              placeholder="Descripción de las caminatas..."
              className="w-full bg-gym-dark border border-gym-border text-gym-white placeholder:text-gym-grays
                rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gym-purple focus:ring-1
                focus:ring-gym-purple/30 transition-all duration-200 resize-none"
            />
          </div>
        </Card>

        {/* Logo */}
        <Card hover={false}>
          <h3 className="font-display text-lg text-gym-yellow tracking-wider mb-5">LOGO E IMÁGENES</h3>
          <div className="flex items-center gap-5">
            {/* Vista previa */}
            <div className="w-20 h-20 bg-gym-purple/20 border border-dashed border-gym-purple/50 rounded-xl
              flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden">
              {config.logo_url ? (
                <img src={config.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : '🏋️'}
            </div>

            <div className="flex-1">
              <p className="text-gym-gray text-sm mb-3">Logo del gimnasio (PNG o JPG, máx 2MB)</p>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file || !supabase) return

                  // Validar tamaño
                  if (file.size > 2 * 1024 * 1024) {
                    setError('La imagen supera los 2MB.')
                    return
                  }

                  setSaving(true)
                  setError('')

                  // Subir a Supabase Storage
                  const ext      = file.name.split('.').pop()
                  const fileName = `logo-gym.${ext}`
                  const { data: uploadData, error: uploadErr } = await supabase.storage
                    .from('gym-assets')
                    .upload(fileName, file, { upsert: true })

                  if (uploadErr) {
                    setError('Error al subir imagen: ' + uploadErr.message)
                    setSaving(false)
                    return
                  }

                  // Obtener URL pública
                  const { data: urlData } = supabase.storage
                    .from('gym-assets')
                    .getPublicUrl(fileName)

                  const publicUrl = urlData.publicUrl

                  // Guardar URL en configuracion_gimnasio
                  await updateConfiguracion({ logo_url: publicUrl })
                  setConfig(prev => ({ ...prev, logo_url: publicUrl }))
                  await reloadConfig()  // Actualizar logo en toda la app
                  setSaving(false)
                  setSaved(true)
                  setTimeout(() => setSaved(false), 2500)
                }}
                className="text-xs text-gym-gray file:bg-gym-purple/30 file:border file:border-gym-purple/50
                  file:text-gym-purplel file:rounded-lg file:px-3 file:py-1.5 file:text-xs
                  file:cursor-pointer hover:file:bg-gym-purple/50 cursor-pointer"
              />
              {config.logo_url && (
                <p className="text-green-400 text-xs mt-2">✅ Logo cargado. Se muestra en la navbar de la landing.</p>
              )}
              {saving && <p className="text-gym-yellow text-xs mt-2">⏳ Subiendo imagen...</p>}
            </div>
          </div>
        </Card>

        {/* Guardar datos básicos */}
        <div className="flex items-center justify-end gap-3">
          {error && <span className="text-red-400 text-sm">{error}</span>}
          {saved && <span className="text-green-400 text-sm font-medium">✅ Cambios guardados en Supabase</span>}
          <Button type="submit" variant="primary" size="lg" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>

      {/* ── Planes y membresías ── */}
      <Card hover={false} className="mt-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg text-gym-yellow tracking-wider">PLANES Y PRECIOS</h3>
          {savedPlanes && <span className="text-green-400 text-sm">✅ Plan guardado</span>}
        </div>

        {planes.length === 0 ? (
          <p className="text-gym-gray text-sm">
            No se encontraron planes. Verificá que el seed fue ejecutado en Supabase.
          </p>
        ) : (
          <div className="space-y-4">
            {planes.map((plan, i) => (
              <div key={plan.id} className="bg-gym-black/40 border border-gym-border rounded-xl p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                  <Input
                    label="Nombre del plan"
                    value={plan.nombre || ''}
                    onChange={e => updatePlan(i, 'nombre', e.target.value)}
                  />
                  <Input
                    label="Precio ($)"
                    type="number"
                    value={plan.precio || ''}
                    onChange={e => updatePlan(i, 'precio', e.target.value)}
                  />
                  <Input
                    label="Duración (días)"
                    type="number"
                    value={plan.duracion_dias || ''}
                    onChange={e => updatePlan(i, 'duracion_dias', e.target.value)}
                  />
                  <div className="flex items-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      fullWidth
                      onClick={() => savePlan(plan, i)}
                      disabled={savingPlan === i}
                    >
                      {savingPlan === i ? 'Guardando...' : '💾 Guardar plan'}
                    </Button>
                  </div>
                </div>
                <Input
                  label="Descripción"
                  value={plan.descripcion || ''}
                  onChange={e => updatePlan(i, 'descripcion', e.target.value)}
                />
              </div>
            ))}
          </div>
        )}
        <p className="text-gym-grays text-xs mt-4">
          Los precios se actualizan en la landing page automáticamente al guardar.
        </p>
      </Card>
    </DashboardLayout>
  )
}
