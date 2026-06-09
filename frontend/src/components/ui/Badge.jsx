const variants = {
  activo:    'bg-green-900/40  text-green-400  border-green-800',
  moroso:    'bg-red-900/40    text-red-400    border-red-800',
  inactivo:  'bg-zinc-800      text-zinc-400   border-zinc-700',
  vencido:   'bg-red-900/40    text-red-400    border-red-800',
  pendiente: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
  pagado:    'bg-green-900/40  text-green-400  border-green-800',
  purple:    'bg-purple-900/40 text-purple-300 border-purple-800',
  yellow:    'bg-yellow-900/40 text-yellow-400 border-yellow-800',
  default:   'bg-zinc-800      text-zinc-400   border-zinc-700',
}

const labels = {
  activo:    'Activo',
  moroso:    'Moroso',
  inactivo:  'Inactivo',
  vencido:   'Vencido',
  pendiente: 'Por vencer',
  pagado:    'Al día',
}

export default function Badge({ status, label, className = '' }) {
  const variant = variants[status] || variants.default
  const text    = label || labels[status] || status

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variant} ${className}`}>
      {text}
    </span>
  )
}
