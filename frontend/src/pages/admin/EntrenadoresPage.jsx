import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card   from '../../components/ui/Card'
import Badge  from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal  from '../../components/ui/Modal'
import Input  from '../../components/ui/Input'
import { supabase } from '../../services/supabaseClient'

const FORM_INICIAL = {
  nombre: '', apellido: '', email: '', especialidad: '', bio: '', activo: true,
}

export default function EntrenadoresPage() {
  const [entrenadores, setEntrenadores] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [modalOpen,    setModalOpen]    = useState(false)
  const [form,         setForm]         = useState(FORM_INICIAL)
  const [saving,       setSaving]       = useState(false)
  const [saveMsg,      setSaveMsg]      = useState('')
  const [saveError,    setSaveError]    = useState('')

  const cargarEntrenadores = useCallback(async () => {
    setLoading(true)
    if (supabase) {
      const { data, error } = await supabase
        .from('entrenadores')
        .select(`
          id, especialidad, bio, foto_url, activo, created_at,
          perfiles ( id, nombre, apellido, activo )
        `)
        .order('created_at', { ascending: false })

      if (!error) setEntrenadores(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { cargarEntrenadores() }, [cargarEntrenadores])

  const handleGuardar = async (e) => {
    e.preventDefault()
    if (!form.nombre || !form.apellido || !form.email) {
      setSaveError('Nombre, apellido y email son obligatorios.')
      return
    }
    if (!supabase) {
      setSaveError('Supabase no está configurado.')
      return
    }

    setSaving(true)
    setSaveError('')

    // 1. Crear el usuario en Supabase Auth con una contraseña temporal
    const tempPassword = `Gym${Math.random().toString(36).slice(2,10)}!`
    const { data: authData, error: authError } = await supabase.auth.admin
      ? await supabase.auth.admin.createUser({
          email: form.email,
          password: tempPassword,
          email_confirm: true,
        })
      : { data: null, error: { message: 'Se requiere service role para crear usuarios. Creá el usuario manualmente en Supabase Auth.' } }

    if (authError) {
      // Fallback: crear solo el registro de entrenador si el perfil ya existe
      setSaveError('⚠️ ' + authError.message + ' — Si el usuario ya tiene cuenta, buscalo en Supabase Auth y asignale el rol manualmente.')
      setSaving(false)
      return
    }

    if (authData?.user) {
      // 2. Crear perfil
      await supabase.from('perfiles').insert({
        id:      authData.user.id,
        nombre:  form.nombre,
        apellido:form.apellido,
        rol:     'entrenador',
      })

      // 3. Crear registro de entrenador
      await supabase.from('entrenadores').insert({
        perfil_id:   authData.user.id,
        especialidad:form.especialidad,
        bio:         form.bio,
        activo:      true,
      })
    }

    setSaveMsg(`✅ Entrenador creado. Email: ${form.email} / Contraseña temporal: ${tempPassword}`)
    await cargarEntrenadores()
    setTimeout(() => { setModalOpen(false); setForm(FORM_INICIAL); setSaveMsg('') }, 4000)
    setSaving(false)
  }

  const toggleActivo = async (entrenador) => {
    if (!supabase) return
    await supabase.from('entrenadores').update({ activo: !entrenador.activo }).eq('id', entrenador.id)
    await cargarEntrenadores()
  }

  return (
    <DashboardLayout title="Entrenadores">
      <div className="flex items-center justify-between mb-6">
        <p className="text-gym-gray text-sm">{entrenadores.length} entrenadores registrados</p>
        <Button variant="primary" onClick={() => { setForm(FORM_INICIAL); setSaveMsg(''); setSaveError(''); setModalOpen(true) }}>
          + Nuevo entrenador
        </Button>
      </div>

      {loading ? (
        <p className="text-gym-gray text-sm text-center py-8">Cargando entrenadores...</p>
      ) : entrenadores.length === 0 ? (
        <div className="text-center py-12 text-gym-gray">
          <p className="text-4xl mb-3">🏋️</p>
          <p>No hay entrenadores registrados aún.</p>
          <p className="text-xs mt-1">Usá el botón "+ Nuevo entrenador" para agregar el primero.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {entrenadores.map(e => (
            <Card key={e.id} hover>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gym-purple/30 border border-gym-purple/50 rounded-full
                    flex items-center justify-center text-gym-purplel font-bold text-lg">
                    {(e.perfiles?.nombre || '?')[0]}
                  </div>
                  <div>
                    <p className="text-gym-white font-semibold">
                      {e.perfiles?.nombre} {e.perfiles?.apellido}
                    </p>
                    <p className="text-gym-gray text-xs">{e.especialidad || 'Sin especialidad'}</p>
                  </div>
                </div>
                <Badge status={e.activo ? 'activo' : 'inactivo'} label={e.activo ? 'Activo' : 'Inactivo'} />
              </div>

              {e.bio && (
                <p className="text-gym-gray text-xs leading-relaxed mb-4 line-clamp-3">{e.bio}</p>
              )}

              <div className="flex gap-2 pt-3 border-t border-gym-border">
                <Button
                  variant={e.activo ? 'ghost' : 'secondary'}
                  size="sm"
                  fullWidth
                  onClick={() => toggleActivo(e)}
                >
                  {e.activo ? '⏸ Desactivar' : '▶️ Activar'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Nuevo entrenador */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="NUEVO ENTRENADOR">
        <form onSubmit={handleGuardar} className="space-y-4">
          <div className="bg-gym-black/40 border border-gym-border rounded-lg p-3 text-xs text-gym-gray">
            <p>⚠️ Al crear un entrenador se crea su cuenta de acceso. Se generará una contraseña temporal que deberás compartirle.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre *" placeholder="Carlos" value={form.nombre}
              onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} required />
            <Input label="Apellido *" placeholder="Ramos" value={form.apellido}
              onChange={e => setForm(p => ({ ...p, apellido: e.target.value }))} required />
          </div>
          <Input label="Email *" type="email" placeholder="entrenador@gym.com" value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          <Input label="Especialidad" placeholder="Musculación, Crossfit..." value={form.especialidad}
            onChange={e => setForm(p => ({ ...p, especialidad: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium text-gym-gray mb-1.5">Biografía</label>
            <textarea rows={3} value={form.bio}
              onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
              placeholder="Descripción del entrenador..."
              className="w-full bg-gym-dark border border-gym-border text-gym-white placeholder:text-gym-grays
                rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gym-purple resize-none" />
          </div>
          {saveError && <p className="text-red-400 text-sm">{saveError}</p>}
          {saveMsg   && <p className="text-green-400 text-sm">{saveMsg}</p>}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? 'Creando...' : 'Crear entrenador'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}
