import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard        from '../../components/ui/StatCard'
import Card            from '../../components/ui/Card'
import Badge           from '../../components/ui/Badge'
import { useAuth }     from '../../hooks/useAuth'
import { getEstadisticasDashboard, getAlumnos } from '../../services/api'
import { estadisticasPagos } from '../../data/pagosMock'
import { useGymConfig } from '../../contexts/GymConfigContext'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

export default function AdminDashboard() {
  const { user } = useAuth()
  const { config } = useGymConfig()
  const [stats, setStats] = useState(null)
  const [morosos, setMorosos] = useState([])
  const [porVencer, setPorVencer] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getEstadisticasDashboard(),
      getAlumnos({ estado: 'moroso' }),
      getAlumnos(),
    ]).then(([{ data: statsData }, { data: morososData }, { data: todosData }]) => {
      if (statsData) setStats(statsData)
      if (morososData) setMorosos(morososData.slice(0, 5))

      // Calcular alumnos por vencer (próximos 7 días) desde pagos
      // Se hace en el dashboard de stats, aquí lo calculamos desde los datos de alumnos
      if (todosData) {
        // No tenemos fecha_vencimiento en el listado de alumnos directamente,
        // usamos datos de pagos del mock como fallback
      }
      setLoading(false)
    })
  }, [])

  const waUrl = `https://wa.me/${(config?.whatsapp || '').replace(/\D/g,'')}`

  const chartData = estadisticasPagos.ingresosMes

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-gym-gray text-sm">Cargando datos...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Dashboard">
      {/* Bienvenida */}
      <div className="mb-8">
        <h2 className="font-display text-3xl text-gym-white tracking-wider">
          BUEN DÍA, <span className="text-gym-yellow">{user?.nombre?.toUpperCase() || 'ADMIN'}</span> 💪
        </h2>
        <p className="text-gym-gray text-sm mt-1">Resumen del gimnasio al día de hoy.</p>
      </div>

      {/* ── KPI Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="👥" label="Alumnos activos"  value={stats?.totalActivos   ?? '—'} accentColor="yellow" />
        <StatCard icon="💰" label="Morosos"           value={stats?.totalMorosos   ?? '—'} accentColor="red"    />
        <StatCard icon="✅" label="Asistencias hoy"   value={stats?.asistenciasHoy ?? '—'} accentColor="green"  />
        <StatCard icon="💵" label="Ingresos del mes"
          value={stats?.ingresoMes ? `$${(stats.ingresoMes/1000).toFixed(0)}k` : '—'}
          accentColor="purple" />
      </div>

      {/* ── Alertas y gráfico ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Gráfico de ingresos (mock histórico hasta tener más datos) */}
        <Card className="lg:col-span-2" hover={false}>
          <h3 className="font-display text-lg text-gym-white tracking-wider mb-4">
            📈 INGRESOS POR MES
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="mes" tick={{ fill:'#A1A1AA', fontSize:12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#A1A1AA', fontSize:11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background:'#1a1a2e', border:'1px solid #3B0764', borderRadius:'8px', color:'#F8FAFC' }}
                formatter={v => [`$${v.toLocaleString('es-AR')}`, 'Ingresos']}
              />
              <Bar dataKey="total" radius={[4,4,0,0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={i === chartData.length - 1 ? '#EAB308' : '#6B21A8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gym-gray mt-2">
            Ingreso mes actual: <span className="text-gym-yellow font-bold">
              ${(stats?.ingresoMes || 0).toLocaleString('es-AR')}
            </span>
          </p>
        </Card>

        {/* Resumen rápido */}
        <Card hover={false} accent>
          <h3 className="font-display text-lg text-gym-white tracking-wider mb-4">
            📊 RESUMEN
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Alumnos activos',   val: stats?.totalActivos   ?? 0, color: 'text-green-400' },
              { label: 'Morosos',           val: stats?.totalMorosos   ?? 0, color: 'text-red-400'   },
              { label: 'Inactivos',         val: stats?.totalInactivos ?? 0, color: 'text-gym-gray'  },
              { label: 'Asistencias hoy',   val: stats?.asistenciasHoy ?? 0, color: 'text-gym-yellow' },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-gym-gray text-sm">{label}</span>
                <span className={`font-bold text-lg ${color}`}>{val}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Alumnos morosos ───────────────────────────── */}
      {morosos.length > 0 && (
        <Card hover={false} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg text-gym-white tracking-wider">
              🔴 ALUMNOS MOROSOS ({morosos.length})
            </h3>
            <Link to="/admin/pagos" className="text-xs text-gym-yellow hover:underline">Ver todos →</Link>
          </div>
          <div className="space-y-3">
            {morosos.map(a => (
              <div key={a.id}
                className="flex items-center justify-between py-3 border-b border-gym-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-900/40 border border-red-800 rounded-full
                    flex items-center justify-center text-red-400 font-bold text-sm">
                    {(a.nombre || '?')[0]}
                  </div>
                  <div>
                    <p className="text-gym-white text-sm font-medium">{a.nombre} {a.apellido}</p>
                    <p className="text-gym-gray text-xs">{a.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status="moroso" />
                  {config?.whatsapp && a.telefono && (
                    <a
                      href={`https://wa.me/${a.telefono.replace(/\D/g,'')}?text=${encodeURIComponent(`Hola ${a.nombre}, te recordamos que tu membresía venció. Por favor regularizá tu situación.`)}`}
                      target="_blank" rel="noreferrer"
                      className="text-green-400 text-xs hover:underline hidden sm:block"
                    >
                      📱 WA
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Accesos rápidos ───────────────────────────── */}
      <div>
        <h3 className="font-display text-lg text-gym-white tracking-wider mb-4">ACCESOS RÁPIDOS</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { path:'/admin/alumnos',       icon:'👥', label:'Alumnos',       color:'yellow' },
            { path:'/admin/entrenadores',  icon:'🏋️',  label:'Entrenadores',  color:'purple' },
            { path:'/admin/pagos',         icon:'💰', label:'Pagos',         color:'green'  },
            { path:'/admin/configuracion', icon:'⚙️',  label:'Configuración', color:'gray'   },
          ].map(({ path, icon, label }) => (
            <Link
              key={path}
              to={path}
              className="bg-gym-card border border-gym-border rounded-xl p-5 text-center
                hover:border-gym-purple/50 hover:shadow-gym transition-all duration-300 group"
            >
              <div className="text-3xl mb-2">{icon}</div>
              <p className="text-gym-white text-sm font-medium group-hover:text-gym-yellow transition-colors">
                {label}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
