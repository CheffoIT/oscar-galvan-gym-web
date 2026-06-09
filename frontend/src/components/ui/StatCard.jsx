export default function StatCard({ icon, label, value, sub, accentColor = 'yellow', trend, onClick }) {
  const accent = {
    yellow: 'text-gym-yellow',
    purple: 'text-gym-purplel',
    green:  'text-green-400',
    red:    'text-red-400',
    white:  'text-gym-white',
  }

  return (
    <div
      onClick={onClick}
      className={`bg-gym-card border border-gym-border rounded-xl p-5 flex items-start gap-4
        transition-all duration-300 hover:border-gym-purple/40 hover:shadow-gym
        ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Icono */}
      <div className={`text-3xl flex-shrink-0 ${accent[accentColor]}`}>
        {icon}
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <p className="text-gym-gray text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
        <p className={`text-3xl font-bold ${accent[accentColor]}`}>{value}</p>
        {sub && <p className="text-gym-gray text-xs mt-1">{sub}</p>}
        {trend && (
          <p className={`text-xs mt-1 font-medium ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs mes anterior
          </p>
        )}
      </div>
    </div>
  )
}
